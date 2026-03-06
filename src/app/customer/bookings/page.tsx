// @ts-nocheck
"use client";
import { useState, useMemo } from "react";
import {
  CalendarDays, Clock, MapPin, Search, XCircle, RefreshCw,
  AlertCircle, Star, RotateCcw, Eye, Home, DollarSign,
  Edit3, PauseCircle, Repeat, Plus, User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  draft: "bg-purple-50 text-purple-700 border-purple-200",
};
const statusLabels: Record<string, string> = {
  confirmed: "Confirmed", pending: "Pending", in_progress: "In Progress",
  completed: "Completed", cancelled: "Cancelled", draft: "Quote",
};
const TIME_SLOTS = [
  "08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"
];
type Booking = Record<string, unknown>;

async function getCustomerBookings() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { bookings: [], customerId: null, customer: null };
  const { data: customer } = await supabase
    .from("customers").select("*")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`).single();
  if (!customer) return { bookings: [], customerId: null, customer: null };
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, providers(id, first_name, last_name, avatar_url, rating)")
    .eq("customer_id", customer.id)
    .order("scheduled_date", { ascending: false });
  return { bookings: bookings || [], customerId: customer.id, customer };
}

function fmtTime(t: string) {
  try { return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}); }
  catch { return t; }
}
function fmtDate(d: string) {
  return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
}
function fmt$(n: number) { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n); }

export default function CustomerBookings() {
  const { data, loading, refetch } = useQuery(() => getCustomerBookings(), []);
  const bookings = (data?.bookings || []) as Booking[];
  const customerId = data?.customerId;

  const [filter, setFilter] = useState("upcoming");
  const [search, setSearch] = useState("");

  // Dialogs
  const [detailBooking, setDetailBooking] = useState<Booking|null>(null);
  const [cancelDialog, setCancelDialog] = useState<Booking|null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState<Booking|null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [postponeDialog, setPostponeDialog] = useState<Booking|null>(null);
  const [postponeDate, setPostponeDate] = useState("");
  const [postponeReason, setPostponeReason] = useState("");
  const [postponing, setPostponing] = useState(false);
  const [editDialog, setEditDialog] = useState<Booking|null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editPets, setEditPets] = useState(false);
  const [editPetDetails, setEditPetDetails] = useState("");
  const [editAccess, setEditAccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<Booking|null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = bookings;
    if (filter === "upcoming") list = list.filter((b) => (b.scheduled_date as string) >= today && !["cancelled","completed"].includes(b.status as string));
    else if (filter === "past") list = list.filter((b) => (b.scheduled_date as string) < today || b.status === "completed");
    else if (filter === "cancelled") list = list.filter((b) => b.status === "cancelled");
    else if (filter === "recurring") list = list.filter((b) => b.is_recurring_parent || b.recurring_parent_id);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => String(b.booking_number).includes(q) || (b.address_line1 as string)?.toLowerCase().includes(q) || (b.city as string)?.toLowerCase().includes(q));
    }
    return list;
  }, [bookings, filter, search, today]);

  const upcomingCount = bookings.filter((b) => (b.scheduled_date as string) >= today && !["cancelled","completed"].includes(b.status as string)).length;
  const nextBooking = bookings.find((b) => (b.scheduled_date as string) >= today && ["confirmed","pending"].includes(b.status as string));
  const canModify = (b: Booking) => ["confirmed","pending"].includes(b.status as string);
  const isCompleted = (b: Booking) => b.status === "completed";

  // ── API Handlers ──
  async function apiPatch(body: any, successMsg: string) {
    const res = await fetch("/api/bookings", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    toast.success(successMsg);
    refetch();
    return data;
  }

  const handleCancel = async () => {
    if (!cancelDialog) return;
    setCancelling(true);
    try {
      await apiPatch({ id: cancelDialog.id, action: "cancel", reason: cancelReason || "Cancelled by customer" }, "Booking cancelled");
      setCancelDialog(null); setCancelReason("");
    } catch (e: any) { toast.error(e.message); } finally { setCancelling(false); }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog || !newDate || !newTime) return;
    setRescheduling(true);
    try {
      await apiPatch({ id: rescheduleDialog.id, action: "reschedule", scheduledDate: newDate, scheduledTime: newTime }, "Booking rescheduled");
      setRescheduleDialog(null); setNewDate(""); setNewTime("");
    } catch (e: any) { toast.error(e.message); } finally { setRescheduling(false); }
  };

  const handlePostpone = async () => {
    if (!postponeDialog || !postponeDate) return;
    setPostponing(true);
    try {
      await apiPatch({ id: postponeDialog.id, action: "postpone", scheduledDate: postponeDate, reason: postponeReason || "Customer request" }, "Booking postponed");
      setPostponeDialog(null); setPostponeDate(""); setPostponeReason("");
    } catch (e: any) { toast.error(e.message); } finally { setPostponing(false); }
  };

  const handleEdit = async () => {
    if (!editDialog) return;
    setEditing(true);
    try {
      await apiPatch({ id: editDialog.id, action: "edit", customer_notes: editNotes, has_pets: editPets, pet_details: editPets ? editPetDetails : null, access_instructions: editAccess }, "Booking updated");
      setEditDialog(null);
    } catch (e: any) { toast.error(e.message); } finally { setEditing(false); }
  };

  const handleReview = async () => {
    if (!reviewDialog || !customerId) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ bookingId: reviewDialog.id, customerId, providerId: reviewDialog.provider_id || null, rating: reviewRating, comment: reviewComment, isPublic: true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(data.updated ? "Review updated!" : "Review submitted!");
      setReviewDialog(null); setReviewRating(5); setReviewComment("");
    } catch (e: any) { toast.error(e.message); } finally { setSubmittingReview(false); }
  };

  const openEdit = (b: Booking) => {
    setEditNotes((b.customer_notes as string) || "");
    setEditPets(!!b.has_pets);
    setEditPetDetails((b.pet_details as string) || "");
    setEditAccess((b.access_instructions as string) || "");
    setEditDialog(b);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">{upcomingCount} upcoming &middot; {bookings.length} total</p>
        </div>
        <Link href="/customer/book"><Button className="bg-teal-600 hover:bg-teal-700 text-white"><Plus className="w-4 h-4 mr-1" /> Book New Cleaning</Button></Link>
      </div>

      {/* Next Booking */}
      {nextBooking && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Next Cleaning</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{fmtDate(nextBooking.scheduled_date as string)} at {fmtTime(nextBooking.scheduled_time as string)}</p>
                <p className="text-sm text-slate-600 flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5" />{nextBooking.address_line1 as string}, {nextBooking.city as string}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailBooking(nextBooking)}><Eye className="w-4 h-4 mr-1" /> View</Button>
                <Button variant="outline" size="sm" onClick={() => setRescheduleDialog(nextBooking)}><RefreshCw className="w-4 h-4 mr-1" /> Reschedule</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 flex-wrap">
          {[{key:"upcoming",label:"Upcoming"},{key:"past",label:"Past"},{key:"recurring",label:"Recurring"},{key:"cancelled",label:"Cancelled"},{key:"all",label:"All"}].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{f.label}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search booking # or address..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {/* Booking List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bookings found</p>
          <p className="text-sm text-slate-400 mt-1">{filter === "upcoming" ? "No upcoming cleanings." : "No bookings match your filter."}</p>
          <Link href="/customer/book"><Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">Book a Cleaning</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Card key={booking.id as string} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">#HM-{booking.booking_number as number}</span>
                      <Badge variant="outline" className={statusColors[booking.status as string] || ""}>{statusLabels[booking.status as string] || booking.status}</Badge>
                      {booking.frequency && booking.frequency !== "one_time" && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200"><Repeat className="w-3 h-3 mr-1" />{(booking.frequency as string).replace("_"," ")}</Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-slate-400" />{fmtDate(booking.scheduled_date as string)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{fmtTime(booking.scheduled_time as string)}</span>
                      <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5 text-slate-400" />{booking.bedrooms as number}bd / {booking.bathrooms as number}ba</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-400" />{fmt$(Number(booking.total))}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.address_line1 as string}, {booking.city as string} {booking.zip_code as string}</p>
                    {(booking as any).providers && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> Cleaner:{" "}
                        <Link href={`/cleaner-profile/${(booking as any).providers.id}`} className="text-teal-600 hover:underline">
                          {(booking as any).providers.first_name} {((booking as any).providers.last_name || "").charAt(0)}.
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setDetailBooking(booking)}><Eye className="w-3.5 h-3.5 mr-1" /> View</Button>
                    {canModify(booking) && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openEdit(booking)}><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => setRescheduleDialog(booking)}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Reschedule</Button>
                        <Button variant="outline" size="sm" onClick={() => setPostponeDialog(booking)}><PauseCircle className="w-3.5 h-3.5 mr-1" /> Postpone</Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setCancelDialog(booking)}><XCircle className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                      </>
                    )}
                    {isCompleted(booking) && (
                      <>
                        <Button variant="outline" size="sm" className="text-amber-600" onClick={() => setReviewDialog(booking)}><Star className="w-3.5 h-3.5 mr-1" /> Review</Button>
                        <Link href={`/book?rebook=${booking.id}`}><Button variant="outline" size="sm" className="text-teal-600"><RotateCcw className="w-3.5 h-3.5 mr-1" /> Rebook</Button></Link>
                      </>
                    )}
                    {booking.status === "cancelled" && (
                      <Link href={`/book?rebook=${booking.id}`}><Button variant="outline" size="sm" className="text-teal-600"><RotateCcw className="w-3.5 h-3.5 mr-1" /> Rebook</Button></Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ DETAIL DIALOG ═══ */}
      <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Booking #{detailBooking?.booking_number as number}</DialogTitle></DialogHeader>
          {detailBooking && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={statusColors[detailBooking.status as string] || ""}>{statusLabels[detailBooking.status as string] || detailBooking.status}</Badge>
                {detailBooking.frequency && detailBooking.frequency !== "one_time" && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700"><Repeat className="w-3 h-3 mr-1" />{(detailBooking.frequency as string).replace("_"," ")}</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-400 text-xs">Date</p><p className="font-medium">{fmtDate(detailBooking.scheduled_date as string)}</p></div>
                <div><p className="text-slate-400 text-xs">Time</p><p className="font-medium">{fmtTime(detailBooking.scheduled_time as string)}</p></div>
                <div><p className="text-slate-400 text-xs">Home Size</p><p className="font-medium">{detailBooking.bedrooms as number}bd / {detailBooking.bathrooms as number}ba</p></div>
                <div><p className="text-slate-400 text-xs">Sq Ft</p><p className="font-medium">{detailBooking.sqft_range as string}</p></div>
                <div className="col-span-2"><p className="text-slate-400 text-xs">Address</p><p className="font-medium">{detailBooking.address_line1 as string}{detailBooking.address_line2 ? `, ${detailBooking.address_line2}` : ""}<br/>{detailBooking.city as string}, {detailBooking.state as string} {detailBooking.zip_code as string}</p></div>
              </div>
              {/* Pricing */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Base Price</span><span>{fmt$(Number(detailBooking.base_price))}</span></div>
                {Number(detailBooking.discount_amount) > 0 && <div className="flex justify-between text-emerald-600"><span>Discount ({Number(detailBooking.discount_percentage)}%)</span><span>-{fmt$(Number(detailBooking.discount_amount))}</span></div>}
                {Number(detailBooking.extras_total) > 0 && <div className="flex justify-between"><span className="text-slate-500">Extras</span><span>+{fmt$(Number(detailBooking.extras_total))}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{fmt$(Number(detailBooking.tax_amount))}</span></div>
                <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-1.5"><span>Total</span><span>{fmt$(Number(detailBooking.total))}</span></div>
              </div>
              {/* Assigned Cleaner */}
              {(detailBooking as any).providers && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold">{((detailBooking as any).providers.first_name || "?").charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{(detailBooking as any).providers.first_name} {((detailBooking as any).providers.last_name || "").charAt(0)}.</p>
                    <Link href={`/cleaner-profile/${(detailBooking as any).providers.id}`} className="text-xs text-teal-600 hover:underline">View Profile</Link>
                  </div>
                  {(detailBooking as any).providers.rating && <div className="ml-auto flex items-center gap-1 text-sm"><Star className="w-4 h-4 text-amber-500 fill-amber-500" />{Number((detailBooking as any).providers.rating).toFixed(1)}</div>}
                </div>
              )}
              {detailBooking.customer_notes && <div><p className="text-xs text-slate-400">Your Notes</p><p className="text-sm text-slate-700 mt-0.5">{detailBooking.customer_notes as string}</p></div>}
              {detailBooking.access_instructions && <div><p className="text-xs text-slate-400">Access Instructions</p><p className="text-sm text-slate-700 mt-0.5">{detailBooking.access_instructions as string}</p></div>}
              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {canModify(detailBooking) && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { setDetailBooking(null); openEdit(detailBooking); }}><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => { setDetailBooking(null); setRescheduleDialog(detailBooking); }}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Reschedule</Button>
                    <Button size="sm" variant="outline" onClick={() => { setDetailBooking(null); setPostponeDialog(detailBooking); }}><PauseCircle className="w-3.5 h-3.5 mr-1" /> Postpone</Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setDetailBooking(null); setCancelDialog(detailBooking); }}><XCircle className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                  </>
                )}
                {isCompleted(detailBooking) && (
                  <>
                    <Button size="sm" variant="outline" className="text-amber-600" onClick={() => { setDetailBooking(null); setReviewDialog(detailBooking); }}><Star className="w-3.5 h-3.5 mr-1" /> Review</Button>
                    <Link href={`/book?rebook=${detailBooking.id}`}><Button size="sm" variant="outline" className="text-teal-600"><RotateCcw className="w-3.5 h-3.5 mr-1" /> Rebook</Button></Link>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ CANCEL DIALOG ═══ */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cancel Booking</DialogTitle><DialogDescription>Cancel booking #{cancelDialog?.booking_number as number}?</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">Scheduled for {cancelDialog?.scheduled_date ? fmtDate(cancelDialog.scheduled_date as string) : ""} at {cancelDialog?.scheduled_time ? fmtTime(cancelDialog.scheduled_time as string) : ""}</div>
            <div><label className="text-sm font-medium text-slate-700">Reason (optional)</label><Textarea placeholder="Let us know why..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="mt-1" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelDialog(null)}>Keep Booking</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>{cancelling ? "Cancelling..." : "Cancel Booking"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ RESCHEDULE DIALOG ═══ */}
      <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reschedule Booking</DialogTitle><DialogDescription>Choose a new date and time for #{rescheduleDialog?.booking_number as number}.</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-slate-50 rounded-lg p-3 text-sm"><strong>Current:</strong> {rescheduleDialog?.scheduled_date ? fmtDate(rescheduleDialog.scheduled_date as string) : ""} at {rescheduleDialog?.scheduled_time ? fmtTime(rescheduleDialog.scheduled_time as string) : ""}</div>
            <div><label className="text-sm font-medium text-slate-700">New Date</label><Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} min={today} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-slate-700">New Time</label>
              <Select value={newTime} onValueChange={setNewTime}><SelectTrigger className="mt-1"><SelectValue placeholder="Select time" /></SelectTrigger><SelectContent>{TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{fmtTime(t)}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRescheduleDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleReschedule} disabled={rescheduling || !newDate || !newTime}>{rescheduling ? "Rescheduling..." : "Confirm Reschedule"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ POSTPONE DIALOG ═══ */}
      <Dialog open={!!postponeDialog} onOpenChange={() => setPostponeDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Postpone Booking</DialogTitle><DialogDescription>Push #{postponeDialog?.booking_number as number} to a later date.</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-slate-700">New Date</label><Input type="date" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} min={today} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-slate-700">Reason (optional)</label><Textarea placeholder="Why are you postponing?" value={postponeReason} onChange={(e) => setPostponeReason(e.target.value)} className="mt-1" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPostponeDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handlePostpone} disabled={postponing || !postponeDate}>{postponing ? "Postponing..." : "Confirm Postpone"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT DIALOG ═══ */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Booking</DialogTitle><DialogDescription>Update details for #{editDialog?.booking_number as number}.</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-slate-700">Special Instructions / Notes</label><Textarea placeholder="Any special requests..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-slate-700">Access Instructions</label><Textarea placeholder="How to access the property..." value={editAccess} onChange={(e) => setEditAccess(e.target.value)} className="mt-1" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="hasPets" checked={editPets} onChange={(e) => setEditPets(e.target.checked)} className="rounded border-slate-300" /><label htmlFor="hasPets" className="text-sm text-slate-700">We have pets</label></div>
            {editPets && <div><label className="text-sm font-medium text-slate-700">Pet Details</label><Input placeholder="Type and number of pets..." value={editPetDetails} onChange={(e) => setEditPetDetails(e.target.value)} className="mt-1" /></div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleEdit} disabled={editing}>{editing ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ REVIEW DIALOG ═══ */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Leave a Review</DialogTitle><DialogDescription>How was your cleaning experience?</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Rating</label>
              <div className="flex gap-1 mt-1">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)} className="p-0.5">
                    <Star className={`w-7 h-7 ${s <= reviewRating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div><label className="text-sm font-medium text-slate-700">Comment (optional)</label><Textarea placeholder="Tell us about your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mt-1" rows={3} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleReview} disabled={submittingReview}>{submittingReview ? "Submitting..." : "Submit Review"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
