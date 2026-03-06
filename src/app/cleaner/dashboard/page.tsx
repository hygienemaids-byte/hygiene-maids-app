// @ts-nocheck
"use client";
import { CalendarDays, Clock, DollarSign, MapPin, CheckCircle2, AlertCircle, ArrowRight, Play, Star, TrendingUp, Award, Navigation, Phone, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
};

async function getCleanerData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!provider) return { provider: null, todayJobs: [], upcomingJobs: [], stats: { today: 0, week: 0, earnings: 0, rating: 0, totalReviews: 0, completionRate: 0, totalCompleted: 0 } };

  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Today's jobs
  const { data: todayJobs } = await supabase
    .from("bookings")
    .select("*, customers(first_name, last_name, phone)")
    .eq("provider_id", provider.id)
    .eq("scheduled_date", today)
    .neq("status", "cancelled")
    .order("scheduled_time", { ascending: true });

  // This week's jobs
  const { data: weekJobs } = await supabase
    .from("bookings")
    .select("*, customers(first_name, last_name, phone)")
    .eq("provider_id", provider.id)
    .gte("scheduled_date", today)
    .lte("scheduled_date", weekEnd)
    .neq("status", "cancelled")
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  // Completed this month for earnings
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const { data: completedJobs } = await supabase
    .from("bookings")
    .select("total")
    .eq("provider_id", provider.id)
    .eq("status", "completed")
    .gte("scheduled_date", monthStart);

  // All-time stats
  const { data: allJobs } = await supabase
    .from("bookings")
    .select("status")
    .eq("provider_id", provider.id)
    .in("status", ["completed", "cancelled", "no_show"]);

  const totalCompleted = (allJobs || []).filter(j => j.status === "completed").length;
  const totalFinished = (allJobs || []).length;
  const completionRate = totalFinished > 0 ? (totalCompleted / totalFinished) * 100 : 100;

  const monthlyEarnings = (completedJobs || []).reduce((s, j) => s + (j.total || 0), 0);

  return {
    provider,
    todayJobs: todayJobs || [],
    upcomingJobs: (weekJobs || []).filter((j) => j.scheduled_date !== today),
    stats: {
      today: (todayJobs || []).length,
      week: (weekJobs || []).length,
      earnings: monthlyEarnings,
      rating: provider.avg_rating || 0,
      totalReviews: provider.total_reviews || 0,
      completionRate,
      totalCompleted: provider.total_jobs_completed || totalCompleted,
    },
  };
}

export default function CleanerDashboard() {
  const { data, loading, refetch } = useQuery(() => getCleanerData(), []);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, action: "status", status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast.success(`Job marked as ${newStatus.replace("_", " ")}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update job status");
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.provider) {
    return (
      <div className="p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">No Provider Profile Found</h3>
              <p className="text-sm text-amber-700 mt-1">
                Your account isn&apos;t linked to a provider profile yet. Please contact the admin team to get set up.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { provider, todayJobs, upcomingJobs, stats } = data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {provider.first_name}!
          </h1>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={
            provider.status === "active"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }>
            {provider.status}
          </Badge>
          {stats.rating > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-medium text-slate-700">{stats.rating.toFixed(1)}</span>
              <span className="text-slate-400">({stats.totalReviews})</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.today}</p>
                <p className="text-xs text-slate-400 mt-0.5">jobs scheduled</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.week}</p>
                <p className="text-xs text-slate-400 mt-0.5">upcoming jobs</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monthly Earnings</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">${stats.earnings.toFixed(0)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {provider.payout_percentage ? `${provider.payout_percentage}% payout rate` : "this month"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Completion</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.completionRate.toFixed(0)}%</p>
                <p className="text-xs text-slate-400 mt-0.5">{stats.totalCompleted} jobs completed</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/cleaner/jobs">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> View All Jobs
          </Button>
        </Link>
        <Link href="/cleaner/schedule">
          <Button variant="outline" size="sm" className="gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> My Schedule
          </Button>
        </Link>
        <Link href="/cleaner/earnings">
          <Button variant="outline" size="sm" className="gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Earnings Report
          </Button>
        </Link>
      </div>

      {/* Today's Jobs */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Today&apos;s Schedule</h2>
        {todayJobs.length === 0 ? (
          <Card className="border-slate-200 bg-white">
            <CardContent className="py-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700">No jobs scheduled today</h3>
              <p className="text-sm text-slate-500 mt-1">Enjoy your day off! Check your schedule for upcoming jobs.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayJobs.map((job: Record<string, unknown>, index: number) => {
              const customer = job.customers as Record<string, unknown> | null;
              const address = [job.address_line1, job.city, job.state, job.zip_code].filter(Boolean).join(", ");
              return (
                <Card key={job.id as string} className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          job.status === "in_progress" ? "bg-blue-600 text-white" :
                          job.status === "completed" ? "bg-emerald-600 text-white" :
                          "bg-teal-600 text-white"
                        }`}>
                          <span className="text-lg font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {job.scheduled_time
                                ? new Date(`2000-01-01T${job.scheduled_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                                : "TBD"}
                            </span>
                            <Badge variant="outline" className={statusColors[job.status as string] || ""}>
                              {(job.status as string)?.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-slate-400">#{job.booking_number}</span>
                            {job.frequency && job.frequency !== "one_time" && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                                {(job.frequency as string).replace("_", " ")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 mt-1.5">
                            {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
                            >
                              <MapPin className="w-3 h-3" />
                              {job.address_line1}, {job.city}
                            </a>
                            <span>{job.bedrooms}bd / {job.bathrooms}ba</span>
                            {job.sqft_range && <span>{job.sqft_range} sqft</span>}
                            <span className="font-medium text-slate-700">${(job.total as number)?.toFixed(2)}</span>
                          </div>
                          {job.customer_notes && (
                            <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 px-2.5 py-1.5 rounded-lg">
                              &ldquo;{job.customer_notes as string}&rdquo;
                            </p>
                          )}
                          {/* Action row: call + directions */}
                          <div className="flex items-center gap-2 mt-2.5">
                            {customer?.phone && (
                              <a
                                href={`tel:${customer.phone}`}
                                className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                              >
                                <Phone className="w-3 h-3" /> Call Customer
                              </a>
                            )}
                            {address && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Navigation className="w-3 h-3" /> Get Directions
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {job.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(job.id as string, "in_progress")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="w-3.5 h-3.5 mr-1" />
                            Start Job
                          </Button>
                        )}
                        {job.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(job.id as string, "completed")}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming This Week</h2>
            <Link href="/cleaner/jobs">
              <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingJobs.slice(0, 5).map((job: Record<string, unknown>) => {
              const customer = job.customers as Record<string, unknown> | null;
              return (
                <Card key={job.id as string} className="border-slate-200 bg-white">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex flex-col items-center justify-center">
                          <span className="text-[9px] text-slate-500 leading-none">
                            {new Date((job.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-sm font-bold text-slate-700 leading-none mt-0.5">
                            {new Date((job.scheduled_date as string) + "T12:00:00").getDate()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-900">
                            {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"} &middot;{" "}
                            {job.scheduled_time
                              ? new Date(`2000-01-01T${job.scheduled_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                              : "TBD"}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {job.bedrooms}bd/{job.bathrooms}ba &middot; {job.address_line1}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={statusColors[job.status as string] || ""}>
                          {(job.status as string)?.replace("_", " ")}
                        </Badge>
                        <span className="text-sm font-medium text-slate-700">${(job.total as number)?.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
