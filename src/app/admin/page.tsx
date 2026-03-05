"use client";

import { CalendarCheck, Users, DollarSign, Star, Clock, AlertCircle, Sparkles, MapPin, ArrowRight, TrendingUp, CheckCircle2, UserCheck, ArrowUpRight, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { getDashboardStats, getTodayBookings, getUpcomingBookings } from "@/lib/queries";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import Link from "next/link";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-50 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminDashboard() {
  const { data: stats, loading: statsLoading } = useQuery(() => getDashboardStats(), []);
  const { data: todayBookings, loading: todayLoading } = useQuery(() => getTodayBookings(), []);
  const { data: upcoming, loading: upcomingLoading } = useQuery(() => getUpcomingBookings(), []);

  if (statsLoading && todayLoading) return <DashboardSkeleton />;

  const needsAttention = (upcoming || []).filter(
    (b: Record<string, unknown>) => b.status === "pending" || !b.provider_id
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <Link href="/admin/bookings">
          <Button className="gap-2">
            <CalendarDays className="w-4 h-4" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today&apos;s Bookings</p>
                <p className="text-2xl font-bold mt-1">{stats?.todayBookings ?? 0}</p>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px] text-muted-foreground">Live from database</span></div>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10"><CalendarCheck className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Revenue</p>
                <p className="text-2xl font-bold mt-1">${(stats?.monthlyRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px] text-muted-foreground">This month</span></div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Customers</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalCustomers ?? 0}</p>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px] text-muted-foreground">Total in database</span></div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50"><Users className="w-5 h-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Rating</p>
                <p className="text-2xl font-bold mt-1">{stats?.avgRating ?? 0}</p>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px] text-muted-foreground">From reviews</span></div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50"><Star className="w-5 h-5 text-amber-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Today&apos;s Schedule
                </CardTitle>
                <Link href="/admin/schedule">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded" />)}
                </div>
              ) : (todayBookings || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No bookings scheduled for today</p>
                </div>
              ) : (
                (todayBookings || []).map((booking: Record<string, any>) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="text-center shrink-0 w-16">
                      <p className="text-sm font-bold">{booking.scheduled_time}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      booking.status === "in_progress" ? "bg-blue-500 ring-4 ring-blue-100" :
                      booking.status === "confirmed" ? "bg-emerald-500" : "bg-amber-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {booking.customer?.first_name} {booking.customer?.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {booking.city}, TX {booking.zip_code}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[booking.status] || ""}`}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-semibold text-emerald-600 shrink-0">
                      ${Number(booking.total).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Needs Attention */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {needsAttention.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All clear!</p>
              ) : (
                needsAttention.slice(0, 5).map((b: Record<string, any>) => (
                  <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50">
                    <div>
                      <p className="text-xs font-semibold">
                        #{b.booking_number} - {b.customer?.first_name} {b.customer?.last_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {!b.provider_id ? "No cleaner assigned" : "Pending confirmation"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                      {!b.provider_id ? "Assign" : "Confirm"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Upcoming bookings</span></div>
                <span className="text-sm font-semibold">{(upcoming || []).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Active cleaners</span></div>
                <span className="text-sm font-semibold">1</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-xs text-muted-foreground">Needs attention</span></div>
                <span className="text-sm font-semibold">{needsAttention.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Insight */}
          <Card className="border-0 shadow-sm bg-primary/5 border-primary/10">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">AI Insight</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Based on booking patterns, Tuesdays and Thursdays have the highest demand. 
                    Consider hiring another cleaner for the DFW area to reduce unassigned bookings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
