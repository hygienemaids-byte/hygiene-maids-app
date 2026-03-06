// @ts-nocheck
"use client";
import { DollarSign, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

async function getEarningsData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: provider } = await supabase
    .from("providers")
    .select("id, payout_percentage")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!provider) return null;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
  const thisYearStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];

  const { data: thisMonth } = await supabase
    .from("bookings")
    .select("total, scheduled_date, booking_number, bedrooms, bathrooms, customers(first_name, last_name)")
    .eq("provider_id", provider.id)
    .eq("status", "completed")
    .gte("scheduled_date", thisMonthStart)
    .order("scheduled_date", { ascending: false });

  const { data: lastMonth } = await supabase
    .from("bookings")
    .select("total")
    .eq("provider_id", provider.id)
    .eq("status", "completed")
    .gte("scheduled_date", lastMonthStart)
    .lte("scheduled_date", lastMonthEnd);

  const { data: yearJobs } = await supabase
    .from("bookings")
    .select("total")
    .eq("provider_id", provider.id)
    .eq("status", "completed")
    .gte("scheduled_date", thisYearStart);

  const thisMonthTotal = (thisMonth || []).reduce((s, j) => s + (j.total || 0), 0);
  const lastMonthTotal = (lastMonth || []).reduce((s, j) => s + (j.total || 0), 0);
  const yearTotal = (yearJobs || []).reduce((s, j) => s + (j.total || 0), 0);
  const payoutRate = provider.payout_percentage || 70;

  return {
    thisMonth: thisMonth || [],
    payoutRate,
    stats: {
      thisMonthTotal,
      thisMonthPayout: thisMonthTotal * (payoutRate / 100),
      lastMonthTotal,
      yearTotal,
      yearPayout: yearTotal * (payoutRate / 100),
      thisMonthJobs: (thisMonth || []).length,
      yearJobs: (yearJobs || []).length,
    },
  };
}

export default function CleanerEarnings() {
  const { data, loading } = useQuery(() => getEarningsData(), []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-8 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No earnings data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { thisMonth, stats, payoutRate } = data;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
        <p className="text-slate-500 mt-1">Track your cleaning service earnings. Your payout rate is <span className="font-medium text-slate-700">{payoutRate}%</span>.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-slate-500">{currentMonth} Earnings</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${stats.thisMonthPayout.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.thisMonthJobs} jobs &middot; ${stats.thisMonthTotal.toFixed(2)} total billed</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-slate-500">Last Month</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${(stats.lastMonthTotal * (payoutRate / 100)).toFixed(2)}</p>
            {stats.lastMonthTotal > 0 && stats.thisMonthTotal > 0 && (
              <p className={`text-xs mt-1 ${stats.thisMonthTotal >= stats.lastMonthTotal ? "text-emerald-600" : "text-red-500"}`}>
                {stats.thisMonthTotal >= stats.lastMonthTotal ? "\u2191" : "\u2193"}{" "}
                {Math.abs(((stats.thisMonthTotal - stats.lastMonthTotal) / stats.lastMonthTotal) * 100).toFixed(0)}% vs last month
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-slate-500">Year to Date</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${stats.yearPayout.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.yearJobs} jobs total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">{currentMonth} Completed Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {thisMonth.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No completed jobs this month yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {thisMonth.map((job: Record<string, unknown>) => {
                const customer = job.customers as Record<string, unknown> | null;
                const payout = ((job.total as number) || 0) * (payoutRate / 100);
                return (
                  <div key={job.booking_number as number} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          #{job.booking_number} &middot; {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date((job.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          &middot; {job.bedrooms}bd/{job.bathrooms}ba
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-emerald-700">${payout.toFixed(2)}</span>
                      <p className="text-[10px] text-slate-400">${(job.total as number)?.toFixed(2)} billed</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
