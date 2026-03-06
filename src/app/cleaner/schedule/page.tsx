"use client";
import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
};

function getWeekDates(offset: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + offset * 7); // Sunday
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

async function getScheduleData(weekStart: string, weekEnd: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!provider) return [];

  const { data: jobs } = await supabase
    .from("bookings")
    .select("*, customers(first_name, last_name)")
    .eq("provider_id", provider.id)
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd)
    .neq("status", "cancelled")
    .order("scheduled_time", { ascending: true });

  return jobs || [];
}

export default function CleanerSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekStart = weekDates[0].toISOString().split("T")[0];
  const weekEnd = weekDates[6].toISOString().split("T")[0];

  const { data: jobs, loading } = useQuery(() => getScheduleData(weekStart, weekEnd), [weekOffset]);

  const today = new Date().toISOString().split("T")[0];

  const jobsByDate = useMemo(() => {
    const map: Record<string, Record<string, unknown>[]> = {};
    (jobs || []).forEach((j: Record<string, unknown>) => {
      const date = j.scheduled_date as string;
      if (!map[date]) map[date] = [];
      map[date].push(j);
    });
    return map;
  }, [jobs]);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500 mt-1">Your weekly cleaning schedule.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="text-center text-sm font-medium text-slate-600 mb-2">
        {weekDates[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} &mdash;{" "}
        {weekDates[6].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            const dayJobs = jobsByDate[dateStr] || [];
            const isToday = dateStr === today;
            const isPast = dateStr < today;

            return (
              <div
                key={dateStr}
                className={`rounded-xl border min-h-[180px] ${
                  isToday
                    ? "border-teal-300 bg-teal-50/50"
                    : isPast
                    ? "border-slate-100 bg-slate-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className={`px-3 py-2 border-b text-center ${isToday ? "border-teal-200" : "border-slate-100"}`}>
                  <p className={`text-[11px] font-medium ${isToday ? "text-teal-600" : "text-slate-400"}`}>
                    {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? "text-teal-700" : isPast ? "text-slate-400" : "text-slate-700"}`}>
                    {date.getDate()}
                  </p>
                </div>
                <div className="p-1.5 space-y-1">
                  {dayJobs.length === 0 ? (
                    <p className="text-[10px] text-slate-300 text-center py-4">No jobs</p>
                  ) : (
                    dayJobs.map((job) => {
                      const customer = job.customers as Record<string, unknown> | null;
                      return (
                        <div
                          key={job.id as string}
                          className={`rounded-lg px-2 py-1.5 text-[11px] border ${statusColors[job.status as string] || "bg-slate-50 border-slate-200"}`}
                        >
                          <p className="font-semibold truncate">
                            {job.scheduled_time
                              ? new Date(`2000-01-01T${job.scheduled_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                              : "TBD"}
                          </p>
                          <p className="truncate text-[10px] opacity-80">
                            {customer ? `${customer.first_name} ${(customer.last_name as string)?.charAt(0)}.` : "Customer"}
                          </p>
                          <p className="truncate text-[10px] opacity-60">
                            {job.bedrooms}bd/{job.bathrooms}ba
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
