"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const scheduleData: Record<string, { time: string; customer: string; status: string }[]> = {
  Mon: [
    { time: "8:00 AM", customer: "Sarah Johnson", status: "confirmed" },
    { time: "10:00 AM", customer: "Michael Chen", status: "confirmed" },
    { time: "1:00 PM", customer: "Henry Kabakwu", status: "confirmed" },
    { time: "3:00 PM", customer: "Lisa Martinez", status: "pending" },
  ],
  Tue: [
    { time: "9:00 AM", customer: "James Wilson", status: "confirmed" },
    { time: "11:00 AM", customer: "Emily Davis", status: "confirmed" },
    { time: "2:00 PM", customer: "Amanda Brooks", status: "pending" },
  ],
  Wed: [
    { time: "8:00 AM", customer: "Robert Kim", status: "confirmed" },
    { time: "10:00 AM", customer: "Patricia Garcia", status: "confirmed" },
    { time: "1:00 PM", customer: "David Thompson", status: "confirmed" },
  ],
  Thu: [
    { time: "9:00 AM", customer: "Sarah Johnson", status: "confirmed" },
    { time: "11:00 AM", customer: "Michael Chen", status: "confirmed" },
    { time: "2:00 PM", customer: "Henry Kabakwu", status: "confirmed" },
  ],
  Fri: [
    { time: "8:00 AM", customer: "Lisa Martinez", status: "confirmed" },
    { time: "10:00 AM", customer: "James Wilson", status: "confirmed" },
  ],
  Sat: [],
  Sun: [],
};

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-100 border-emerald-300 text-emerald-800",
  pending: "bg-amber-100 border-amber-300 text-amber-800",
  in_progress: "bg-blue-100 border-blue-300 text-blue-800",
};

export default function SchedulePage() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Weekly overview of all appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium px-3">Mar 2 - Mar 8, 2026</span>
          <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header */}
              <div className="grid grid-cols-8 border-b border-border">
                <div className="p-3 text-xs font-medium text-muted-foreground uppercase">Time</div>
                {weekDays.map((day) => (
                  <div key={day} className="p-3 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase">{day}</p>
                    <p className="text-sm font-semibold mt-0.5">{day === "Mon" ? "2" : day === "Tue" ? "3" : day === "Wed" ? "4" : day === "Thu" ? "5" : day === "Fri" ? "6" : day === "Sat" ? "7" : "8"}</p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 border-b border-border/50 min-h-[52px]">
                  <div className="p-2 text-xs text-muted-foreground flex items-start pt-3">{time}</div>
                  {weekDays.map((day) => {
                    const booking = scheduleData[day]?.find((b) => b.time === time);
                    return (
                      <div key={day} className="p-1 border-l border-border/30">
                        {booking && (
                          <div
                            className={`p-1.5 rounded text-[11px] border cursor-pointer hover:opacity-80 transition-opacity ${statusColors[booking.status]}`}
                            onClick={() => toast.info("Feature coming soon")}
                          >
                            <p className="font-medium truncate">{booking.customer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
