"use client";
import { useState, useMemo } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin,
  Home, Filter, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-500",
  pending: "bg-amber-500",
  in_progress: "bg-blue-500",
  completed: "bg-slate-400",
  cancelled: "bg-red-400",
};

const statusBadgeColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

type Booking = Record<string, unknown>;

async function getCustomerSchedule() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!customer) return [];

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", customer.id)
    .order("scheduled_date", { ascending: true });

  return bookings || [];
}

function formatTime(time: string) {
  try {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    });
  } catch { return time; }
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CustomerSchedule() {
  const { data: bookings, loading } = useQuery(() => getCustomerSchedule(), []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "list">("month");
  const [typeFilter, setTypeFilter] = useState<"all" | "recurring" | "one_time">("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b: Booking) => {
      if (typeFilter === "recurring" && b.frequency === "one_time") return false;
      if (typeFilter === "one_time" && b.frequency !== "one_time") return false;
      return true;
    });
  }, [bookings, typeFilter]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: Date; inMonth: boolean; bookings: Booking[] }[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, inMonth: false, bookings: [] });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split("T")[0];
      const dayBookings = filteredBookings.filter(
        (b: Booking) => (b.scheduled_date as string) === dateStr
      );
      days.push({ date: d, inMonth: true, bookings: dayBookings });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, inMonth: false, bookings: [] });
    }

    return days;
  }, [year, month, filteredBookings]);

  const today = new Date().toISOString().split("T")[0];

  // List view grouping
  const groupedBookings = useMemo(() => {
    const upcoming = filteredBookings.filter(
      (b: Booking) => (b.scheduled_date as string) >= today && b.status !== "cancelled"
    );
    const past = filteredBookings.filter(
      (b: Booking) => (b.scheduled_date as string) < today || b.status === "completed"
    );
    const cancelled = filteredBookings.filter((b: Booking) => b.status === "cancelled");
    return { upcoming, past, cancelled };
  }, [filteredBookings, today]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
          <p className="text-slate-500 mt-1">
            {groupedBookings.upcoming.length} upcoming · {groupedBookings.past.length} past
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className={view === "month" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"}
            >
              Calendar
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className={view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"}
            >
              List
            </Button>
          </div>
          <Link href="/book">
            <Button className="bg-teal-600 hover:bg-teal-700" size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Book
            </Button>
          </Link>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {[
          { key: "all" as const, label: "All Bookings" },
          { key: "recurring" as const, label: "Recurring" },
          { key: "one_time" as const, label: "One-Time" },
        ].map((f) => (
          <Button
            key={f.key}
            variant={typeFilter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(f.key)}
            className={typeFilter === f.key ? "bg-teal-600 hover:bg-teal-700" : ""}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {view === "month" ? (
        /* ─── Calendar View ─── */
        <Card className="border-slate-200 bg-white overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
                {MONTHS[month]} {year}
              </h2>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS.map((d) => (
              <div key={d} className="text-center py-2 text-xs font-medium text-slate-500">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dateStr = day.date.toISOString().split("T")[0];
              const isToday = dateStr === today;
              return (
                <div
                  key={i}
                  className={`min-h-[90px] border-b border-r border-slate-50 p-1.5 ${
                    !day.inMonth ? "bg-slate-50/50" : ""
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-teal-600 text-white" : day.inMonth ? "text-slate-700" : "text-slate-300"
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {day.bookings.slice(0, 2).map((b: Booking) => (
                      <div
                        key={b.id as string}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate text-white font-medium ${
                          statusColors[b.status as string] || "bg-slate-400"
                        }`}
                        title={`#${b.booking_number} - ${b.scheduled_time ? formatTime(b.scheduled_time as string) : "TBD"}`}
                      >
                        {b.scheduled_time ? formatTime(b.scheduled_time as string) : "TBD"}
                      </div>
                    ))}
                    {day.bookings.length > 2 && (
                      <div className="text-[10px] text-slate-400 px-1">
                        +{day.bookings.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-6 py-3 border-t border-slate-100">
            {Object.entries({ confirmed: "Confirmed", pending: "Pending", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled" }).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColors[key]}`} />
                <span className="text-[11px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* ─── List View ─── */
        <div className="space-y-8">
          {/* Upcoming */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-teal-600" />
              Upcoming ({groupedBookings.upcoming.length})
            </h2>
            {groupedBookings.upcoming.length === 0 ? (
              <Card className="border-slate-200 bg-white">
                <CardContent className="py-8 text-center">
                  <p className="text-slate-500">No upcoming bookings</p>
                  <Link href="/book">
                    <Button className="mt-3 bg-teal-600 hover:bg-teal-700" size="sm">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {groupedBookings.upcoming.map((b: Booking) => (
                  <BookingListItem key={b.id as string} booking={b} />
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {groupedBookings.past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Past ({groupedBookings.past.length})
              </h2>
              <div className="space-y-2">
                {groupedBookings.past.map((b: Booking) => (
                  <BookingListItem key={b.id as string} booking={b} />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled */}
          {groupedBookings.cancelled.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2 text-red-600">
                Cancelled ({groupedBookings.cancelled.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {groupedBookings.cancelled.map((b: Booking) => (
                  <BookingListItem key={b.id as string} booking={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingListItem({ booking }: { booking: Booking }) {
  return (
    <Card className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
      <CardContent className="py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-1.5 h-12 rounded-full ${statusColors[booking.status as string] || "bg-slate-300"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900">
                  {new Date((booking.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric",
                  })}
                </span>
                <span className="text-sm text-slate-500">
                  {booking.scheduled_time ? formatTime(booking.scheduled_time as string) : "TBD"}
                </span>
                <Badge variant="outline" className={`text-[10px] ${statusBadgeColors[booking.status as string] || ""}`}>
                  {(booking.status as string)?.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200">
                  {booking.frequency}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  {booking.bedrooms}bd/{booking.bathrooms}ba
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {booking.address_line1}, {booking.city}
                </span>
              </div>
            </div>
          </div>
          <span className="text-sm font-semibold text-slate-700 shrink-0">
            ${(booking.total as number)?.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
