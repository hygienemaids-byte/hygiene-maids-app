/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ─── Dashboard Stats ───────────────────────────────────────────
export async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];

  const [bookingsToday, totalCustomers, monthlyRevenue, avgRating] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*", { count: "exact" })
        .eq("scheduled_date", today),
      supabase.from("customers").select("*", { count: "exact" }),
      supabase
        .from("payments")
        .select("amount")
        .eq("status", "paid")
        .gte(
          "paid_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        ),
      supabase
        .from("providers")
        .select("avg_rating")
        .eq("status", "active"),
    ]);

  const revenueData = (monthlyRevenue.data || []) as any[];
  const revenue = revenueData.reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0
  );
  const ratingData = (avgRating.data || []) as any[];
  const rating =
    ratingData.reduce((sum: number, p: any) => sum + Number(p.avg_rating), 0) /
      (ratingData.length || 1) || 0;

  return {
    todayBookings: bookingsToday.count || 0,
    totalCustomers: totalCustomers.count || 0,
    monthlyRevenue: revenue,
    avgRating: Number(rating.toFixed(2)),
  };
}

export async function getTodayBookings() {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("bookings")
    .select(
      `*, customer:customers(first_name, last_name), provider:providers(first_name, last_name)`
    )
    .eq("scheduled_date", today)
    .order("scheduled_time", { ascending: true });
  return (data || []) as any[];
}

export async function getUpcomingBookings() {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("bookings")
    .select(
      `*, customer:customers(first_name, last_name, email, phone), provider:providers(first_name, last_name)`
    )
    .gte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })
    .limit(50);
  return (data || []) as any[];
}

// ─── Bookings ──────────────────────────────────────────────────
export async function getBookings(filters?: {
  status?: string;
  search?: string;
}) {
  let query = supabase
    .from("bookings")
    .select(
      `*, customer:customers(first_name, last_name, email, phone), provider:providers(first_name, last_name)`
    )
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false })
    .limit(100);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) console.error("getBookings error:", error);
  return (data || []) as any[];
}

export async function getBookingById(id: string) {
  const { data } = await supabase
    .from("bookings")
    .select(
      `*, customer:customers(*), provider:providers(first_name, last_name, email, phone), extras:booking_extras(*, extra:extras(name, price))`
    )
    .eq("id", id)
    .single();
  return data as any;
}

export async function updateBooking(id: string, updates: Record<string, unknown>) {
  const { data, error } = await (supabase.from("bookings") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Customers ─────────────────────────────────────────────────
export async function getCustomers(search?: string) {
  const query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data, error } = await query;
  if (error) console.error("getCustomers error:", error);

  const results = (data || []) as any[];
  if (search) {
    const s = search.toLowerCase();
    return results.filter(
      (c: any) =>
        `${c.first_name} ${c.last_name} ${c.email} ${c.city}`
          .toLowerCase()
          .includes(s)
    );
  }
  return results;
}

// ─── Providers ─────────────────────────────────────────────────
export async function getProviders() {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("getProviders error:", error);
  return (data || []) as any[];
}

// ─── Leads ─────────────────────────────────────────────────────
export async function getLeads(filters?: {
  status?: string;
  search?: string;
}) {
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) console.error("getLeads error:", error);

  const results = (data || []) as any[];
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    return results.filter(
      (l: any) =>
        `${l.first_name} ${l.last_name} ${l.email || ""} ${l.phone || ""}`
          .toLowerCase()
          .includes(s)
    );
  }
  return results;
}

export async function updateLead(id: string, updates: Record<string, unknown>) {
  const { data, error } = await (supabase.from("leads") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Applicants ────────────────────────────────────────────────
export async function getApplicants(search?: string) {
  const { data, error } = await supabase
    .from("applicants")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) console.error("getApplicants error:", error);

  const results = (data || []) as any[];
  if (search) {
    const s = search.toLowerCase();
    return results.filter(
      (a: any) =>
        `${a.first_name} ${a.last_name} ${a.email} ${a.city}`
          .toLowerCase()
          .includes(s)
    );
  }
  return results;
}

// ─── Payments ──────────────────────────────────────────────────
export async function getPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select(
      `*, booking:bookings(booking_number, customer:customers(first_name, last_name))`
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) console.error("getPayments error:", error);
  return (data || []) as any[];
}

export async function getProviderPayouts() {
  const { data, error } = await supabase
    .from("provider_payouts")
    .select(
      `*, provider:providers(first_name, last_name)`
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("getProviderPayouts error:", error);
  return (data || []) as any[];
}

// ─── Pricing ───────────────────────────────────────────────────
export async function getPricingMatrix() {
  const { data } = await supabase
    .from("pricing_matrix")
    .select("*")
    .order("bedrooms")
    .order("bathrooms")
    .order("sqft_range");
  return (data || []) as any[];
}

export async function getFrequencyDiscounts() {
  const { data } = await supabase
    .from("frequency_discounts")
    .select("*")
    .order("discount_percentage");
  return (data || []) as any[];
}

export async function getExtras() {
  const { data } = await supabase
    .from("extras")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("name");
  return (data || []) as any[];
}

export async function getServiceAreas() {
  const { data } = await supabase
    .from("service_areas")
    .select("*")
    .eq("is_active", true)
    .order("city")
    .order("zip_code");
  return (data || []) as any[];
}

export async function getSystemSettings() {
  const { data } = await supabase.from("system_settings").select("*");
  const settings: Record<string, string> = {};
  ((data || []) as any[]).forEach((s: any) => {
    settings[s.key] = s.value;
  });
  return settings;
}

// ─── Pricing Calculator ────────────────────────────────────────
export async function calculatePrice(params: {
  bedrooms: number;
  bathrooms: number;
  sqft_range: string;
  frequency: string;
  extras: string[];
}) {
  const [matrixData, discountData, extrasData, settingsData] =
    await Promise.all([
      getPricingMatrix(),
      getFrequencyDiscounts(),
      getExtras(),
      getSystemSettings(),
    ]);

  // Find base price
  const priceRow = matrixData.find(
    (p: any) =>
      p.bedrooms === params.bedrooms &&
      p.bathrooms === params.bathrooms &&
      p.sqft_range === params.sqft_range
  );
  const basePrice = priceRow?.base_price || 0;
  const estimatedHours = priceRow?.estimated_hours || 0;

  // Calculate extras
  const selectedExtras = extrasData.filter((e: any) =>
    params.extras.includes(e.id)
  );
  const extrasTotal = selectedExtras.reduce(
    (sum: number, e: any) => sum + Number(e.price),
    0
  );

  // Find discount
  const discount = discountData.find(
    (d: any) => d.frequency === params.frequency
  );
  const discountPct = discount?.discount_percentage || 0;
  const discountAmount = (basePrice * discountPct) / 100;

  // Tax
  const taxRate = Number(settingsData.tax_rate || "7.5");
  const subtotal = basePrice - discountAmount + extrasTotal;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    basePrice,
    extrasTotal,
    discountPercentage: discountPct,
    discountAmount,
    subtotal,
    taxRate,
    taxAmount,
    total,
    estimatedHours,
    selectedExtras,
  };
}
