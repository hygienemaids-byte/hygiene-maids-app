// @ts-nocheck
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/* ─── Supabase Admin Client (service role — bypasses RLS) ─── */
function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* ─── Helpers ─── */

/** Sequential booking number: fetch max from DB and increment */
async function nextBookingNumber(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase
    .from("bookings")
    .select("booking_number")
    .order("booking_number", { ascending: false })
    .limit(1)
    .single();
  return (data?.booking_number ?? 1000) + 1;
}

/** Estimate cleaning duration in minutes based on home size + extras */
function estimateDuration(
  bedrooms: number,
  bathrooms: number,
  sqftRange: string,
  extrasCount: number,
  estimatedHoursFromMatrix?: number
): number {
  if (estimatedHoursFromMatrix) {
    // Matrix provides hours; convert to minutes and add 15 min per extra
    return Math.round(estimatedHoursFromMatrix * 60 + extrasCount * 15);
  }
  // Fallback formula
  const base = 60;
  const perBed = 25;
  const perBath = 20;
  const sqftBonus = sqftRange.includes("2500") ? 30 : sqftRange.includes("2000") ? 20 : sqftRange.includes("1500") ? 10 : 0;
  return base + bedrooms * perBed + bathrooms * perBath + sqftBonus + extrasCount * 15;
}

/** Standard time slots (8 AM – 5 PM, 1-hour windows) */
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

/* ─── Interfaces ─── */

interface BookingPayload {
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Address (structured)
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  // Home details
  bedrooms: number;
  bathrooms: number;
  sqftRange: string;
  // Service
  frequency: string;
  selectedExtras: string[];
  // Schedule
  scheduledDate: string;
  scheduledTime: string;
  // Pets & access
  hasPets?: boolean;
  petDetails?: string;
  accessInstructions?: string;
  // Notes
  customerNotes?: string;
  // Pricing (server will re-verify)
  basePrice: number;
  discountPercentage: number;
  discountAmount: number;
  extrasTotal: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  estimatedHours: number;
  // Payment
  paymentMethod?: "card" | "cash" | "pay_at_service";
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/bookings — Create a new booking
   ═══════════════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const body: BookingPayload = await request.json();

    // ── Validation ──
    const errors: string[] = [];
    if (!body.firstName?.trim()) errors.push("First name is required");
    if (!body.lastName?.trim()) errors.push("Last name is required");
    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
      errors.push("Valid email is required");
    if (!body.phone?.trim() || body.phone.replace(/\D/g, "").length < 10)
      errors.push("Valid 10-digit phone number is required");
    if (!body.addressLine1?.trim()) errors.push("Street address is required");
    if (!body.city?.trim()) errors.push("City is required");
    if (!body.state?.trim()) errors.push("State is required");
    if (!body.zipCode?.trim() || !/^\d{5}$/.test(body.zipCode))
      errors.push("Valid 5-digit zip code is required");
    if (!body.scheduledDate) errors.push("Scheduled date is required");
    if (!body.scheduledTime) errors.push("Scheduled time is required");
    if (body.bedrooms === undefined || body.bedrooms === null)
      errors.push("Number of bedrooms is required");
    if (body.bathrooms === undefined || body.bathrooms === null)
      errors.push("Number of bathrooms is required");
    if (!body.sqftRange) errors.push("Square footage range is required");
    if (!body.frequency) errors.push("Cleaning frequency is required");
    if (body.total <= 0) errors.push("Invalid total amount");

    // Date validation — must be in the future
    const scheduledDate = new Date(body.scheduledDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduledDate < today) errors.push("Scheduled date must be in the future");

    // Time validation
    if (body.scheduledTime && !TIME_SLOTS.includes(body.scheduledTime))
      errors.push("Invalid time slot selected");

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const supabase = getSupabase();

    // ── Server-side price verification ──
    const [sqMin, sqMax] = body.sqftRange.split("-").map(Number);
    const { data: matrixEntry } = await supabase
      .from("pricing_matrix")
      .select("*")
      .eq("bedrooms", body.bedrooms)
      .eq("bathrooms", body.bathrooms)
      .eq("sqft_min", sqMin)
      .eq("sqft_max", sqMax)
      .eq("is_active", true)
      .single();

