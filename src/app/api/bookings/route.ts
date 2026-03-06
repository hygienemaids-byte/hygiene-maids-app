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

/* ─── Constants ─── */
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

const BUFFER_MINUTES = 60; // 1 hour buffer between jobs per provider
const MAX_RECURRING_CHILDREN = 5; // 6 total = 1 parent + 5 children

/* ─── Helpers ─── */

async function nextBookingNumber(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase
    .from("bookings")
    .select("booking_number")
    .order("booking_number", { ascending: false })
    .limit(1)
    .single();
  return (data?.booking_number ?? 1000) + 1;
}

function estimateDuration(
  bedrooms: number, bathrooms: number, sqftRange: string,
  extrasCount: number, estimatedHoursFromMatrix?: number
): number {
  if (estimatedHoursFromMatrix) {
    return Math.round(estimatedHoursFromMatrix * 60 + extrasCount * 15);
  }
  const base = 60;
  return base + bedrooms * 25 + bathrooms * 20 +
    (sqftRange.includes("2500") ? 30 : sqftRange.includes("2000") ? 20 : sqftRange.includes("1500") ? 10 : 0) +
    extrasCount * 15;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function round2(n: number) { return Math.round(n * 100) / 100; }

/** Calculate next recurring dates based on frequency */
function getRecurringDates(startDate: string, frequency: string, count: number): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T12:00:00");

  for (let i = 1; i <= count; i++) {
    const next = new Date(start);
    switch (frequency) {
      case "weekly":
        next.setDate(next.getDate() + 7 * i);
        break;
      case "biweekly":
        next.setDate(next.getDate() + 14 * i);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + i);
        break;
      default:
        continue;
    }
    // Skip Sundays
    if (next.getDay() === 0) next.setDate(next.getDate() + 1);
    dates.push(next.toISOString().split("T")[0]);
  }
  return dates;
}

