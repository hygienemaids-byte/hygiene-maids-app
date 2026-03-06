// @ts-nocheck
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Clock, MapPin, User, GripVertical,
  Eye, List, CalendarDays, Filter, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

export interface CalendarBooking {
  id: string;
  booking_number: number | string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration?: number;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft_range?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  frequency?: string;
  total?: number;
  customer_name?: string;
  provider_name?: string;
  provider_id?: string;
  provider_color?: string; // hex color assigned by admin
}

export interface ProviderInfo {
  id: string;
  name: string;
  color: string; // hex color
}

export type CalendarRole = "admin" | "customer" | "provider";
export type CalendarView = "month" | "week" | "day" | "list";

interface BookingCalendarProps {
  bookings: CalendarBooking[];
  role: CalendarRole;
  view?: CalendarView;
  providers?: ProviderInfo[];
  onReschedule?: (bookingId: string, newDate: string, newTime: string) => Promise<void>;
  onBookingClick?: (booking: CalendarBooking) => void;
  loading?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   border: "border-amber-200" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  completed: { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400",    border: "border-slate-200" },
  cancelled: { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",      border: "border-red-200" },
  draft:     { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500",   border: "border-purple-200" },
};

// Default cleaner colors for admin to assign
const DEFAULT_PROVIDER_COLORS = [
  "#3B82F6", "#EF4444", "#F59E0B", "#10B981", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
  "#D946EF", "#84CC16", "#0EA5E9", "#E11D48", "#A855F7",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const TIME_SLOTS = [
  "08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00",
];

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

function fmtTime(t: string) {
  try { return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
  catch { return t; }
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function fmtDateShort(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function BookingCalendar({
  bookings,
  role,
  view: initialView = "month",
  providers = [],
  onReschedule,
  onBookingClick,
  loading = false,
}: BookingCalendarProps) {
  const today = new Date();
  const todayStr = dateStr(today);
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [calendarView, setCalendarView] = useState<CalendarView>(initialView);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [draggedBooking, setDraggedBooking] = useState<CalendarBooking | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; time?: string } | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const canDrag = (role === "admin" || role === "customer") && !!onReschedule;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build provider color map
  const providerColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    providers.forEach((p, i) => {
      map[p.id] = p.color || DEFAULT_PROVIDER_COLORS[i % DEFAULT_PROVIDER_COLORS.length];
    });
    // Also assign colors to providers found in bookings but not in the providers list
    bookings.forEach((b) => {
      if (b.provider_id && !map[b.provider_id]) {
        const idx = Object.keys(map).length;
        map[b.provider_id] = b.provider_color || DEFAULT_PROVIDER_COLORS[idx % DEFAULT_PROVIDER_COLORS.length];
      }
    });
    return map;
  }, [providers, bookings]);

  // Filter bookings by selected providers
  const filteredBookings = useMemo(() => {
    if (selectedProviders.length === 0) return bookings;
    return bookings.filter((b) =>
      b.provider_id ? selectedProviders.includes(b.provider_id) : selectedProviders.includes("unassigned")
    );
  }, [bookings, selectedProviders]);

  // Index bookings by date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, CalendarBooking[]> = {};
    for (const b of filteredBookings) {
      if (!map[b.scheduled_date]) map[b.scheduled_date] = [];
      map[b.scheduled_date].push(b);
    }
    for (const date in map) {
      map[date].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    }
    return map;
  }, [filteredBookings]);

  // All unique providers from bookings (for filter)
  const allProviders = useMemo(() => {
    const pMap = new Map<string, { id: string; name: string; color: string }>();
    providers.forEach((p) => pMap.set(p.id, { id: p.id, name: p.name, color: providerColorMap[p.id] || "#94A3B8" }));
    bookings.forEach((b) => {
      if (b.provider_id && !pMap.has(b.provider_id)) {
        pMap.set(b.provider_id, {
          id: b.provider_id,
          name: b.provider_name || "Unknown",
          color: providerColorMap[b.provider_id] || "#94A3B8",
        });
      }
    });
    const hasUnassigned = bookings.some((b) => !b.provider_id);
    const list = Array.from(pMap.values());
    if (hasUnassigned) list.push({ id: "unassigned", name: "Unassigned", color: "#94A3B8" });
    return list;
  }, [providers, bookings, providerColorMap]);

  // Navigation
  const navigate = useCallback((dir: number) => {
    setCurrentDate((prev) => {
      if (calendarView === "month") return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
      if (calendarView === "week") { const d = new Date(prev); d.setDate(d.getDate() + dir * 7); return d; }
      if (calendarView === "list") return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
      const d = new Date(prev); d.setDate(d.getDate() + dir); return d;
    });
  }, [calendarView]);

  const goToToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  // Toggle provider filter
  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, booking: CalendarBooking) => {
    if (!canDrag || !["confirmed", "pending"].includes(booking.status)) return;
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

  const handleDragLeave = () => setDropTarget(null);

  const handleDrop = async (e: React.DragEvent, date: string, time?: string) => {
    e.preventDefault();
    if (!draggedBooking || !onReschedule) return;
    const newTime = time || draggedBooking.scheduled_time;
    if (date === draggedBooking.scheduled_date && newTime === draggedBooking.scheduled_time) {
      setDraggedBooking(null); setDropTarget(null); return;
    }
    setRescheduling(true);
    try { await onReschedule(draggedBooking.id, date, newTime); }
    catch { /* parent handles */ }
    finally { setRescheduling(false); setDraggedBooking(null); setDropTarget(null); }
  };

  const handleBookingClick = (booking: CalendarBooking) => {
    if (onBookingClick) onBookingClick(booking);
    else setSelectedBooking(booking);
  };

  // Get color for a booking (provider color or status color)
  const getBookingColor = (booking: CalendarBooking) => {
    if (role === "admin" && booking.provider_id && providerColorMap[booking.provider_id]) {
      return providerColorMap[booking.provider_id];
    }
    return null; // fallback to status colors
  };

  /* ─── BOOKING CHIP ─── */
  const BookingChip = ({ booking, compact = false }: { booking: CalendarBooking; compact?: boolean }) => {
    const providerColor = getBookingColor(booking);
    const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
    const isDraggable = canDrag && ["confirmed", "pending"].includes(booking.status);
    const isDragging = draggedBooking?.id === booking.id;

    // Use provider color for admin, status color for others
    const chipStyle = providerColor
      ? {
          backgroundColor: hexToRgba(providerColor, 0.12),
          borderLeft: `3px solid ${providerColor}`,
          color: providerColor,
        }
      : {};

    const chipClass = providerColor
      ? "border border-transparent"
      : `${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`;

    return (
      <div
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, booking)}
        onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}
        style={chipStyle}
        className={`
          group relative rounded-md px-2 py-1.5 text-xs cursor-pointer transition-all
          ${chipClass}
          hover:shadow-md hover:scale-[1.02]
          ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
          ${isDragging ? "opacity-30 scale-95" : ""}
        `}
      >
        <div className="flex items-center gap-1.5">
          {isDraggable && <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 shrink-0" />}
          {!isDraggable && role === "provider" && <Eye className="w-3 h-3 opacity-50 shrink-0" />}
          {!providerColor && <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} shrink-0`} />}
          <span className="font-semibold truncate">{fmtTime(booking.scheduled_time)}</span>
          {!compact && booking.customer_name && (
            <span className="truncate opacity-70 font-medium">{booking.customer_name}</span>
          )}
        </div>
        {!compact && (
          <div className="truncate opacity-60 mt-0.5 text-[10px] font-medium" style={providerColor ? { color: providerColor } : {}}>
            #{booking.booking_number}
            {booking.bedrooms ? ` · ${booking.bedrooms}bd/${booking.bathrooms}ba` : ""}
            {booking.provider_name ? ` · ${booking.provider_name}` : ""}
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     MONTH VIEW
     ═══════════════════════════════════════════════════════════════════ */

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const cells: JSX.Element[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      cells.push(
        <div key={`prev-${i}`} className="min-h-[110px] p-1.5 bg-slate-50/30 border-b border-r border-slate-100/80">
          <span className="text-[11px] text-slate-300 font-medium">{day}</span>
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayBookings = bookingsByDate[ds] || [];
      const isToday = ds === todayStr;
      const isDropping = dropTarget?.date === ds;
      const isSunday = new Date(year, month, day).getDay() === 0;

      cells.push(
        <div
          key={ds}
          className={`
            min-h-[110px] p-1.5 border-b border-r border-slate-100/80 transition-all
            ${isToday ? "bg-teal-50/60 ring-1 ring-inset ring-teal-200" : isSunday ? "bg-slate-50/40" : "bg-white"}
            ${isDropping ? "bg-teal-100/60 ring-2 ring-teal-400 ring-inset" : ""}
          `}
          onDragOver={(e) => handleDragOver(e, ds)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, ds)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`
              text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full
              ${isToday ? "bg-teal-600 text-white" : "text-slate-600"}
            `}>
              {day}
            </span>
            {dayBookings.length > 0 && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">
                {dayBookings.length}
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            {dayBookings.slice(0, 3).map((b) => (
              <BookingChip key={b.id} booking={b} compact />
            ))}
            {dayBookings.length > 3 && (
              <button
                onClick={() => { setCurrentDate(new Date(year, month, day)); setCalendarView("day"); }}
                className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 hover:underline pl-1"
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
        <div key={`next-${i}`} className="min-h-[110px] p-1.5 bg-slate-50/30 border-b border-r border-slate-100/80">
          <span className="text-[11px] text-slate-300 font-medium">{i}</span>
        </div>
      );
    }

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-slate-50/80">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-slate-500 py-2.5 border-b border-r border-slate-100/80 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{cells}</div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     WEEK VIEW
     ═══════════════════════════════════════════════════════════════════ */

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const weekDays: { date: Date; ds: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      weekDays.push({ date: d, ds: dateStr(d) });
    }

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-slate-50/80 border-b border-slate-200">
          <div className="border-r border-slate-100/80 flex items-center justify-center text-[10px] text-slate-400 font-medium">TIME</div>
          {weekDays.map(({ date, ds }) => (
            <div key={ds} className={`text-center py-2.5 border-r border-slate-100/80 ${ds === todayStr ? "bg-teal-50/60" : ""}`}>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{DAYS[date.getDay()]}</div>
              <div className={`text-sm font-bold ${ds === todayStr ? "text-teal-600" : "text-slate-700"}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="max-h-[540px] overflow-y-auto">
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-50/80">
              <div className="text-[10px] text-slate-400 text-right pr-2 py-3 border-r border-slate-100/80 font-medium">
                {fmtTime(time)}
              </div>
              {weekDays.map(({ ds }) => {
                const slotBookings = (bookingsByDate[ds] || []).filter((b) => b.scheduled_time === time);
                const isDropping = dropTarget?.date === ds && dropTarget?.time === time;

                return (
                  <div
                    key={`${ds}-${time}`}
                    className={`
                      min-h-[52px] p-0.5 border-r border-slate-50/80 transition-all
                      ${isDropping ? "bg-teal-100/50 ring-1 ring-teal-400 ring-inset" : "hover:bg-slate-50/50"}
                    `}
                    onDragOver={(e) => handleDragOver(e, ds, time)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, ds, time)}
                  >
                    {slotBookings.map((b) => <BookingChip key={b.id} booking={b} compact />)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     DAY VIEW
     ═══════════════════════════════════════════════════════════════════ */

  const renderDayView = () => {
    const ds = dateStr(currentDate);
    const dayBookings = bookingsByDate[ds] || [];

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">
            {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="max-h-[540px] overflow-y-auto">
          {TIME_SLOTS.map((time) => {
            const slotBookings = dayBookings.filter((b) => b.scheduled_time === time);
            const isDropping = dropTarget?.date === ds && dropTarget?.time === time;

            return (
              <div
                key={time}
                className={`flex border-b border-slate-50/80 transition-all ${isDropping ? "bg-teal-100/50" : "hover:bg-slate-50/30"}`}
                onDragOver={(e) => handleDragOver(e, ds, time)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, ds, time)}
              >
                <div className="w-20 shrink-0 text-xs text-slate-400 text-right pr-3 py-3.5 border-r border-slate-100/80 font-medium">
                  {fmtTime(time)}
                </div>
                <div className="flex-1 p-2 space-y-1 min-h-[60px]">
                  {slotBookings.map((b) => <BookingChip key={b.id} booking={b} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     LIST VIEW
     ═══════════════════════════════════════════════════════════════════ */

  const renderListView = () => {
    // Show all bookings for the current month, grouped by date
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(getDaysInMonth(year, month)).padStart(2, "0")}`;

    const monthBookings = filteredBookings
      .filter((b) => b.scheduled_date >= monthStart && b.scheduled_date <= monthEnd)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || a.scheduled_time.localeCompare(b.scheduled_time));

    // Group by date
    const groups: { date: string; bookings: CalendarBooking[] }[] = [];
    let currentGroup: { date: string; bookings: CalendarBooking[] } | null = null;
    for (const b of monthBookings) {
      if (!currentGroup || currentGroup.date !== b.scheduled_date) {
        currentGroup = { date: b.scheduled_date, bookings: [] };
        groups.push(currentGroup);
      }
      currentGroup.bookings.push(b);
    }

    if (groups.length === 0) {
      return (
        <div className="text-center py-16 border border-slate-200 rounded-xl bg-white">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bookings this month</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {groups.map(({ date, bookings: dayBookings }) => {
          const d = new Date(date + "T12:00:00");
          const isToday = date === todayStr;

          return (
            <div key={date} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className={`px-4 py-2.5 border-b flex items-center justify-between ${isToday ? "bg-teal-50 border-teal-200" : "bg-slate-50/80 border-slate-100"}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isToday ? "text-teal-700" : "text-slate-800"}`}>
                    {d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </span>
                  {isToday && <Badge className="bg-teal-600 text-white text-[10px] px-1.5 py-0">Today</Badge>}
                </div>
                <span className="text-xs text-slate-400 font-medium">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {dayBookings.map((booking) => {
                  const providerColor = getBookingColor(booking);
                  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;

                  return (
                    <div
                      key={booking.id}
                      onClick={() => handleBookingClick(booking)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/50 cursor-pointer transition-colors group"
                      style={providerColor ? { borderLeft: `3px solid ${providerColor}` } : {}}
                    >
                      {/* Time */}
                      <div className="w-16 shrink-0">
                        <p className="text-sm font-bold text-slate-800">{fmtTime(booking.scheduled_time)}</p>
                        {booking.estimated_duration && (
                          <p className="text-[10px] text-slate-400">{booking.estimated_duration}h</p>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">#{booking.booking_number}</span>
                          <Badge variant="outline" className={`text-[10px] ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {(booking.status || "").replace("_", " ")}
                          </Badge>
                          {booking.frequency && booking.frequency !== "one_time" && (
                            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200">
                              {booking.frequency.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {booking.customer_name && (
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{booking.customer_name}</span>
                          )}
                          {booking.address_line1 && (
                            <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{booking.address_line1}, {booking.city}</span>
                          )}
                          {booking.bedrooms && (
                            <span className="shrink-0">{booking.bedrooms}bd/{booking.bathrooms}ba</span>
                          )}
                        </div>
                      </div>

                      {/* Provider + Price */}
                      <div className="text-right shrink-0">
                        {booking.total && (
                          <p className="text-sm font-bold text-slate-800">{fmt$(Number(booking.total))}</p>
                        )}
                        {booking.provider_name && (
                          <p className="text-[11px] font-medium mt-0.5" style={providerColor ? { color: providerColor } : { color: "#64748B" }}>
                            {booking.provider_name}
                          </p>
                        )}
                        {!booking.provider_id && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">Unassigned</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     HEADER TITLE
     ═══════════════════════════════════════════════════════════════════ */

  const headerTitle = useMemo(() => {
    if (calendarView === "month" || calendarView === "list") return `${MONTHS[month]} ${year}`;
    if (calendarView === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${fmtDateShort(dateStr(startOfWeek))} – ${fmtDateShort(dateStr(endOfWeek))}, ${endOfWeek.getFullYear()}`;
    }
    return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, [calendarView, currentDate, month, year]);

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-4">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-bold text-slate-800 ml-2">{headerTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {(["month", "week", "day", "list"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setCalendarView(v)}
                className={`
                  px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all capitalize flex items-center gap-1
                  ${calendarView === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}
                `}
              >
                {v === "list" && <List className="w-3 h-3" />}
                {v === "month" && <CalendarDays className="w-3 h-3" />}
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Provider Filter (Admin only) ─── */}
      {role === "admin" && allProviders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Cleaners:</span>
          </div>
          {allProviders.map((p) => {
            const isSelected = selectedProviders.length === 0 || selectedProviders.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProvider(p.id)}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border
                  ${isSelected
                    ? "shadow-sm"
                    : "opacity-40 grayscale hover:opacity-60"
                  }
                `}
                style={{
                  backgroundColor: isSelected ? hexToRgba(p.color, 0.12) : undefined,
                  borderColor: isSelected ? hexToRgba(p.color, 0.3) : "#e2e8f0",
                  color: isSelected ? p.color : "#94a3b8",
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            );
          })}
          {selectedProviders.length > 0 && (
            <button
              onClick={() => setSelectedProviders([])}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* ─── Role indicator ─── */}
      {role === "provider" && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 font-medium">
          <Eye className="w-3.5 h-3.5" />
          <span>View only — contact admin to reschedule bookings</span>
        </div>
      )}

      {/* ─── Loading ─── */}
      {(loading || rescheduling) && (
        <div className="flex items-center gap-2 text-xs text-teal-600 bg-teal-50 rounded-lg px-3 py-2 font-medium">
          <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>{rescheduling ? "Rescheduling booking..." : "Loading bookings..."}</span>
        </div>
      )}

      {/* ─── Calendar Views ─── */}
      {calendarView === "month" && renderMonthView()}
      {calendarView === "week" && renderWeekView()}
      {calendarView === "day" && renderDayView()}
      {calendarView === "list" && renderListView()}

      {/* ─── Legend ─── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Status legend */}
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-medium">
          {Object.entries(STATUS_STYLES).filter(([s]) => s !== "draft").map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="capitalize">{status.replace("_", " ")}</span>
            </div>
          ))}
        </div>

        {/* Provider color legend (admin) */}
        {role === "admin" && allProviders.filter(p => p.id !== "unassigned").length > 0 && (
          <>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex flex-wrap gap-3 text-[11px] font-medium">
              {allProviders.filter(p => p.id !== "unassigned").map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                  <span style={{ color: p.color }}>{p.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {canDrag && (
          <div className="flex items-center gap-1.5 text-[11px] text-teal-600 font-medium ml-auto">
            <GripVertical className="w-3 h-3" />
            <span>Drag to reschedule</span>
          </div>
        )}
      </div>

      {/* ─── Booking Detail Dialog ─── */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Booking #{selectedBooking?.booking_number}
              {selectedBooking?.provider_id && providerColorMap[selectedBooking.provider_id] && (
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: providerColorMap[selectedBooking.provider_id] }} />
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`${STATUS_STYLES[selectedBooking.status]?.bg} ${STATUS_STYLES[selectedBooking.status]?.text} ${STATUS_STYLES[selectedBooking.status]?.border}`}>
                  {(selectedBooking.status || "").replace("_", " ")}
                </Badge>
                {selectedBooking.frequency && selectedBooking.frequency !== "one_time" && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
                    {selectedBooking.frequency.replace("_", " ")}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Date</p>
                  <p className="font-semibold text-slate-700">{fmtDate(selectedBooking.scheduled_date)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium">Time</p>
                  <p className="font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />{fmtTime(selectedBooking.scheduled_time)}
                  </p>
                </div>
                {selectedBooking.address_line1 && (
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs font-medium">Address</p>
                    <p className="font-medium text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {selectedBooking.address_line1}, {selectedBooking.city} {selectedBooking.state} {selectedBooking.zip_code}
                    </p>
                  </div>
                )}
                {selectedBooking.customer_name && (
                  <div>
                    <p className="text-slate-400 text-xs font-medium">Customer</p>
                    <p className="font-medium text-slate-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />{selectedBooking.customer_name}
                    </p>
                  </div>
                )}
                {selectedBooking.total != null && (
                  <div>
                    <p className="text-slate-400 text-xs font-medium">Total</p>
                    <p className="font-bold text-slate-900">{fmt$(Number(selectedBooking.total))}</p>
                  </div>
                )}
                {selectedBooking.bedrooms && (
                  <div>
                    <p className="text-slate-400 text-xs font-medium">Home</p>
                    <p className="font-medium text-slate-700">{selectedBooking.bedrooms}bd / {selectedBooking.bathrooms}ba</p>
                  </div>
                )}
                {selectedBooking.provider_name && (
                  <div>
                    <p className="text-slate-400 text-xs font-medium">Cleaner</p>
                    <p className="font-medium flex items-center gap-1.5"
                       style={{ color: providerColorMap[selectedBooking.provider_id || ""] || "#334155" }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: providerColorMap[selectedBooking.provider_id || ""] || "#94A3B8" }} />
                      {selectedBooking.provider_name}
                    </p>
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