    if (!matrixEntry) {
      return NextResponse.json(
        { error: "Invalid pricing combination. Please go back and re-select your home details." },
        { status: 400 }
      );
    }

    // Verify base price matches (allow $0.01 tolerance for rounding)
    if (Math.abs(Number(matrixEntry.base_price) - body.basePrice) > 0.01) {
      return NextResponse.json(
        { error: "Price mismatch detected. Please refresh the page and try again." },
        { status: 400 }
      );
    }

    // Verify frequency discount
    const { data: freqDiscount } = await supabase
      .from("frequency_discounts")
      .select("discount_percentage")
      .eq("frequency", body.frequency)
      .eq("is_active", true)
      .single();

    const serverDiscountPct = freqDiscount ? Number(freqDiscount.discount_percentage) : 0;

    // Verify extras total
    let serverExtrasTotal = 0;
    if (body.selectedExtras.length > 0) {
      const { data: extrasData } = await supabase
        .from("extras")
        .select("id, price")
        .in("id", body.selectedExtras)
        .eq("is_active", true);
      serverExtrasTotal = (extrasData || []).reduce((sum, e) => sum + Number(e.price), 0);
    }

    // Recalculate server-side total
    const serverBase = Number(matrixEntry.base_price);
    const serverDiscount = serverBase * (serverDiscountPct / 100);
    const serverSubtotal = serverBase - serverDiscount + serverExtrasTotal;

    // Fetch tax rate
    const { data: taxData } = await supabase
      .from("tax_rates")
      .select("rate")
      .eq("is_active", true)
      .limit(1)
      .single();
    const serverTaxRate = taxData ? Number(taxData.rate) * 100 : 7.5;
    const serverTax = serverSubtotal * (serverTaxRate / 100);
    const serverTotal = serverSubtotal + serverTax;

    // Allow $1 tolerance for rounding differences
    if (Math.abs(serverTotal - body.total) > 1.0) {
      console.error("Price verification failed", {
        clientTotal: body.total,
        serverTotal,
        serverBase,
        serverDiscount,
        serverExtrasTotal,
        serverTax,
      });
      return NextResponse.json(
        { error: "Price verification failed. Please refresh and try again." },
        { status: 400 }
      );
    }

    // ── Service area verification ──
    const { data: serviceArea } = await supabase
      .from("service_areas")
      .select("id, city")
      .eq("zip_code", body.zipCode)
      .eq("is_active", true)
      .single();

    if (!serviceArea) {
      return NextResponse.json(
        { error: "We don't currently serve this zip code. Please check our service areas." },
        { status: 400 }
      );
    }

    // ── Availability check — prevent double-booking ──
    // Check if there are already too many bookings at this date/time
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id, provider_id")
      .eq("scheduled_date", body.scheduledDate)
      .eq("scheduled_time", body.scheduledTime)
      .not("status", "in", '("cancelled","no_show")');

    // Get total active providers
    const { data: activeProviders } = await supabase
      .from("providers")
      .select("id")
      .eq("status", "active");

    const maxSlots = activeProviders?.length || 3;
    const bookedSlots = existingBookings?.length || 0;

    if (bookedSlots >= maxSlots) {
      return NextResponse.json(
        {
          error: "This time slot is fully booked. Please select a different date or time.",
          availableSlots: 0,
        },
        { status: 409 }
      );
    }

