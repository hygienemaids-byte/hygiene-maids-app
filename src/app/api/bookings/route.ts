import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/** Server-side Supabase client with service role key — bypasses RLS for inserts */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Generate a numeric booking number that fits in a 32-bit integer (max 2,147,483,647) */
function generateBookingNumber(): number {
  // Format: MMDDXXXX (8 digits, max ~12319999 which fits in int4)
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return parseInt(`${mm}${dd}${rand}`, 10);
}

interface BookingPayload {
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  // Home details
  zipCode: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  sqftRange: string;
  // Service
  frequency: string;
  selectedExtras: string[]; // extra IDs
  // Schedule
  scheduledDate: string;
  scheduledTime: string;
  // Pricing (server will re-verify)
  basePrice: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
  extrasTotal: number;
  total: number;
  estimatedHours: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingPayload = await request.json();

    // ── Validation ──
    const errors: string[] = [];
    if (!body.firstName?.trim()) errors.push("First name is required");
    if (!body.lastName?.trim()) errors.push("Last name is required");
    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push("Valid email is required");
    if (!body.phone?.trim() || body.phone.replace(/\D/g, "").length < 10) errors.push("Valid phone number is required");
    if (!body.address?.trim()) errors.push("Service address is required");
    if (!body.zipCode?.trim() || body.zipCode.length !== 5) errors.push("Valid zip code is required");
    if (!body.scheduledDate) errors.push("Scheduled date is required");
    if (!body.scheduledTime) errors.push("Scheduled time is required");
    if (body.bedrooms === undefined || body.bedrooms === null) errors.push("Bedrooms is required");
    if (body.bathrooms === undefined || body.bathrooms === null) errors.push("Bathrooms is required");
    if (!body.sqftRange) errors.push("Square footage range is required");
    if (!body.frequency) errors.push("Frequency is required");
    if (body.total <= 0) errors.push("Invalid total amount");

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const supabase = getSupabase();

    // ── Server-side price verification ──
    // Fetch the pricing matrix to verify the client-submitted price
    const { data: matrixEntry } = await supabase
      .from("pricing_matrix")
      .select("*")
      .eq("bedrooms", body.bedrooms)
      .eq("bathrooms", body.bathrooms)
      .single();

    // Verify the sqft range matches
    if (matrixEntry) {
      const expectedKey = `${matrixEntry.sqft_min}-${matrixEntry.sqft_max}`;
      if (expectedKey !== body.sqftRange) {
        // Try to find exact match
        const [sqMin, sqMax] = body.sqftRange.split("-").map(Number);
        const { data: exactMatch } = await supabase
          .from("pricing_matrix")
          .select("*")
          .eq("bedrooms", body.bedrooms)
          .eq("bathrooms", body.bathrooms)
          .eq("sqft_min", sqMin)
          .eq("sqft_max", sqMax)
          .single();

        if (!exactMatch) {
          return NextResponse.json({ error: "Invalid pricing combination" }, { status: 400 });
        }

        // Verify base price matches
        if (Math.abs(Number(exactMatch.base_price) - body.basePrice) > 0.01) {
          return NextResponse.json({ error: "Price mismatch detected. Please refresh and try again." }, { status: 400 });
        }
      }
    }

    // ── Step 1: Create or find customer ──
    // Check if customer already exists by email
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", body.email.toLowerCase().trim())
      .single();

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update customer info
      await supabase
        .from("customers")
        .update({
          first_name: body.firstName.trim(),
          last_name: body.lastName.trim(),
          phone: body.phone.trim(),
          city: body.city,
          state: body.state,
          zip_code: body.zipCode,
        })
        .eq("id", customerId);
    } else {
      const { data: newCustomer, error: custError } = await supabase
        .from("customers")
        .insert({
          first_name: body.firstName.trim(),
          last_name: body.lastName.trim(),
          email: body.email.toLowerCase().trim(),
          phone: body.phone.trim(),
          city: body.city,
          state: body.state,
          zip_code: body.zipCode,
          notes: body.address.trim(), // Store address in notes since there's no address column
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
    const bookingNumber = generateBookingNumber();

    // Parse address into line1 (street) and line2 (apt/suite)
    const addressParts = body.address.trim().split(",").map(s => s.trim());
    const addressLine1 = addressParts[0] || body.address.trim();
    const addressLine2 = addressParts.length > 2 ? addressParts[1] : "";

    const { data: booking, error: bookError } = await supabase
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        scheduled_date: body.scheduledDate,
        scheduled_time: body.scheduledTime,
        status: "pending",
        frequency: body.frequency,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        sqft_range: body.sqftRange,
        base_price: body.basePrice,
        discount_amount: body.discountAmount,
        tax_amount: body.taxAmount,
        subtotal: body.subtotal,
        extras_total: body.extrasTotal,
        total: body.total,
        estimated_duration: body.estimatedHours,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city: body.city,
        state: body.state,
        zip_code: body.zipCode,
        customer_notes: body.notes || "",
        tip_amount: 0,
      })
      .select("id, booking_number")
      .single();

    if (bookError) {
      console.error("Booking creation error:", bookError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // ── Step 3: Create booking extras ──
    if (body.selectedExtras.length > 0) {
      // Fetch extra prices from DB to populate unit_price
      const { data: extrasData } = await supabase
        .from("extras")
        .select("id, price")
        .in("id", body.selectedExtras);

      const priceMap = new Map((extrasData || []).map(e => [e.id, Number(e.price)]));

      const extrasInsert = body.selectedExtras.map(extraId => {
        const unitPrice = priceMap.get(extraId) || 0;
        return {
          booking_id: booking.id,
          extra_id: extraId,
          quantity: 1,
          unit_price: unitPrice,
          total_price: unitPrice,
        };
      });

      const { error: extrasError } = await supabase
        .from("booking_extras")
        .insert(extrasInsert);

      if (extrasError) {
        console.error("Booking extras error:", extrasError);
        // Non-fatal — booking was still created
      }
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      message: "Booking created successfully",
    });

  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process booking" },
      { status: 500 }
    );
  }
}
