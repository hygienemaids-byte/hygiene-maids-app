// @ts-nocheck
"use client";
import { useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays, Clock, DollarSign, MapPin, CheckCircle2, AlertCircle,
  ArrowRight, Star, ClipboardList, Navigation, Phone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  in_progress: { label: "In Progress", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

function mapsUrl(job: Record<string, unknown>) {
  const parts = [job.address_line1, job.city, job.state, job.zip_code].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

function formatTime(time: string) {
  if (!time) return "TBD";
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

async function fetchDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: provider } = await supabase
    .from("providers")
    .select("id, first_name, last_name, payout_percentage, avg_rating, total_reviews, total_jobs_completed")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!provider) return null;

  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Today's jobs
  const { data: todayJobs } = await supabase
    .from("bookings")
    .select("*, customers(first_name, last_name, phone)")
    .eq("provider_id", provider.id)
    .eq("scheduled_date", today)
    .neq("status", "cancelled")
    .order("scheduled_time", { ascending: true });

  // This week upcoming
  const { data: weekJobs } = await supabase
    .from("bookings")
    .select("*, customers(first_name, last_name)")
    .eq("provider_id", provider.id)
    .gt("scheduled_date", today)
    .lte("scheduled_date", weekEndStr)
    .in("status", ["pending", "confirmed"])
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })
    .limit(5);

  // This month earnings
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const { data: monthCompleted } = await supabase
    .from("bookings")
    .select("total, provider_payout_amount, provider_payout_percentage, tip_amount")
    .eq("provider_id", provider.id)
    .eq("status", "completed")
    .gte("scheduled_date", monthStart);

  const payoutRate = provider.payout_percentage || 40;
  const monthEarnings = (monthCompleted || []).reduce((s, b) => {
    const payout = b.provider_payout_amount || (b.total || 0) * (payoutRate / 100);
    return s + payout;
  }, 0);
  const monthTips = (monthCompleted || []).reduce((s, b) => s + (b.tip_amount || 0), 0);

  return {
    provider,
    todayJobs: todayJobs || [],
    weekJobs: weekJobs || [],
    stats: {
      todayCount: (todayJobs || []).length,
      weekCount: (weekJobs || []).length,
      monthEarnings,
      monthTips,
      monthJobs: (monthCompleted || []).length,
      rating: provider.avg_rating || 0,
      totalReviews: provider.total_reviews || 0,
    },
  };
}

export default function CleanerDashboard() {
  const { data, loading } = useQuery(() => fetchDashboard(), []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-10 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Unable to load dashboard. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { provider, todayJobs, weekJobs, stats } = data;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const currentJob = todayJobs.find((j: Record<string, unknown>) => j.status === "in_progress");

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {provider.first_name}!</h1>
        <p className="text-slate-500 mt-1">
          {stats.todayCount > 0
            ? `You have ${stats.todayCount} job${stats.todayCount > 1 ? "s" : ""} today.`
            : "No jobs scheduled for today."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-600" />
              <p className="text-xs text-slate-500">Today</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.todayCount}</p>
            <p className="text-[10px] text-slate-400">jobs</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-slate-500">This Week</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.weekCount}</p>
            <p className="text-[10px] text-slate-400">upcoming</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-slate-500">This Month</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">${stats.monthEarnings.toFixed(0)}</p>
            <p className="text-[10px] text-slate-400">{stats.monthJobs} jobs</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-slate-500">Rating</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{Number(stats.rating).toFixed(1)}</p>
            <p className="text-[10px] text-slate-400">{stats.totalReviews} reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Job */}
      {currentJob && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <Clock className="w-4 h-4" /> Current Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const customer = currentJob.customers as Record<string, unknown> | null;
              const address = [currentJob.address_line1, currentJob.city, currentJob.state, currentJob.zip_code].filter(Boolean).join(", ");
              return (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      #{currentJob.booking_number} &middot; {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                    </p>
                    <a
                      href={mapsUrl(currentJob)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <MapPin className="w-3.5 h-3.5" /> {address}
                    </a>
                    <p className="text-xs text-slate-500 mt-1">{currentJob.bedrooms}bd/{currentJob.bathrooms}ba &middot; {formatTime(currentJob.scheduled_time)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={mapsUrl(currentJob)} target="_blank" rel="noopener noreferrer">
                        <Navigation className="w-3.5 h-3.5 mr-1" /> Directions
                      </a>
                    </Button>
                    {customer?.phone && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`tel:${customer.phone}`}>
                          <Phone className="w-3.5 h-3.5 mr-1" /> Call
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Today's Jobs */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
            <Link href="/cleaner/jobs" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayJobs.length === 0 ? (
            <div className="py-6 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No jobs scheduled for today.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayJobs.map((job: Record<string, unknown>) => {
                const customer = job.customers as Record<string, unknown> | null;
                const status = statusConfig[job.status as string] || statusConfig.pending;
                return (
                  <div key={job.id as string} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-sm font-semibold text-slate-900">{formatTime(job.scheduled_time as string)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                        </p>
                        <a
                          href={mapsUrl(job)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" /> {job.address_line1}, {job.city}
                        </a>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[11px] ${status.bg} ${status.color} border`}>
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming This Week */}
      {weekJobs.length > 0 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {weekJobs.map((job: Record<string, unknown>) => {
                const customer = job.customers as Record<string, unknown> | null;
                return (
                  <div key={job.id as string} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date((job.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" at "}{formatTime(job.scheduled_time as string)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                        {" · "}{job.bedrooms}bd/{job.bathrooms}ba
                      </p>
                    </div>
                    <a
                      href={mapsUrl(job)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 hover:underline"
                    >
                      Directions
                    </a>
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
