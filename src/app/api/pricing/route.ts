import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Server-side Supabase client (no browser CORS issues)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const [matrixRes, discountsRes, extrasRes, areasRes, taxRes] = await Promise.all([
      supabase.from("pricing_matrix").select("*").order("bedrooms").order("bathrooms").order("sqft_min"),
      supabase.from("frequency_discounts").select("*").order("discount_percentage"),
      supabase.from("extras").select("*").eq("is_active", true).order("category").order("name"),
      supabase.from("service_areas").select("*").eq("is_active", true).order("city"),
      supabase.from("tax_rates").select("*"),
    ]);

    if (matrixRes.error) throw new Error(`pricing_matrix: ${matrixRes.error.message}`);
    if (discountsRes.error) throw new Error(`frequency_discounts: ${discountsRes.error.message}`);
    if (extrasRes.error) throw new Error(`extras: ${extrasRes.error.message}`);
    if (areasRes.error) throw new Error(`service_areas: ${areasRes.error.message}`);
    if (taxRes.error) throw new Error(`tax_rates: ${taxRes.error.message}`);

    return NextResponse.json({
      pricing_matrix: matrixRes.data,
      frequency_discounts: discountsRes.data,
      extras: extrasRes.data,
      service_areas: areasRes.data,
      tax_rates: taxRes.data,
    });
  } catch (error) {
    console.error("Pricing API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load pricing data" },
      { status: 500 }
    );
  }
}
