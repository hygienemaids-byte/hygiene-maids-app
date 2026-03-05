"use client";

import {
  CalendarDays,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Star,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const kpiCards = [
  {
    title: "Today's Bookings",
    value: "7",
    change: "+2 from yesterday",
    trend: "up" as const,
    icon: CalendarDays,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    title: "Monthly Revenue",
    value: "$12,480",
    change: "+18% vs last month",
    trend: "up" as const,
    icon: DollarSign,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    title: "Active Customers",
    value: "156",
    change: "+12 this month",
    trend: "up" as const,
    icon: Users,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    title: "Avg. Rating",
    value: "4.77",
    change: "65 reviews total",
    trend: "up" as const,
    icon: Star,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
];

const todaysBookings = [
  {
    id: "1",
    time: "8:00 AM",
    customer: "Sarah Johnson",
    address: "1234 Oak Lane, Plano",
    type: "Bi-Weekly",
    status: "confirmed" as const,
    provider: "Ana Lopez",
    total: "$171.14",
  },
  {
    id: "2",
    time: "10:00 AM",
    customer: "Michael Chen",
    address: "567 Elm St, Richardson",
    type: "Weekly",
    status: "in_progress" as const,
    provider: "Ana Lopez",
    total: "$143.20",
  },
  {
    id: "3",
    time: "1:00 PM",
    customer: "Henry Kabakwu",
    address: "890 Maple Dr, Dallas",
    type: "Weekly",
    status: "pending" as const,
    provider: "Ana Lopez",
    total: "$171.14",
  },
  {
    id: "4",
    time: "3:00 PM",
    customer: "Emily Davis",
    address: "321 Pine Ave, Frisco",
    type: "One-Time",
    status: "confirmed" as const,
    provider: "Unassigned",
    total: "$199.00",
  },
];

const actionItems = [
  {
    type: "warning",
    message: "3 bookings need provider assignment",
    action: "Assign",
    href: "/admin/bookings",
  },
  {
    type: "info",
    message: "5 new leads awaiting follow-up",
    action: "Review",
    href: "/admin/leads",
  },
  {
    type: "alert",
    message: "2 applicants ready for interview",
    action: "Schedule",
    href: "/admin/hiring",
  },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-50 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  in_progress: "In Progress",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back. Here&apos;s what&apos;s happening today.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-bold mt-1.5 tracking-tight">{kpi.value}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {kpi.trend === "up" ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className="text-[11px] text-muted-foreground">{kpi.change}</span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl ${kpi.bgColor}`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timeline */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
                <Link href="/admin/schedule">
                  <Button variant="ghost" size="sm" className="text-xs h-8">
                    View Full Schedule
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                {todaysBookings.map((booking, i) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Time */}
                    <div className="w-16 shrink-0 text-center">
                      <p className="text-sm font-semibold">{booking.time}</p>
                    </div>

                    {/* Timeline dot */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          booking.status === "in_progress"
                            ? "bg-blue-500 ring-4 ring-blue-100"
                            : booking.status === "confirmed"
                            ? "bg-emerald-500"
                            : "bg-amber-400"
                        }`}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{booking.customer}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[booking.status]}`}
                        >
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {booking.address}
                      </p>
                    </div>

                    {/* Provider & Price */}
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-sm font-semibold">{booking.total}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {booking.provider === "Unassigned" ? (
                          <span className="text-amber-600 font-medium">Unassigned</span>
                        ) : (
                          booking.provider
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Queue */}
        <div className="space-y-4">
          {/* Action Items */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-2.5">
              {actionItems.map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <p className="text-xs text-foreground/80 flex-1">{item.message}</p>
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary">
                      {item.action}
                    </Button>
                  </div>
                </Link>
              ))}
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
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Completed this week</span>
                  </div>
                  <span className="text-sm font-semibold">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Avg. job duration</span>
                  </div>
                  <span className="text-sm font-semibold">2.5 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Active cleaners</span>
                  </div>
                  <span className="text-sm font-semibold">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Revenue today</span>
                  </div>
                  <span className="text-sm font-semibold">$684.48</span>
                </div>
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
