// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "link_or_create") {
      const { profileId, email, firstName, lastName, phone, bookingNumber } = body;

      if (!profileId || !email) {
        return NextResponse.json({ error: "profileId and email are required" }, { status: 400 });
      }

      // Check if a customer record already exists with this email (from a booking)
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers")
        .select("id, profile_id")
        .eq("email", email)
        .single();

      if (existingCustomer) {
        // Link the auth profile to the existing customer record
        if (!existingCustomer.profile_id) {
          await supabaseAdmin
            .from("customers")
            .update({
              profile_id: profileId,
              first_name: firstName || undefined,
              last_name: lastName || undefined,
              phone: phone || undefined,
            })
            .eq("id", existingCustomer.id);
        }
        return NextResponse.json({ customerId: existingCustomer.id, linked: true });
      }

      // Create a new customer record
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from("customers")
        .insert({
          profile_id: profileId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          status: "active",
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating customer:", createError);
        return NextResponse.json({ error: "Failed to create customer record" }, { status: 500 });
      }

      // If a booking number was provided, link the booking to this customer
      if (bookingNumber) {
        const numericBookingNumber = parseInt(bookingNumber.replace(/\D/g, ""), 10);
        if (!isNaN(numericBookingNumber)) {
          await supabaseAdmin
            .from("bookings")
            .update({ customer_id: newCustomer.id })
            .eq("booking_number", numericBookingNumber);
        }
      }

      return NextResponse.json({ customerId: newCustomer.id, linked: false, created: true });
    }

    if (action === "update_profile") {
      const { customerId, updates } = body;
      if (!customerId) {
        return NextResponse.json({ error: "customerId is required" }, { status: 400 });
      }

      const allowedFields = [
        "first_name", "last_name", "phone", "email",
        "address_line1", "address_line2", "city", "state", "zip_code",
        "notes", "preferred_contact_method",
      ];
      const safeUpdates: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in updates) safeUpdates[key] = updates[key];
      }

      const { error } = await supabaseAdmin
        .from("customers")
        .update(safeUpdates)
        .eq("id", customerId);

      if (error) {
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "request_deletion") {
      const { customerId, email } = body;
      if (!customerId) {
        return NextResponse.json({ error: "customerId is required" }, { status: 400 });
      }

      // Mark the customer as inactive (soft delete)
      await supabaseAdmin
        .from("customers")
        .update({ status: "inactive" })
        .eq("id", customerId);

      // Create a notification for admin
      await supabaseAdmin
        .from("notifications")
        .insert({
          type: "account_deletion_request",
          title: "Account Deletion Request",
          message: `Customer ${email} has requested account deletion.`,
          is_read: false,
        });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Customers API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const profileId = searchParams.get("profileId");

    if (!email && !profileId) {
      return NextResponse.json({ error: "email or profileId is required" }, { status: 400 });
    }

    let query = supabaseAdmin.from("customers").select("*");
    if (profileId) {
      query = query.eq("profile_id", profileId);
    } else if (email) {
      query = query.eq("email", email);
    }

    const { data, error } = await query.single();
    if (error) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Customers GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