    // ── Step 1: Create or update customer ──
    const normalizedEmail = body.email.toLowerCase().trim();
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, total_bookings, lifetime_value")
      .eq("email", normalizedEmail)
      .single();

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      await supabase
        .from("customers")
        .update({
          first_name: body.firstName.trim(),
          last_name: body.lastName.trim(),
          phone: body.phone.trim(),
          address_line1: body.addressLine1.trim(),
          address_line2: body.addressLine2?.trim() || null,
          city: body.city.trim(),
          state: body.state.trim(),
          zip_code: body.zipCode,
          total_bookings: (existingCustomer.total_bookings || 0) + 1,
          lifetime_value: Number(existingCustomer.lifetime_value || 0) + serverTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId);
    } else {
      const { data: newCustomer, error: custError } = await supabase
        .from("customers")
        .insert({
          first_name: body.firstName.trim(),
          last_name: body.lastName.trim(),
          email: normalizedEmail,
          phone: body.phone.trim(),
          address_line1: body.addressLine1.trim(),
          address_line2: body.addressLine2?.trim() || null,
          city: body.city.trim(),
          state: body.state.trim(),
          zip_code: body.zipCode,
          total_bookings: 1,
          lifetime_value: serverTotal,
        })
        .select("id")
        .single();

      if (custError) {
        console.error("Customer creation error:", custError);
        return NextResponse.json({ error: "Failed to create customer record" }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // ── Step 2: Create booking ──
    const bookingNumber = await nextBookingNumber(supabase);
    const duration = estimateDuration(
      body.bedrooms,
      body.bathrooms,
      body.sqftRange,
      body.selectedExtras.length,
      matrixEntry.estimated_hours
    );

    // Auto-assign provider if available
    let assignedProviderId: string | null = null;
    if (activeProviders && activeProviders.length > 0) {
      // Find providers who serve this zip code and aren't already booked at this time
      const bookedProviderIds = (existingBookings || [])
        .map((b) => b.provider_id)
        .filter(Boolean);

      const { data: availableProviders } = await supabase
        .from("providers")
        .select("id, service_area_zips, total_jobs_completed")
        .eq("status", "active")
        .not("id", "in", `(${bookedProviderIds.length > 0 ? bookedProviderIds.map(id => `"${id}"`).join(",") : "00000000-0000-0000-0000-000000000000"})`);

      if (availableProviders && availableProviders.length > 0) {
        // Prefer providers who serve this zip code, then by fewest jobs (load balancing)
        const preferred = availableProviders
          .filter((p) => p.service_area_zips?.includes(body.zipCode))
          .sort((a, b) => (a.total_jobs_completed || 0) - (b.total_jobs_completed || 0));

        assignedProviderId = preferred.length > 0
          ? preferred[0].id
          : availableProviders[0].id;
      }
    }

    const { data: booking, error: bookError } = await supabase
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        provider_id: assignedProviderId,
        scheduled_date: body.scheduledDate,
        scheduled_time: body.scheduledTime,
        status: assignedProviderId ? "confirmed" : "pending",
        frequency: body.frequency,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        sqft_range: body.sqftRange,
        estimated_duration: duration,
        address_line1: body.addressLine1.trim(),
        address_line2: body.addressLine2?.trim() || null,
        city: body.city.trim(),
        state: body.state.trim(),
        zip_code: body.zipCode,
        has_pets: body.hasPets || false,
        pet_details: body.petDetails || null,
        access_instructions: body.accessInstructions || null,
        base_price: serverBase,
        extras_total: serverExtrasTotal,
        discount_percentage: serverDiscountPct,
        discount_amount: serverDiscount,
        subtotal: serverSubtotal,
        tax_rate: serverTaxRate,
        tax_amount: serverTax,
        total: serverTotal,
        tip_amount: 0,
        provider_payout_percentage: 40,
        provider_payout_amount: Math.round(serverTotal * 0.4 * 100) / 100,
        customer_notes: body.customerNotes || null,
        is_recurring_parent: body.frequency !== "one_time",
      })
      .select("id, booking_number, status, scheduled_date, scheduled_time, total")
      .single();

    if (bookError) {
      console.error("Booking creation error:", bookError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // ── Step 3: Create booking extras ──
    if (body.selectedExtras.length > 0) {
      const { data: extrasData } = await supabase
        .from("extras")
        .select("id, price, name")
        .in("id", body.selectedExtras);

      const extrasInsert = (extrasData || []).map((extra) => ({
        booking_id: booking.id,
        extra_id: extra.id,
        quantity: 1,
        unit_price: Number(extra.price),
        total_price: Number(extra.price),
      }));

      const { error: extrasError } = await supabase
        .from("booking_extras")
        .insert(extrasInsert);

      if (extrasError) {
        console.error("Booking extras error:", extrasError);
      }
    }

    // ── Step 4: Create payment record (pay_at_service default) ──
    const paymentMethod = body.paymentMethod || "pay_at_service";
    await supabase.from("payments").insert({
      booking_id: booking.id,
      customer_id: customerId,
      amount: serverTotal,
      method: paymentMethod === "pay_at_service" ? "cash" : paymentMethod,
      status: paymentMethod === "card" ? "pending" : "unpaid",
      notes: paymentMethod === "pay_at_service" ? "Pay at time of service" : null,
    });

    // ── Step 5: Create notification ──
    try {
      await supabase.from("notifications").insert({
        type: "booking_created",
        title: "New Booking Received",
        message: `Booking #HM-${bookingNumber} from ${body.firstName} ${body.lastName} for ${body.scheduledDate} at ${body.scheduledTime}`,
        data: JSON.stringify({
          booking_id: booking.id,
          booking_number: bookingNumber,
          customer_name: `${body.firstName} ${body.lastName}`,
        }),
        is_read: false,
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.booking_number,
        status: booking.status,
        scheduledDate: booking.scheduled_date,
        scheduledTime: booking.scheduled_time,
        total: booking.total,
        estimatedDuration: duration,
        providerAssigned: !!assignedProviderId,
      },
      customer: {
        id: customerId,
        isReturning: !!existingCustomer,
      },
      message: assignedProviderId
        ? "Booking confirmed! A cleaner has been assigned."
        : "Booking received! We'll confirm and assign a cleaner shortly.",
    });
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process booking" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════
   GET /api/bookings — List bookings with filters
   ═══════════════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = getSupabase();

    // Filters
    const status = searchParams.get("status");
    const customerId = searchParams.get("customer_id");
    const customerEmail = searchParams.get("email");
    const providerId = searchParams.get("provider_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const date = searchParams.get("date"); // single date for availability
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // ── Availability mode: return available time slots for a date ──
    if (searchParams.get("mode") === "availability" && date) {
      const { data: dayBookings } = await supabase
        .from("bookings")
        .select("scheduled_time, provider_id")
        .eq("scheduled_date", date)
        .not("status", "in", '("cancelled","no_show")');

      const { data: providers } = await supabase
        .from("providers")
        .select("id")
        .eq("status", "active");

      const maxSlots = providers?.length || 3;
      const slotCounts: Record<string, number> = {};
      (dayBookings || []).forEach((b) => {
        slotCounts[b.scheduled_time] = (slotCounts[b.scheduled_time] || 0) + 1;
      });

      const availability = TIME_SLOTS.map((slot) => ({
        time: slot,
        label: formatTime(slot),
        available: (slotCounts[slot] || 0) < maxSlots,
        remaining: maxSlots - (slotCounts[slot] || 0),
      }));

      return NextResponse.json({ date, slots: availability, totalProviders: maxSlots });
    }

    // ── Lookup by email (for customer portal) ──
    if (customerEmail) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", customerEmail.toLowerCase().trim())
        .single();

      if (!customer) {
        return NextResponse.json({ bookings: [], total: 0 });
      }

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*, booking_extras(*, extras(name, price))")
        .eq("customer_id", customer.id)
        .order("scheduled_date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return NextResponse.json({ bookings: bookings || [], total: bookings?.length || 0 });
    }

    // ── Standard list with filters ──
    let query = supabase
      .from("bookings")
      .select("*, customers(first_name, last_name, email, phone), providers(first_name, last_name), booking_extras(*, extras(name, price))", { count: "exact" });

    if (status) query = query.eq("status", status);
    if (customerId) query = query.eq("customer_id", customerId);
    if (providerId) query = query.eq("provider_id", providerId);
    if (dateFrom) query = query.gte("scheduled_date", dateFrom);
    if (dateTo) query = query.lte("scheduled_date", dateTo);

    query = query
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: bookings, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      bookings: bookings || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════
   PATCH /api/bookings — Update a booking (reschedule, cancel, status change, assign)
   ═══════════════════════════════════════════════════════════════ */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabase();

    if (!body.id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Fetch current booking
    const { data: current, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", body.id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // ── Cancel ──
    if (body.action === "cancel") {
      if (["cancelled", "completed"].includes(current.status)) {
        return NextResponse.json({ error: `Cannot cancel a ${current.status} booking` }, { status: 400 });
      }
      updates.status = "cancelled";
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = body.reason || "Customer requested cancellation";

      // Update customer stats
      if (current.customer_id) {
        const { data: cust } = await supabase
          .from("customers")
          .select("total_bookings, lifetime_value")
          .eq("id", current.customer_id)
          .single();
        if (cust) {
          await supabase
            .from("customers")
            .update({
              total_bookings: Math.max(0, (cust.total_bookings || 1) - 1),
              lifetime_value: Math.max(0, Number(cust.lifetime_value || 0) - Number(current.total)),
            })
            .eq("id", current.customer_id);
        }
      }
    }

    // ── Reschedule ──
    if (body.action === "reschedule") {
      if (["cancelled", "completed", "in_progress"].includes(current.status)) {
        return NextResponse.json({ error: `Cannot reschedule a ${current.status} booking` }, { status: 400 });
      }
      if (!body.scheduledDate || !body.scheduledTime) {
        return NextResponse.json({ error: "New date and time are required for rescheduling" }, { status: 400 });
      }

      // Check availability for new slot
      const { data: conflicts } = await supabase
        .from("bookings")
        .select("id")
        .eq("scheduled_date", body.scheduledDate)
        .eq("scheduled_time", body.scheduledTime)
        .not("status", "in", '("cancelled","no_show")')
        .neq("id", body.id);

      const { data: providers } = await supabase
        .from("providers")
        .select("id")
        .eq("status", "active");

      if ((conflicts?.length || 0) >= (providers?.length || 3)) {
        return NextResponse.json({ error: "New time slot is fully booked" }, { status: 409 });
      }

      updates.scheduled_date = body.scheduledDate;
      updates.scheduled_time = body.scheduledTime;
      updates.admin_notes = `Rescheduled from ${current.scheduled_date} ${current.scheduled_time}. ${current.admin_notes || ""}`.trim();
    }

    // ── Assign provider ──
    if (body.action === "assign" && body.providerId) {
      // Verify provider exists and is active
      const { data: provider } = await supabase
        .from("providers")
        .select("id, first_name, last_name")
        .eq("id", body.providerId)
        .eq("status", "active")
        .single();

      if (!provider) {
        return NextResponse.json({ error: "Provider not found or inactive" }, { status: 400 });
      }

      // Check provider isn't double-booked
      const { data: providerConflicts } = await supabase
        .from("bookings")
        .select("id")
        .eq("provider_id", body.providerId)
        .eq("scheduled_date", current.scheduled_date)
        .eq("scheduled_time", current.scheduled_time)
        .not("status", "in", '("cancelled","no_show")')
        .neq("id", body.id);

      if (providerConflicts && providerConflicts.length > 0) {
        return NextResponse.json(
          { error: `${provider.first_name} ${provider.last_name} is already booked at this time` },
          { status: 409 }
        );
      }

      updates.provider_id = body.providerId;
      if (current.status === "pending") updates.status = "confirmed";
    }

    // ── Status change ──
    if (body.action === "status" && body.status) {
      const validTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["in_progress", "cancelled", "no_show"],
        in_progress: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
        no_show: [],
      };

      const allowed = validTransitions[current.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition from '${current.status}' to '${body.status}'` },
          { status: 400 }
        );
      }
      updates.status = body.status;

      // If completing, update payment status
      if (body.status === "completed") {
        await supabase
          .from("payments")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("booking_id", body.id)
          .eq("status", "unpaid");
      }
    }

    // ── General field updates (admin notes, etc.) ──
    if (body.adminNotes !== undefined) updates.admin_notes = body.adminNotes;
    if (body.providerNotes !== undefined) updates.provider_notes = body.providerNotes;

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", body.id)
      .select("id, booking_number, status, scheduled_date, scheduled_time, total")
      .single();

    if (updateError) {
      console.error("Booking update error:", updateError);
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      booking: updated,
      message: body.action === "cancel"
        ? "Booking cancelled successfully"
        : body.action === "reschedule"
        ? "Booking rescheduled successfully"
        : body.action === "assign"
        ? "Provider assigned successfully"
        : "Booking updated successfully",
    });
  } catch (error) {
    console.error("Bookings PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update booking" },
      { status: 500 }
    );
  }
}

/* ─── Utility ─── */
function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
