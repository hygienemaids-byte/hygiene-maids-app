"use client";
import { useState } from "react";
import { CalendarDays, Clock, MapPin, Search, Filter, XCircle, RefreshCw, ChevronDown, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

type Booking = Record<string, unknown>;

async function getCustomerBookings() {
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
    .order("scheduled_date", { ascending: false });

  return bookings || [];
}

export default function CustomerBookings() {
  const { data: bookings, loading, refetch } = useQuery(() => getCustomerBookings(), []);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelDialog, setCancelDialog] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const filtered = (bookings || []).filter((b: Booking) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesNumber = String(b.booking_number).includes(q);
      const matchesAddress = String(b.address_line1 || "").toLowerCase().includes(q);
      const matchesCity = String(b.city || "").toLowerCase().includes(q);
      if (!matchesNumber && !matchesAddress && !matchesCity) return false;
    }
    return true;
  });

  const today = new Date().toISOString().split("T")[0];
  const upcomingCount = (bookings || []).filter(
    (b: Booking) => (b.scheduled_date as string) >= today && b.status !== "cancelled"
  ).length;
  const completedCount = (bookings || []).filter((b: Booking) => b.status === "completed").length;

  const handleCancel = async () => {
    if (!cancelDialog) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: cancelDialog.id,
          action: "cancel",
          cancellationReason: cancelReason || "Cancelled by customer",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");
      toast.success("Booking cancelled successfully");
      setCancelDialog(null);
      setCancelReason("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog || !newDate || !newTime) return;
    setRescheduling(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: rescheduleDialog.id,
          action: "reschedule",
          newDate,
          newTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reschedule");
      toast.success("Booking rescheduled successfully");
      setRescheduleDialog(null);
      setNewDate("");
      setNewTime("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule booking");
    } finally {
      setRescheduling(false);
    }
  };

  const canModify = (b: Booking) => {
    return ["confirmed", "pending"].includes(b.status as string) && (b.scheduled_date as string) >= today;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 mt-1">
            {upcomingCount} upcoming &middot; {completedCount} completed
          </p>
        </div>
        <Link href="/book">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Sparkles className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by booking #, address..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "confirmed", "pending", "in_progress", "completed", "cancelled"].map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
              className={filter === s ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {s === "all" ? "All" : statusLabels[s] || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No bookings found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {filter !== "all" ? "Try changing your filter." : "Book your first cleaning to get started!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: Booking) => (
            <Card key={booking.id as string} className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Date badge */}
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-slate-500 font-medium leading-none">
                        {new Date((booking.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                      </span>
                      <span className="text-xl font-bold text-slate-700 leading-none mt-0.5">
                        {new Date((booking.scheduled_date as string) + "T12:00:00").getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">
                          Booking #{booking.booking_number}
                        </span>
                        <Badge variant="outline" className={statusColors[booking.status as string] || ""}>
                          {statusLabels[booking.status as string] || (booking.status as string)}
                        </Badge>
                        <Badge variant="outline" className="text-slate-500 border-slate-200">
                          {booking.frequency}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {booking.scheduled_time
                            ? new Date(`2000-01-01T${booking.scheduled_time}`).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "TBD"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {booking.address_line1}, {booking.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                        <span>{booking.bedrooms}bd / {booking.bathrooms}ba</span>
                        <span>{booking.sqft_range} sqft</span>
                        <span className="font-medium text-slate-700">${(booking.total as number)?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canModify(booking) && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRescheduleDialog(booking);
                          setNewDate(booking.scheduled_date as string);
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Reschedule
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelDialog(booking)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel booking #{cancelDialog?.booking_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Reason for cancellation (optional)</label>
              <Textarea
                placeholder="Let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCancelDialog(null)}>
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Choose a new date and time for booking #{rescheduleDialog?.booking_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700">New Date</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={today}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">New Time</label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select a time...</option>
                {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((t) => (
                  <option key={t} value={t}>
                    {new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRescheduleDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={rescheduling || !newDate || !newTime}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {rescheduling ? "Rescheduling..." : "Confirm Reschedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
