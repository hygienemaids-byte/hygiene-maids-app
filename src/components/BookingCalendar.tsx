"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, GripVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Types ─── */
export interface CalendarBooking {
  id: string;
  booking_number: number | string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM
  estimated_duration?: number;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft_range?: string;
  address_line1?: string;
  city?: string;
  frequency?: string;
  total?: number;
  customer_name?: string;
  provider_name?: string;
}

export type CalendarRole = "admin" | "customer" | "provider";
export type CalendarView = "month" | "week" | "day";

interface BookingCalendarProps {
  bookings: CalendarBooking[];
  role: CalendarRole;
  view?: CalendarView;
  onReschedule?: (bookingId: string, newDate: string, newTime: string) => Promise<void>;
  onBookingClick?: (booking: CalendarBooking) => void;
  loading?: boolean;
}

/* ─── Status colors ─── */
const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  completed: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  cancelled: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
};

/* ─── Helpers ─── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatTime(time: string) {
  try {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return time;
  }
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

/* ─── Component ─── */
export default function BookingCalendar({
  bookings,
  role,
  view: initialView = "month",
  onReschedule,
  onBookingClick,
  loading = false,
}: BookingCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [calendarView, setCalendarView] = useState<CalendarView>(initialView);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [draggedBooking, setDraggedBooking] = useState<CalendarBooking | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; time?: string } | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const canDrag = role === "admin" || role === "customer";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Index bookings by date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, CalendarBooking[]> = {};
    for (const b of bookings) {
      if (!map[b.scheduled_date]) map[b.scheduled_date] = [];
      map[b.scheduled_date].push(b);
    }
    // Sort each day's bookings by time
    for (const date in map) {
      map[date].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    }
    return map;
  }, [bookings]);

  // Navigation
  const navigate = useCallback((dir: number) => {
    setCurrentDate((prev) => {
      if (calendarView === "month") {
        return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
      } else if (calendarView === "week") {
        const d = new Date(prev);
        d.setDate(d.getDate() + dir * 7);
        return d;
      } else {
        const d = new Date(prev);
        d.setDate(d.getDate() + dir);
        return d;
      }
    });
  }, [calendarView]);

  const goToToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, booking: CalendarBooking) => {
    if (!canDrag) return;
    if (!["confirmed", "pending"].includes(booking.status)) return;
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", booking.id);
  };

  const handleDragOver = (e: React.DragEvent, date: string, time?: string) => {
    if (!draggedBooking) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ date, time });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, date: string, time?: string) => {
    e.preventDefault();
    if (!draggedBooking || !onReschedule) return;

    const newTime = time || draggedBooking.scheduled_time;
    if (date === draggedBooking.scheduled_date && newTime === draggedBooking.scheduled_time) {
      setDraggedBooking(null);
      setDropTarget(null);
      return;
    }

    setRescheduling(true);
    try {
      await onReschedule(draggedBooking.id, date, newTime);
    } catch {
      // Error handled by parent
    } finally {
      setRescheduling(false);
      setDraggedBooking(null);
      setDropTarget(null);
    }
  };

  const handleBookingClick = (booking: CalendarBooking) => {
    if (onBookingClick) {
      onBookingClick(booking);
    } else {
      setSelectedBooking(booking);
    }
  };

  /* ─── Booking chip ─── */
  const BookingChip = ({ booking, compact = false }: { booking: CalendarBooking; compact?: boolean }) => {
    const colors = statusColors[booking.status] || statusColors.pending;
    const isDraggable = canDrag && ["confirmed", "pending"].includes(booking.status);

    return (
      <div
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, booking)}
        onClick={() => handleBookingClick(booking)}
        className={`
          group relative rounded-md px-2 py-1 text-xs cursor-pointer transition-all
          ${colors.bg} ${colors.text} border border-transparent
          hover:border-current/20 hover:shadow-sm
          ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
          ${draggedBooking?.id === booking.id ? "opacity-40" : ""}
        `}
      >
        <div className="flex items-center gap-1">
          {isDraggable && (
            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 shrink-0" />
          )}
          {!isDraggable && role === "provider" && (
            <Eye className="w-3 h-3 opacity-50 shrink-0" />
          )}
          <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
          <span className="font-medium truncate">
            {compact ? formatTime(booking.scheduled_time) : `${formatTime(booking.scheduled_time)}`}
          </span>
          {!compact && booking.customer_name && (
            <span className="truncate opacity-70 ml-1">{booking.customer_name}</span>
          )}
        </div>
        {!compact && (
          <div className="truncate opacity-60 mt-0.5 pl-5">
            #{booking.booking_number} &middot; {booking.bedrooms}bd/{booking.bathrooms}ba
          </div>
        )}
      </div>
    );
  };

  /* ─── MONTH VIEW ─── */
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const cells: JSX.Element[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push(
        <div key={`prev-${i}`} className="min-h-[100px] p-1.5 bg-slate-50/50 border-b border-r border-slate-100">
          <span className="text-xs text-slate-300">{day}</span>
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayBookings = bookingsByDate[dateStr] || [];
      const isToday = dateStr === todayStr;
      const isDropping = dropTarget?.date === dateStr;

      cells.push(
        <div
          key={dateStr}
          className={`
            min-h-[100px] p-1.5 border-b border-r border-slate-100 transition-colors
            ${isToday ? "bg-teal-50/50" : "bg-white"}
            ${isDropping ? "bg-teal-100/50 ring-2 ring-teal-400 ring-inset" : ""}
          `}
          onDragOver={(e) => handleDragOver(e, dateStr)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, dateStr)}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`
                text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? "bg-teal-600 text-white" : "text-slate-600"}
              `}
            >
              {day}
            </span>
            {dayBookings.length > 0 && (
              <span className="text-[10px] text-slate-400">{dayBookings.length}</span>
            )}
          </div>
          <div className="space-y-0.5">
            {dayBookings.slice(0, 3).map((b) => (
              <BookingChip key={b.id} booking={b} compact />
            ))}
            {dayBookings.length > 3 && (
              <button
                onClick={() => {
                  setCurrentDate(new Date(year, month, day));
                  setCalendarView("day");
                }}
                className="text-[10px] text-teal-600 hover:underline pl-1"
              >
                +{dayBookings.length - 3} more
              </button>
            )}
          </div>
        </div>
      );
    }

    // Next month padding
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push(
        <div key={`next-${i}`} className="min-h-[100px] p-1.5 bg-slate-50/50 border-b border-r border-slate-100">
          <span className="text-xs text-slate-300">{i}</span>
        </div>
      );
    }

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-slate-500 py-2 border-b border-r border-slate-100">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{cells}</div>
      </div>
    );
  };

  /* ─── WEEK VIEW ─── */
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const weekDays: { date: Date; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      weekDays.push({
        date: d,
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      });
    }

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-slate-50 border-b border-slate-200">
          <div className="border-r border-slate-100" />
          {weekDays.map(({ date, dateStr }) => (
            <div
              key={dateStr}
              className={`text-center py-2 border-r border-slate-100 ${dateStr === todayStr ? "bg-teal-50" : ""}`}
            >
              <div className="text-[10px] text-slate-400 uppercase">{DAYS[date.getDay()]}</div>
              <div className={`text-sm font-semibold ${dateStr === todayStr ? "text-teal-600" : "text-slate-700"}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="max-h-[500px] overflow-y-auto">
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-50">
              <div className="text-[10px] text-slate-400 text-right pr-2 py-2 border-r border-slate-100">
                {formatTime(time)}
              </div>
              {weekDays.map(({ dateStr }) => {
                const slotBookings = (bookingsByDate[dateStr] || []).filter(
                  (b) => b.scheduled_time === time
                );
                const isDropping = dropTarget?.date === dateStr && dropTarget?.time === time;

                return (
                  <div
                    key={`${dateStr}-${time}`}
                    className={`
                      min-h-[48px] p-0.5 border-r border-slate-50 transition-colors
                      ${isDropping ? "bg-teal-100/50 ring-1 ring-teal-400 ring-inset" : ""}
                    `}
                    onDragOver={(e) => handleDragOver(e, dateStr, time)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateStr, time)}
                  >
                    {slotBookings.map((b) => (
                      <BookingChip key={b.id} booking={b} compact />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─── DAY VIEW ─── */
  const renderDayView = () => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    const dayBookings = bookingsByDate[dateStr] || [];

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-700">
            {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {TIME_SLOTS.map((time) => {
            const slotBookings = dayBookings.filter((b) => b.scheduled_time === time);
            const isDropping = dropTarget?.date === dateStr && dropTarget?.time === time;

            return (
              <div
                key={time}
                className={`
                  flex border-b border-slate-50 transition-colors
                  ${isDropping ? "bg-teal-100/50" : ""}
                `}
                onDragOver={(e) => handleDragOver(e, dateStr, time)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateStr, time)}
              >
                <div className="w-20 shrink-0 text-xs text-slate-400 text-right pr-3 py-3 border-r border-slate-100">
                  {formatTime(time)}
                </div>
                <div className="flex-1 p-2 space-y-1 min-h-[56px]">
                  {slotBookings.map((b) => (
                    <BookingChip key={b.id} booking={b} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── Header title ─── */
  const headerTitle = useMemo(() => {
    if (calendarView === "month") {
      return `${MONTHS[month]} ${year}`;
    } else if (calendarView === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      const startStr = startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endStr = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${startStr} – ${endStr}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
  }, [calendarView, currentDate, month, year]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-800 ml-2">{headerTitle}</h2>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
          {(["month", "week", "day"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setCalendarView(v)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize
                ${calendarView === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}
              `}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Role indicator */}
      {role === "provider" && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          <Eye className="w-3.5 h-3.5" />
          <span>View only — contact admin to reschedule bookings</span>
        </div>
      )}

      {/* Loading overlay */}
      {(loading || rescheduling) && (
        <div className="flex items-center gap-2 text-xs text-teal-600 bg-teal-50 rounded-lg px-3 py-2">
          <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>{rescheduling ? "Rescheduling booking..." : "Loading bookings..."}</span>
        </div>
      )}

      {/* Calendar */}
      {calendarView === "month" && renderMonthView()}
      {calendarView === "week" && renderWeekView()}
      {calendarView === "day" && renderDayView()}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        {Object.entries(statusColors).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
            <span className="capitalize">{status.replace("_", " ")}</span>
          </div>
        ))}
        {canDrag && (
          <div className="flex items-center gap-1.5 ml-4 text-teal-600">
            <GripVertical className="w-3 h-3" />
            <span>Drag to reschedule</span>
          </div>
        )}
      </div>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking #{selectedBooking?.booking_number}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${statusColors[selectedBooking.status]?.bg} ${statusColors[selectedBooking.status]?.text}`}
                >
                  {selectedBooking.status.replace("_", " ")}
                </Badge>
                {selectedBooking.frequency && (
                  <Badge variant="outline" className="text-slate-500">
                    {selectedBooking.frequency}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Date</p>
                  <p className="font-medium text-slate-700">
                    {new Date(selectedBooking.scheduled_date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Time</p>
                  <p className="font-medium text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(selectedBooking.scheduled_time)}
                  </p>
                </div>
                {selectedBooking.address_line1 && (
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs">Address</p>
                    <p className="font-medium text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedBooking.address_line1}, {selectedBooking.city}
                    </p>
                  </div>
                )}
                {selectedBooking.customer_name && (
                  <div>
                    <p className="text-slate-400 text-xs">Customer</p>
                    <p className="font-medium text-slate-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {selectedBooking.customer_name}
                    </p>
                  </div>
                )}
                {selectedBooking.total && (
                  <div>
                    <p className="text-slate-400 text-xs">Total</p>
                    <p className="font-semibold text-slate-900">${selectedBooking.total.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-400 text-xs">Home</p>
                  <p className="font-medium text-slate-700">
                    {selectedBooking.bedrooms}bd / {selectedBooking.bathrooms}ba
                  </p>
                </div>
                {selectedBooking.sqft_range && (
                  <div>
                    <p className="text-slate-400 text-xs">Size</p>
                    <p className="font-medium text-slate-700">{selectedBooking.sqft_range} sqft</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
