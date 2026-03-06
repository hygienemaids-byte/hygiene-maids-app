// @ts-nocheck
"use client";
import { useState, useMemo } from "react";
import { DollarSign, CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

type PeriodMode = "week" | "2weeks" | "month";

function getPeriodRange(mode: PeriodMode, offset: number) {
  const now = new Date();
  let start: Date, end: Date;

  if (mode === "week") {
    start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + offset * 7);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (mode === "2weeks") {
    const weekNum = Math.floor((now.getDate() - 1) / 14);
    start = new Date(now.getFullYear(), now.getMonth(), weekNum * 14 + 1);
    start.setDate(start.getDate() + offset * 14);
    end = new Date(start);
    end.setDate(start.getDate() + 13);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    label:
      mode === "week"
        ? `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : mode === "2weeks"
        ? `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

const paymentStatusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  paid: { label: "Paid", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  pending: { label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
  processing: { label: "Processing", icon: Clock, color: "text-blue-600 bg-blue-50 border-blue-200" },
  failed: { label: "Failed", icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-200" },
};

async function fetchPayments(startDate: string, endDate: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: provider } = await supabase
    .from("providers")
    .select("id, payout_percentage")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!provider) return null;

  // Get completed bookings for this period (these represent earnings)
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, customers(first_name, last_name)")
    .eq("provider_id", provider.id)
    .eq("status", "completed")
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: false });

  // Get actual payouts from provider_payouts table
  const { data: payouts } = await supabase
    .from("provider_payouts")
    .select("*, booking:bookings(booking_number, scheduled_date)")
    .eq("provider_id", provider.id)
    .gte("created_at", startDate + "T00:00:00")
    .lte("created_at", endDate + "T23:59:59")
    .order("created_at", { ascending: false });

  const payoutRate = provider.payout_percentage || 40;

  // Calculate totals from completed bookings
  const totalEarned = (bookings || []).reduce((s, b) => {
    const payout = (b.provider_payout_amount as number) || ((b.total as number) || 0) * (payoutRate / 100);
    return s + payout;
  }, 0);

  const totalTips = (bookings || []).reduce((s, b) => s + ((b.tip_amount as number) || 0), 0);

  const totalPaid = (payouts || []).filter((p) => p.status === "paid").reduce((s, p) => s + ((p.amount as number) || 0), 0);
  const totalPending = totalEarned - totalPaid;

  return {
    bookings: bookings || [],
    payouts: payouts || [],
    payoutRate,
    stats: { totalEarned, totalTips, totalPaid, totalPending, jobCount: (bookings || []).length },
  };
}

export default function CleanerPayments() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [offset, setOffset] = useState(0);

  const range = useMemo(() => getPeriodRange(periodMode, offset), [periodMode, offset]);
  const { data, loading } = useQuery(() => fetchPayments(range.start, range.end), [periodMode, offset]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-500 mt-1">
          Track your earnings and payment history.
          {data && <span className="text-slate-700 font-medium"> Payout rate: {data.payoutRate}%</span>}
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {([
            { key: "week" as PeriodMode, label: "Week" },
            { key: "2weeks" as PeriodMode, label: "2 Weeks" },
            { key: "month" as PeriodMode, label: "Month" },
          ]).map((m) => (
            <button
              key={m.key}
              onClick={() => { setPeriodMode(m.key); setOffset(0); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                periodMode === m.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">{range.label}</span>
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(0)}>Current</Button>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-slate-200 bg-white">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500">Total Earned</p>
              <p className="text-xl font-bold text-slate-900 mt-1">${data.stats.totalEarned.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400">{data.stats.jobCount} jobs</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500">Tips</p>
              <p className="text-xl font-bold text-slate-900 mt-1">${data.stats.totalTips.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-emerald-600">Paid</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">${data.stats.totalPaid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-100 bg-amber-50/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-amber-600">Pending</p>
              <p className="text-xl font-bold text-amber-700 mt-1">${data.stats.totalPending.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Earnings Breakdown (from completed bookings) */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.bookings.length === 0 ? (
            <div className="py-8 text-center">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No completed jobs in this period.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.bookings.map((job: Record<string, unknown>) => {
                const customer = job.customers as Record<string, unknown> | null;
                const payoutPct = (job.provider_payout_percentage as number) || data.payoutRate;
                const payout = (job.provider_payout_amount as number) || ((job.total as number) || 0) * (payoutPct / 100);
                return (
                  <div key={job.id as string} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          #{job.booking_number} &middot; {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date((job.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          {" · "}{job.bedrooms}bd/{job.bathrooms}ba
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-700">${payout.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">${(job.total as number)?.toFixed(2)} billed</p>
                      {(job.tip_amount as number) > 0 && (
                        <p className="text-[10px] text-teal-600">+${(job.tip_amount as number).toFixed(2)} tip</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      {data && data.payouts.length > 0 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {data.payouts.map((payout: Record<string, unknown>) => {
                const st = paymentStatusConfig[payout.status as string] || paymentStatusConfig.pending;
                const Icon = st.icon;
                return (
                  <div key={payout.id as string} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${st.color.split(" ")[1]}`}>
                        <Icon className={`w-4 h-4 ${st.color.split(" ")[0]}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          ${(payout.amount as number)?.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {payout.paid_at
                            ? new Date(payout.paid_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : new Date(payout.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {" · "}{(payout.method as string)?.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[11px] ${st.color}`}>{st.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
