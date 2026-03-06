import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, customerId, providerId, rating, comment, isPublic } = body;

    if (!bookingId || !customerId || !rating) {
      return NextResponse.json(
        { error: "bookingId, customerId, and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if a review already exists for this booking
    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("customer_id", customerId)
      .single();

    if (existingReview) {
      // Update existing review
      const { data, error } = await supabaseAdmin
        .from("reviews")
        .update({
          rating,
          comment: comment || null,
          is_public: isPublic !== false,
        })
        .eq("id", existingReview.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating review:", error);
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
      }

      return NextResponse.json({ review: data, updated: true });
    }

    // Create new review
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        booking_id: bookingId,
        customer_id: customerId,
        provider_id: providerId || null,
        rating,
        comment: comment || null,
        is_public: isPublic !== false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating review:", error);
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    return NextResponse.json({ review: data, created: true });
  } catch (err) {
    console.error("Reviews API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const bookingId = searchParams.get("bookingId");

    let query = supabaseAdmin.from("reviews").select("*, bookings(booking_number, scheduled_date, address_line1, city)");

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }
    if (bookingId) {
      query = query.eq("booking_id", bookingId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Reviews GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
