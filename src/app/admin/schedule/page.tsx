"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";
import { ListSkeleton } from "@/components/loading-skeleton";

const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-100 border-emerald-300 text-emerald-800",
  pending: "bg-amber-100 border-amber-300 text-amber-800",
  in_progress: "bg-blue-100 border-blue-300 text-blue-800",
  completed: "bg-slate-100 border-slate-300 text-slate-600",
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function timeToSlot(time: string): string {
  // Convert "08:00:00" or "08:30:00" to nearest hour slot "8:00 AM"
  const [h, m] = time.split(":").map(Number);
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour}:00 ${ampm}`;
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const ws = getWeekStart(new Date());
    ws.setDate(ws.getDate() + weekOffset * 7);
    return ws;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const weekEnd = useMemo(() => {
    const we = new Date(weekStart);
    we.setDate(we.getDate() + 6);
    return we;
  }, [weekStart]);

  const { data: bookings, loading } = useQuery(async () => {
    const supabase = createClient();
    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];
    const { data } = await supabase
      .from("bookings")
      .select(`*, customer:customers(first_name, last_name), provider:providers(first_name, last_name)`)
      .gte("scheduled_date", startStr)
      .lte("scheduled_date", endStr)
      .order("scheduled_time", { ascending: true });
    return data || [];
  }, [weekOffset]);

  // Group bookings by date and time slot
  const bookingGrid = useMemo(() => {
    const grid: Record<string, Record<string, any[]>> = {};
    weekDates.forEach((d) => {
      const dateStr = d.toISOString().split("T")[0];
      grid[dateStr] = {};
    });
    (bookings || []).forEach((b: any) => {
      const dateStr = b.scheduled_date;
      const slot = b.scheduled_time ? timeToSlot(b.scheduled_time) : "8:00 AM";
      if (grid[dateStr]) {
        if (!grid[dateStr][slot]) grid[dateStr][slot] = [];
        grid[dateStr][slot].push(b);
      }
    });
    return grid;
  }, [bookings, weekDates]);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${(bookings || []).length} bookings this week`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} className="text-xs h-8">
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium px-3 min-w-[180px] text-center">{formatDateRange(weekStart)}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><ListSkeleton rows={8} /></div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header */}
                <div className="grid grid-cols-8 border-b border-border bg-muted/30">
                  <div className="p-3 text-xs font-medium text-muted-foreground uppercase">Time</div>
                  {weekDates.map((date, i) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const isToday = dateStr === todayStr;
                    return (
                      <div key={i} className={`p-3 text-center ${isToday ? "bg-teal-50" : ""}`}>
                        <p className="text-xs font-medium text-muted-foreground uppercase">{weekDayLabels[i]}</p>
                        <p className={`text-sm font-semibold mt-0.5 ${isToday ? "text-teal-700" : ""}`}>{date.getDate()}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Time slots */}
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 border-b border-border/50 min-h-[52px]">
                    <div className="p-2 text-xs text-muted-foreground flex items-start pt-3">{time}</div>
                    {weekDates.map((date, i) => {
                      const dateStr = date.toISOString().split("T")[0];
                      const isToday = dateStr === todayStr;
                      const cellBookings = bookingGrid[dateStr]?.[time] || [];
                      return (
                        <div key={i} className={`p-1 border-l border-border/30 ${isToday ? "bg-teal-50/30" : ""}`}>
                          {cellBookings.map((b: any) => (
                            <div
                              key={b.id}
                              className={`p-1.5 rounded text-[11px] border cursor-pointer hover:opacity-80 transition-opacity mb-1 ${statusColors[b.status] || statusColors.pending}`}
                              onClick={() => toast.info(`Booking #${b.booking_number} - ${b.customer?.first_name} ${b.customer?.last_name}`)}
                            >
                              <p className="font-medium truncate">
                                {b.customer?.first_name} {b.customer?.last_name?.[0]}.
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
