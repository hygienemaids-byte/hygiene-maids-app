import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminBookingForm from "./AdminBookingForm";

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

function BookingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Loading booking engine...</p>
      </div>
    </div>
  );
}

export default async function AdminBookPage() {
  const data = await getPricingData();
  return (
    <div className="p-6">
      <Suspense fallback={<BookingFallback />}>
        <AdminBookingForm data={data} />
      </Suspense>
    </div>
  );
}
