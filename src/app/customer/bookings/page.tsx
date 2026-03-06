// @ts-nocheck
"use client";
import { useState } from "react";
import {
  CalendarDays, Clock, MapPin, Search, XCircle, RefreshCw,
  AlertCircle, Sparkles, Star, RotateCcw, Eye, ChevronRight,
  Home, DollarSign, FileText, ArrowRight, Copy
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
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
  if (!user) return { bookings: [], customerId: null };

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!customer) return { bookings: [], customerId: null };

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", customer.id)
    .order("scheduled_date", { ascending: false });

  return { bookings: bookings || [], customerId: customer.id };
}

function formatTime(time: string) {
  try {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    });
  } catch { return time; }
}

function formatDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export default function CustomerBookings() {
  const { data, loading, refetch } = useQuery(() => getCustomerBookings(), []);
  const bookings = data?.bookings || [];
  const customerId = data?.customerId;

  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [cancelDialog, setCancelDialog] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Filtering
  const filtered = bookings.filter((b: Booking) => {
    if (filter === "upcoming") return (b.scheduled_date as string) >= today && !["cancelled", "completed"].includes(b.status as string);
    if (filter === "past") return (b.scheduled_date as string) < today || b.status === "completed";
    if (filter !== "all" && b.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        String(b.booking_number).includes(q) ||
        String(b.address_line1 || "").toLowerCase().includes(q) ||
        String(b.city || "").toLowerCase().includes(q) ||
        String(b.frequency || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const upcomingCount = bookings.filter(
    (b: Booking) => (b.scheduled_date as string) >= today && !["cancelled", "completed"].includes(b.status as string)
  ).length;
  const completedCount = bookings.filter((b: Booking) => b.status === "completed").length;

  const canModify = (b: Booking) =>
    ["confirmed", "pending"].includes(b.status as string) && (b.scheduled_date as string) >= today;

  const isCompleted = (b: Booking) => b.status === "completed";
  const isCancelled = (b: Booking) => b.status === "cancelled";

  // Handlers
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

  const handleReview = async () => {
    if (!reviewDialog || !customerId) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: reviewDialog.id,
          customerId,
          providerId: reviewDialog.provider_id || null,
          rating: reviewRating,
          comment: reviewComment,
          isPublic: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      toast.success(data.updated ? "Review updated!" : "Review submitted! Thank you!");
      setReviewDialog(null);
      setReviewRating(5);
      setReviewComment("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 mt-1">
            {upcomingCount} upcoming &middot; {completedCount} completed &middot; {bookings.length} total
          </p>
        </div>
        <Link href="/book">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Sparkles className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by booking #, address, city..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "upcoming", label: "Upcoming" },
            { key: "past", label: "Past" },
            { key: "confirmed", label: "Confirmed" },
            { key: "pending", label: "Pending" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map((s) => (
            <Button
              key={s.key}
              variant={filter === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s.key)}
              className={filter === s.key ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {s.label}
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
                  <div className="flex items-start gap-4 flex-1 min-w-0">
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

                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {booking.scheduled_time ? formatTime(booking.scheduled_time as string) : "TBD"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {booking.address_line1}, {booking.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Home className="w-3.5 h-3.5" />
                          {booking.bedrooms}bd / {booking.bathrooms}ba
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                        <span>{booking.sqft_range} sqft</span>
                        <span className="font-semibold text-slate-700 text-sm">
                          ${(booking.total as number)?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailBooking(booking)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Details
                    </Button>

                    {canModify(booking) && (
                      <>
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
                      </>
                    )}

                    {isCompleted(booking) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewDialog(booking)}
                          className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                          <Star className="w-3.5 h-3.5 mr-1" />
                          Review
                        </Button>
                        <Link href={`/book?rebook=${booking.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-teal-600 border-teal-200 hover:bg-teal-50 w-full"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Rebook
                          </Button>
                        </Link>
                      </>
                    )}

                    {isCancelled(booking) && (
                      <Link href={`/book?rebook=${booking.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-teal-600 border-teal-200 hover:bg-teal-50 w-full"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Rebook
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Booking Detail Dialog ─── */}
      <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Booking #{detailBooking?.booking_number}
              <Badge variant="outline" className={statusColors[detailBooking?.status as string] || ""}>
                {statusLabels[detailBooking?.status as string] || (detailBooking?.status as string)}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {detailBooking && (
            <div className="space-y-5 mt-2">
              {/* Date & Time */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-teal-600 text-white flex flex-col items-center justify-center">
                  <span className="text-[9px] font-medium leading-none">
                    {new Date((detailBooking.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                  </span>
                  <span className="text-lg font-bold leading-none mt-0.5">
                    {new Date((detailBooking.scheduled_date as string) + "T12:00:00").getDate()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{formatDate(detailBooking.scheduled_date as string)}</p>
                  <p className="text-sm text-slate-500">
                    {detailBooking.scheduled_time ? formatTime(detailBooking.scheduled_time as string) : "Time TBD"}
                    {detailBooking.estimated_duration ? ` · ${detailBooking.estimated_duration} hours` : ""}
                  </p>
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Home Details</p>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" />
                    {detailBooking.bedrooms}bd / {detailBooking.bathrooms}ba
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{detailBooking.sqft_range} sqft</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Frequency</p>
                  <p className="text-sm font-medium text-slate-700 capitalize">{detailBooking.frequency}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-1">Address</p>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {detailBooking.address_line1}
                    {detailBooking.address_line2 ? `, ${detailBooking.address_line2}` : ""}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {detailBooking.city}, {detailBooking.state || "TX"} {detailBooking.zip_code}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400 mb-2">Pricing Breakdown</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Price</span>
                    <span className="text-slate-700">${(detailBooking.base_price as number)?.toFixed(2) || "—"}</span>
                  </div>
                  {(detailBooking.discount_amount as number) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Frequency Discount</span>
                      <span>-${(detailBooking.discount_amount as number)?.toFixed(2)}</span>
                    </div>
                  )}
                  {(detailBooking.extras_amount as number) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Extras</span>
                      <span className="text-slate-700">${(detailBooking.extras_amount as number)?.toFixed(2)}</span>
                    </div>
                  )}
                  {(detailBooking.tax_amount as number) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tax</span>
                      <span className="text-slate-700">${(detailBooking.tax_amount as number)?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t border-slate-100 pt-2">
                    <span className="text-slate-900">Total</span>
                    <span className="text-teal-700">${(detailBooking.total as number)?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {detailBooking.customer_notes && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400 mb-1">Your Notes</p>
                  <p className="text-sm text-slate-600">{detailBooking.customer_notes as string}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {canModify(detailBooking) && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setDetailBooking(null);
                        setRescheduleDialog(detailBooking);
                        setNewDate(detailBooking.scheduled_date as string);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Reschedule
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDetailBooking(null);
                        setCancelDialog(detailBooking);
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {isCompleted(detailBooking) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setDetailBooking(null);
                      setReviewDialog(detailBooking);
                    }}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Star className="w-3.5 h-3.5 mr-1" />
                    Leave Review
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/invoices?bookingId=${detailBooking.id}`, "_blank")}
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Cancel Dialog ─── */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel booking #{cancelDialog?.booking_number}?
              {(cancelDialog?.scheduled_date as string) && (
                <span className="block mt-1 font-medium">
                  Scheduled for {formatDate(cancelDialog?.scheduled_date as string)} at{" "}
                  {cancelDialog?.scheduled_time ? formatTime(cancelDialog?.scheduled_time as string) : "TBD"}
                </span>
              )}
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
                rows={3}
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>Note:</strong> Cancellations within 24 hours of the scheduled service may incur a fee.
              Consider rescheduling instead.
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCancelDialog(null)}>
                Keep Booking
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cancelling...
                  </span>
                ) : "Cancel Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reschedule Dialog ─── */}
      <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <RefreshCw className="w-5 h-5" />
              Reschedule Booking
            </DialogTitle>
            <DialogDescription>
              Choose a new date and time for booking #{rescheduleDialog?.booking_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              <strong>Current:</strong> {rescheduleDialog?.scheduled_date ? formatDate(rescheduleDialog.scheduled_date as string) : ""}{" "}
              at {rescheduleDialog?.scheduled_time ? formatTime(rescheduleDialog.scheduled_time as string) : "TBD"}
            </div>
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
                  <option key={t} value={t}>{formatTime(t)}</option>
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
                {rescheduling ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Rescheduling...
                  </span>
                ) : "Confirm Reschedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Review Dialog ─── */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Star className="w-5 h-5" />
              Leave a Review
            </DialogTitle>
            <DialogDescription>
              How was your cleaning on {reviewDialog?.scheduled_date ? formatDate(reviewDialog.scheduled_date as string) : ""}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Star Rating */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {reviewRating === 5 ? "Excellent!" : reviewRating === 4 ? "Great!" : reviewRating === 3 ? "Good" : reviewRating === 2 ? "Fair" : "Poor"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Your Review (optional)</label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mt-1.5"
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setReviewDialog(null)}>
                Skip
              </Button>
              <Button
                onClick={handleReview}
                disabled={submittingReview}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {submittingReview ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