/** Check if a provider has a time conflict (including buffer) */
async function hasProviderConflict(
  supabase: SupabaseClient,
  providerId: string,
  date: string,
  time: string,
  durationMinutes: number,
  excludeBookingId?: string
): Promise<boolean> {
  const { data: dayBookings } = await supabase
    .from("bookings")
    .select("id, scheduled_time, estimated_duration")
    .eq("provider_id", providerId)
    .eq("scheduled_date", date)
    .not("status", "in", '("cancelled","no_show")')
    .neq("id", excludeBookingId || "00000000-0000-0000-0000-000000000000");

  if (!dayBookings || dayBookings.length === 0) return false;

  const newStart = timeToMinutes(time);
  const newEnd = newStart + durationMinutes + BUFFER_MINUTES;

  for (const existing of dayBookings) {
    const existStart = timeToMinutes(existing.scheduled_time);
    const existDuration = Number(existing.estimated_duration) || 120;
    const existEnd = existStart + existDuration + BUFFER_MINUTES;

    // Check overlap: new job starts before existing ends, or existing starts before new ends
    if (newStart < existEnd && existStart < newEnd) {
      return true; // Conflict found
    }
  }
  return false;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Find best available provider for a slot */
async function findAvailableProvider(
  supabase: SupabaseClient,
  date: string,
  time: string,
  durationMinutes: number,
  zipCode: string,
  excludeBookingId?: string
): Promise<string | null> {
  const { data: activeProviders } = await supabase
    .from("providers")
    .select("id, service_area_zips, total_jobs_completed")
    .eq("status", "active");

  if (!activeProviders || activeProviders.length === 0) return null;

  // Sort: prefer providers serving this zip, then by fewest jobs
  const sorted = [...activeProviders].sort((a, b) => {
    const aServes = a.service_area_zips?.includes(zipCode) ? 0 : 1;
    const bServes = b.service_area_zips?.includes(zipCode) ? 0 : 1;
    if (aServes !== bServes) return aServes - bServes;
    return (a.total_jobs_completed || 0) - (b.total_jobs_completed || 0);
  });

  for (const provider of sorted) {
    const conflict = await hasProviderConflict(supabase, provider.id, date, time, durationMinutes, excludeBookingId);
    if (!conflict) return provider.id;
  }
  return null;
}

/** Server-side price calculation */
async function calculatePrice(supabase: SupabaseClient, body: any) {
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

  if (!matrixEntry) return null;

  const basePrice = Number(matrixEntry.base_price);
  const { data: freqDiscount } = await supabase
    .from("frequency_discounts")
    .select("discount_percentage")
    .eq("frequency", body.frequency)
    .eq("is_active", true)
    .single();

  const discountPct = freqDiscount ? Number(freqDiscount.discount_percentage) : 0;
  const discountAmt = round2(basePrice * discountPct / 100);

  let extrasTotal = 0;
  if (body.selectedExtras?.length > 0) {
    const { data: extrasData } = await supabase
      .from("extras")
      .select("id, price")
      .in("id", body.selectedExtras)
      .eq("is_active", true);
    extrasTotal = (extrasData || []).reduce((sum: number, e: any) => sum + Number(e.price), 0);
  }

  const subtotal = round2(basePrice - discountAmt + extrasTotal);
  const { data: taxData } = await supabase
    .from("tax_rates")
    .select("rate")
    .eq("is_active", true)
    .limit(1)
    .single();
  const taxRate = taxData ? Number(taxData.rate) : 0.075;
  const taxAmount = round2(subtotal * taxRate);
  const total = round2(subtotal + taxAmount);

  return {
    basePrice, discountPct, discountAmt, extrasTotal, subtotal,
    taxRate, taxAmount, total,
    estimatedHours: matrixEntry.estimated_hours,
    matrixEntry,
  };
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/bookings — Create a new booking (+ recurring children)
   ═══════════════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
    if (!body.zipCode?.trim() || !/^\d{5}$/.test(body.zipCode))
      errors.push("Valid 5-digit zip code is required");
    if (!body.scheduledDate) errors.push("Scheduled date is required");
    if (!body.scheduledTime) errors.push("Scheduled time is required");
    if (body.bedrooms == null) errors.push("Number of bedrooms is required");
    if (body.bathrooms == null) errors.push("Number of bathrooms is required");
    if (!body.sqftRange) errors.push("Square footage range is required");
    if (!body.frequency) errors.push("Cleaning frequency is required");

    const scheduledDate = new Date(body.scheduledDate + "T00:00:00");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (scheduledDate < today) errors.push("Scheduled date must be in the future");
    if (body.scheduledTime && !TIME_SLOTS.includes(body.scheduledTime))
      errors.push("Invalid time slot selected");
    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const supabase = getSupabase();

    // ── Server-side price calculation ──
    const pricing = await calculatePrice(supabase, body);
    if (!pricing) {
      return NextResponse.json(
        { error: "Invalid pricing combination. Please go back and re-select your home details." },
        { status: 400 }
      );
    }

    // Verify client total (allow $1 tolerance)
    if (body.total && Math.abs(pricing.total - body.total) > 1.0) {
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
        { error: "We don't currently serve this zip code." },
        { status: 400 }
      );
    }

    // ── Duration & collision check ──
    const duration = estimateDuration(
      body.bedrooms, body.bathrooms, body.sqftRange,
      body.selectedExtras?.length || 0, pricing.estimatedHours
    );

    // Check overall slot availability
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id, provider_id")
      .eq("scheduled_date", body.scheduledDate)
      .eq("scheduled_time", body.scheduledTime)
      .not("status", "in", '("cancelled","no_show")');

    const { data: activeProviders } = await supabase
      .from("providers")
      .select("id")
      .eq("status", "active");

    const maxSlots = activeProviders?.length || 3;
    if ((existingBookings?.length || 0) >= maxSlots) {
      return NextResponse.json(
        { error: "This time slot is fully booked. Please select a different date or time." },
        { status: 409 }
      );
    }

    // ── Find available provider (with buffer check) ──
    const assignedProviderId = await findAvailableProvider(
      supabase, body.scheduledDate, body.scheduledTime, duration, body.zipCode
    );

    // ── Create or update customer ──
    const normalizedEmail = body.email.toLowerCase().trim();
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, total_bookings, lifetime_value")
      .eq("email", normalizedEmail)
      .single();

    let customerId: string;
    if (existingCustomer) {
      customerId = existingCustomer.id;
      await supabase.from("customers").update({
        first_name: body.firstName.trim(),
        last_name: body.lastName.trim(),
        phone: body.phone.trim(),
        address_line1: body.addressLine1.trim(),
        address_line2: body.addressLine2?.trim() || null,
        city: body.city.trim(),
        state: body.state?.trim() || "TX",
        zip_code: body.zipCode,
        total_bookings: (existingCustomer.total_bookings || 0) + 1,
        lifetime_value: Number(existingCustomer.lifetime_value || 0) + pricing.total,
        updated_at: new Date().toISOString(),
      }).eq("id", customerId);
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
          state: body.state?.trim() || "TX",
          zip_code: body.zipCode,
          total_bookings: 1,
          lifetime_value: pricing.total,
        })
        .select("id")
        .single();
      if (custError) {
        console.error("Customer creation error:", custError);
        return NextResponse.json({ error: "Failed to create customer record" }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // ── Create parent booking ──
    const bookingNumber = await nextBookingNumber(supabase);
    const isRecurring = body.frequency !== "one_time";

    const { data: booking, error: bookError } = await supabase
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        provider_id: assignedProviderId,
        scheduled_date: body.scheduledDate,
        scheduled_time: body.scheduledTime,
        status: body.isQuote ? "draft" : (assignedProviderId ? "confirmed" : "pending"),
        frequency: body.frequency,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        sqft_range: body.sqftRange,
        estimated_duration: duration,
        address_line1: body.addressLine1.trim(),
        address_line2: body.addressLine2?.trim() || null,
        city: body.city.trim(),
        state: body.state?.trim() || "TX",
        zip_code: body.zipCode,
        has_pets: body.hasPets || false,
        pet_details: body.petDetails || null,
        access_instructions: body.accessInstructions || null,
        base_price: pricing.basePrice,
        extras_total: pricing.extrasTotal,
        discount_percentage: pricing.discountPct,
        discount_amount: pricing.discountAmt,
        subtotal: pricing.subtotal,
        tax_rate: pricing.taxRate,
        tax_amount: pricing.taxAmount,
        total: pricing.total,
        tip_amount: 0,
        provider_payout_percentage: 40,
        provider_payout_amount: round2(pricing.total * 0.4),
        customer_notes: body.customerNotes || null,
        admin_notes: body.adminNotes || null,
        is_recurring_parent: isRecurring,
        created_by: body.createdBy || null,
      })
      .select("id, booking_number, status, scheduled_date, scheduled_time, total")
      .single();

    if (bookError) {
      console.error("Booking creation error:", bookError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // ── Create booking extras ──
    if (body.selectedExtras?.length > 0) {
      const { data: extrasData } = await supabase
        .from("extras")
        .select("id, price, name")
        .in("id", body.selectedExtras);
      if (extrasData?.length) {
        await supabase.from("booking_extras").insert(
          extrasData.map((e: any) => ({
            booking_id: booking.id,
            extra_id: e.id,
            quantity: 1,
            unit_price: Number(e.price),
            total_price: Number(e.price),
          }))
        );
      }
    }

    // ── Create payment record ──
    await supabase.from("payments").insert({
      booking_id: booking.id,
      customer_id: customerId,
      amount: pricing.total,
      method: body.paymentMethod === "card" ? "card" : "cash",
      status: body.isQuote ? "pending" : "pending",
      notes: body.isQuote ? "Quote — awaiting confirmation" : "Pay at time of service",
    });

    // ── Generate recurring child bookings (up to 5 more = 6 total) ──
    let recurringCount = 0;
    if (isRecurring && !body.isQuote) {
      const futureDates = getRecurringDates(body.scheduledDate, body.frequency, MAX_RECURRING_CHILDREN);

      for (const futureDate of futureDates) {
        const childNumber = await nextBookingNumber(supabase);
        const childProvider = await findAvailableProvider(
          supabase, futureDate, body.scheduledTime, duration, body.zipCode
        );

        const { data: childBooking, error: childError } = await supabase.from("bookings").insert({
          booking_number: childNumber,
          customer_id: customerId,
          provider_id: childProvider,
          scheduled_date: futureDate,
          scheduled_time: body.scheduledTime,
          status: childProvider ? "confirmed" : "pending",
          frequency: body.frequency,
          bedrooms: body.bedrooms,
          bathrooms: body.bathrooms,
          sqft_range: body.sqftRange,
          estimated_duration: duration,
          address_line1: body.addressLine1.trim(),
          address_line2: body.addressLine2?.trim() || null,
          city: body.city.trim(),
          state: body.state?.trim() || "TX",
          zip_code: body.zipCode,
          has_pets: body.hasPets || false,
          pet_details: body.petDetails || null,
          access_instructions: body.accessInstructions || null,
          base_price: pricing.basePrice,
          extras_total: pricing.extrasTotal,
          discount_percentage: pricing.discountPct,
          discount_amount: pricing.discountAmt,
          subtotal: pricing.subtotal,
          tax_rate: pricing.taxRate,
          tax_amount: pricing.taxAmount,
          total: pricing.total,
          tip_amount: 0,
          provider_payout_percentage: 40,
          provider_payout_amount: round2(pricing.total * 0.4),
          customer_notes: body.customerNotes || null,
          is_recurring_parent: false,
          recurring_parent_id: booking.id,
        }).select("id").single();

        if (!childError && childBooking) {
          recurringCount++;
          // Create payment for child booking (using child's ID, not parent)
          await supabase.from("payments").insert({
            booking_id: childBooking.id,
            customer_id: customerId,
            amount: pricing.total,
            method: body.paymentMethod === "card" ? "card" : "cash",
            status: "pending",
            notes: `Recurring booking ${recurringCount + 1} of 6`,
          });
          // Copy booking extras to child
          if (body.selectedExtras?.length > 0) {
            const { data: extrasData } = await supabase
              .from("extras")
              .select("id, price")
              .in("id", body.selectedExtras);
            if (extrasData?.length) {
              await supabase.from("booking_extras").insert(
                extrasData.map((e: any) => ({
                  booking_id: childBooking.id,
                  extra_id: e.id,
                  quantity: 1,
                  unit_price: Number(e.price),
                  total_price: Number(e.price),
                }))
              );
            }
          }
        }
      }
    }

    // ── Notification ──
    try {
      await supabase.from("notifications").insert({
        type: "booking_created",
        title: body.isQuote ? "New Quote Created" : "New Booking Received",
        message: `Booking #HM-${bookingNumber} from ${body.firstName} ${body.lastName} for ${body.scheduledDate} at ${body.scheduledTime}${recurringCount > 0 ? ` (+${recurringCount} recurring)` : ""}`,
        data: JSON.stringify({ booking_id: booking.id, booking_number: bookingNumber }),
        is_read: false,
      });
    } catch { /* non-fatal */ }

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
      customer: { id: customerId, isReturning: !!existingCustomer },
      recurring: isRecurring ? { totalBookings: recurringCount + 1, frequency: body.frequency } : null,
      message: body.isQuote
        ? "Quote created successfully. You can send it to the customer."
        : assignedProviderId
        ? `Booking confirmed! A cleaner has been assigned.${recurringCount > 0 ? ` ${recurringCount} recurring bookings scheduled.` : ""}`
        : `Booking received! We'll confirm and assign a cleaner shortly.${recurringCount > 0 ? ` ${recurringCount} recurring bookings scheduled.` : ""}`,
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
   GET /api/bookings — List bookings with filters + availability
   ═══════════════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = getSupabase();

    const status = searchParams.get("status");
    const customerId = searchParams.get("customer_id");
    const customerEmail = searchParams.get("email");
    const providerId = searchParams.get("provider_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const date = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = (page - 1) * limit;

    // ── Availability mode ──
    if (searchParams.get("mode") === "availability" && date) {
      const { data: dayBookings } = await supabase
        .from("bookings")
        .select("scheduled_time, provider_id, estimated_duration")
        .eq("scheduled_date", date)
        .not("status", "in", '("cancelled","no_show")');

      const { data: providers } = await supabase
        .from("providers")
        .select("id")
        .eq("status", "active");

      const maxSlots = providers?.length || 3;

      // For each time slot, check how many providers are actually available (with buffer)
      const availability = await Promise.all(
        TIME_SLOTS.map(async (slot) => {
          let availableCount = 0;
          for (const provider of (providers || [])) {
            const conflict = await hasProviderConflict(supabase, provider.id, date, slot, 120);
            if (!conflict) availableCount++;
          }
          return {
            time: slot,
            label: formatTime(slot),
            available: availableCount > 0,
            remaining: availableCount,
          };
        })
      );

      return NextResponse.json({ date, slots: availability, totalProviders: maxSlots });
    }

    // ── Lookup by email (customer portal) ──
    if (customerEmail) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", customerEmail.toLowerCase().trim())
        .single();

      if (!customer) return NextResponse.json({ bookings: [], total: 0 });

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

    if (status && status !== "all") query = query.eq("status", status);
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
      page, limit,
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
   PATCH /api/bookings — Update booking (cancel, reschedule,
   postpone, assign, status, edit fields, apply discount)
   ═══════════════════════════════════════════════════════════════ */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabase();

    // Support both "id" and "bookingId" for backwards compat
    const bookingId = body.id || body.bookingId;
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const { data: current, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let message = "Booking updated successfully";

    // ── CANCEL ──
    if (body.action === "cancel") {
      if (["cancelled", "completed"].includes(current.status)) {
        return NextResponse.json({ error: `Cannot cancel a ${current.status} booking` }, { status: 400 });
      }
      updates.status = "cancelled";
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = body.reason || body.cancellationReason || "Cancelled";

      // Update customer stats
      if (current.customer_id) {
        const { data: cust } = await supabase
          .from("customers")
          .select("total_bookings, lifetime_value")
          .eq("id", current.customer_id)
          .single();
        if (cust) {
          await supabase.from("customers").update({
            total_bookings: Math.max(0, (cust.total_bookings || 1) - 1),
            lifetime_value: Math.max(0, Number(cust.lifetime_value || 0) - Number(current.total)),
          }).eq("id", current.customer_id);
        }
      }
      message = "Booking cancelled successfully";
    }

    // ── RESCHEDULE ──
    if (body.action === "reschedule") {
      if (["cancelled", "completed", "in_progress"].includes(current.status)) {
        return NextResponse.json({ error: `Cannot reschedule a ${current.status} booking` }, { status: 400 });
      }
      // Support both field name patterns
      const newDate = body.scheduledDate || body.newDate;
      const newTime = body.scheduledTime || body.newTime;
      if (!newDate || !newTime) {
        return NextResponse.json({ error: "New date and time are required" }, { status: 400 });
      }

      // Check provider conflict with buffer
      if (current.provider_id) {
        const conflict = await hasProviderConflict(
          supabase, current.provider_id, newDate, newTime,
          Number(current.estimated_duration) || 120, bookingId
        );
        if (conflict) {
          // Try to find another provider
          const altProvider = await findAvailableProvider(
            supabase, newDate, newTime,
            Number(current.estimated_duration) || 120,
            current.zip_code, bookingId
          );
          if (!altProvider) {
            return NextResponse.json(
              { error: "No providers available at this time (including buffer time). Please choose a different slot." },
              { status: 409 }
            );
          }
          updates.provider_id = altProvider;
        }
      }

      updates.scheduled_date = newDate;
      updates.scheduled_time = newTime;
      updates.admin_notes = `Rescheduled from ${current.scheduled_date} ${current.scheduled_time}. ${body.reason || ""}. ${current.admin_notes || ""}`.trim();
      message = "Booking rescheduled successfully";
    }

    // ── POSTPONE (reschedule with reason, keeps same time, pushes date) ──
    if (body.action === "postpone") {
      if (["cancelled", "completed", "in_progress"].includes(current.status)) {
        return NextResponse.json({ error: `Cannot postpone a ${current.status} booking` }, { status: 400 });
      }
      const newDate = body.scheduledDate || body.newDate;
      if (!newDate) {
        return NextResponse.json({ error: "New date is required for postponement" }, { status: 400 });
      }
      const newTime = body.scheduledTime || body.newTime || current.scheduled_time;

      // Check provider conflict
      if (current.provider_id) {
        const conflict = await hasProviderConflict(
          supabase, current.provider_id, newDate, newTime,
          Number(current.estimated_duration) || 120, bookingId
        );
        if (conflict) {
          const altProvider = await findAvailableProvider(
            supabase, newDate, newTime,
            Number(current.estimated_duration) || 120,
            current.zip_code, bookingId
          );
          if (altProvider) updates.provider_id = altProvider;
        }
      }

      updates.scheduled_date = newDate;
      updates.scheduled_time = newTime;
      updates.admin_notes = `Postponed from ${current.scheduled_date}. Reason: ${body.reason || "Customer request"}. ${current.admin_notes || ""}`.trim();
      message = "Booking postponed successfully";
    }

    // ── ASSIGN PROVIDER ──
    if (body.action === "assign" && body.providerId) {
      const { data: provider } = await supabase
        .from("providers")
        .select("id, first_name, last_name")
        .eq("id", body.providerId)
        .eq("status", "active")
        .single();

      if (!provider) {
        return NextResponse.json({ error: "Provider not found or inactive" }, { status: 400 });
      }

      // Check conflict with buffer
      const conflict = await hasProviderConflict(
        supabase, body.providerId, current.scheduled_date, current.scheduled_time,
        Number(current.estimated_duration) || 120, bookingId
      );
      if (conflict) {
        return NextResponse.json(
          { error: `${provider.first_name} ${provider.last_name} has a scheduling conflict (including buffer time)` },
          { status: 409 }
        );
      }

      updates.provider_id = body.providerId;
      if (current.status === "pending") updates.status = "confirmed";
      message = `${provider.first_name} ${provider.last_name} assigned successfully`;
    }

    // ── STATUS CHANGE ──
    if (body.action === "status" && body.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ["pending", "confirmed", "cancelled"],
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
      if (body.status === "completed") {
        await supabase.from("payments")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("booking_id", bookingId)
          .eq("status", "pending");
      }
      message = `Booking status updated to ${body.status}`;
    }

    // ── EDIT FIELDS (admin can edit anything) ──
    if (body.action === "edit") {
      const editableFields = [
        "scheduled_date", "scheduled_time", "bedrooms", "bathrooms",
        "sqft_range", "frequency", "address_line1", "address_line2",
        "city", "state", "zip_code", "has_pets", "pet_details",
        "access_instructions", "customer_notes", "admin_notes",
        "provider_notes", "estimated_duration",
      ];
      for (const field of editableFields) {
        if (body[field] !== undefined) updates[field] = body[field];
      }

      // If price fields are being updated
      if (body.base_price !== undefined || body.discount_percentage !== undefined || body.extras_total !== undefined) {
        const basePrice = body.base_price ?? Number(current.base_price);
        const discPct = body.discount_percentage ?? Number(current.discount_percentage);
        const discAmt = round2(basePrice * discPct / 100);
        const extrasTotal = body.extras_total ?? Number(current.extras_total);
        const subtotal = round2(basePrice - discAmt + extrasTotal);
        const taxRate = Number(current.tax_rate);
        const taxAmt = round2(subtotal * taxRate);
        const total = round2(subtotal + taxAmt);

        updates.base_price = basePrice;
        updates.discount_percentage = discPct;
        updates.discount_amount = discAmt;
        updates.extras_total = extrasTotal;
        updates.subtotal = subtotal;
        updates.tax_amount = taxAmt;
        updates.total = total;
        updates.provider_payout_amount = round2(total * (Number(current.provider_payout_percentage) / 100));
      }

      // If discount is being applied separately
      if (body.applyDiscount !== undefined) {
        const discPct = Number(body.applyDiscount);
        const basePrice = Number(current.base_price);
        const discAmt = round2(basePrice * discPct / 100);
        const extrasTotal = Number(current.extras_total);
        const subtotal = round2(basePrice - discAmt + extrasTotal);
        const taxRate = Number(current.tax_rate);
        const taxAmt = round2(subtotal * taxRate);
        const total = round2(subtotal + taxAmt);

        updates.discount_percentage = discPct;
        updates.discount_amount = discAmt;
        updates.subtotal = subtotal;
        updates.tax_amount = taxAmt;
        updates.total = total;
        updates.provider_payout_amount = round2(total * (Number(current.provider_payout_percentage) / 100));
      }

      message = "Booking updated successfully";
    }

    // ── General field updates (backwards compat) ──
    if (body.adminNotes !== undefined) updates.admin_notes = body.adminNotes;
    if (body.providerNotes !== undefined) updates.provider_notes = body.providerNotes;

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .select("id, booking_number, status, scheduled_date, scheduled_time, total")
      .single();

    if (updateError) {
      console.error("Booking update error:", updateError);
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking: updated, message });
  } catch (error) {
    console.error("Bookings PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update booking" },
      { status: 500 }
    );
  }
}
