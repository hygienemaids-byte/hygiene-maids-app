import { createClient } from "@supabase/supabase-js";
import BookingWizard from "./BookingWizard";

// Server-side data fetching — no browser CORS issues
async function getPricingData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [matrixRes, discountsRes, extrasRes, areasRes, taxRes] = await Promise.all([
    supabase.from("pricing_matrix").select("*").order("bedrooms").order("bathrooms").order("sqft_min"),
    supabase.from("frequency_discounts").select("*").order("discount_percentage"),
    supabase.from("extras").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("service_areas").select("*").eq("is_active", true).order("city"),
    supabase.from("tax_rates").select("*").eq("is_active", true),
  ]);

  return {
    pricingMatrix: matrixRes.data || [],
    frequencyDiscounts: discountsRes.data || [],
    extras: extrasRes.data || [],
    serviceAreas: areasRes.data || [],
    taxRate: taxRes.data?.[0]?.rate || 0.075,
  };
}

export default async function BookPage() {
  const data = await getPricingData();
  return <BookingWizard data={data} />;
}
