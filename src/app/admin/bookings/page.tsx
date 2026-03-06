// @ts-nocheck
"use client";
import { useState, useMemo, useCallback } from "react";
import {
  CalendarDays, Clock, MapPin, Search, XCircle, RefreshCw,
  AlertCircle, Eye, ChevronDown, Home, DollarSign, Edit3,
  PauseCircle, Plus, User, UserPlus, Ban, CheckCircle2,
  FileText, Send, Percent, Filter, ArrowUpDown,
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
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import BookingCalendar, { CalendarBooking } from "@/components/BookingCalendar";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-purple-50 text-purple-700 border-purple-200",
  no_show: "bg-orange-50 text-orange-700 border-orange-200",
};
const statusLabels: Record<string, string> = {
  confirmed: "Confirmed", pending: "Pending", in_progress: "In Progress",
  completed: "Completed", cancelled: "Cancelled", draft: "Quote", no_show: "No Show",
};
const TIME_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
type Booking = Record<string, unknown>;

async function getAdminBookings() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, customers(id, first_name, last_name, email, phone), providers(id, first_name, last_name)")
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: true })
    .limit(200);
  const { data: providers } = await supabase
    .from("providers").select("id, first_name, last_name, status, payout_percentage")
    .eq("status", "active");
  const { data: customers } = await supabase
    .from("customers").select("id, first_name, last_name, email, phone, address_line1, city, state, zip_code")
    .order("last_name", { ascending: true }).limit(500);
  return { bookings: bookings || [], providers: providers || [], customers: customers || [] };
}

function fmtTime(t: string) { try { return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}); } catch { return t; } }
function fmtDate(d: string) { return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}); }
function fmt$(n: number) { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n); }

export default function AdminBookings() {
  const { data, loading, refetch } = useQuery(() => getAdminBookings(), []);
  const bookings = (data?.bookings || []) as Booking[];
  const providers = data?.providers || [];
  const customers = data?.customers || [];

  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Dialogs
  const [detailBooking, setDetailBooking] = useState<Booking|null>(null);
  const [cancelDialog, setCancelDialog] = useState<Booking|null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState<Booking|null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [postponeDialog, setPostponeDialog] = useState<Booking|null>(null);
  const [postponeDate, setPostponeDate] = useState("");
  const [postponeReason, setPostponeReason] = useState("");
  const [postponing, setPostponing] = useState(false);
  const [assignDialog, setAssignDialog] = useState<Booking|null>(null);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [discountDialog, setDiscountDialog] = useState<Booking|null>(null);
  const [discountPct, setDiscountPct] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [editDialog, setEditDialog] = useState<Booking|null>(null);
  const [editFields, setEditFields] = useState<Record<string,any>>({});
  const [editing, setEditing] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [createAsQuote, setCreateAsQuote] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = bookings;
    if (filter === "active") list = list.filter((b) => !["cancelled","completed","no_show"].includes(b.status as string));
    else if (filter === "today") list = list.filter((b) => (b.scheduled_date as string) === today);
    else if (filter === "upcoming") list = list.filter((b) => (b.scheduled_date as string) > today && !["cancelled","completed"].includes(b.status as string));
    else if (filter === "unassigned") list = list.filter((b) => !b.provider_id && !["cancelled","completed"].includes(b.status as string));
    else if (filter === "quotes") list = list.filter((b) => b.status === "draft");
    else if (filter !== "all") list = list.filter((b) => b.status === filter);
    if (dateFilter) list = list.filter((b) => (b.scheduled_date as string) === dateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        String(b.booking_number).includes(q) ||
        ((b as any).customers?.first_name || "").toLowerCase().includes(q) ||
        ((b as any).customers?.last_name || "").toLowerCase().includes(q) ||
        ((b as any).customers?.email || "").toLowerCase().includes(q) ||
        (b.address_line1 as string || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, filter, search, dateFilter, today]);

  // Stats
  const stats = useMemo(() => ({
    total: bookings.length,
    active: bookings.filter((b) => !["cancelled","completed","no_show"].includes(b.status as string)).length,
    today: bookings.filter((b) => (b.scheduled_date as string) === today).length,
    unassigned: bookings.filter((b) => !b.provider_id && !["cancelled","completed"].includes(b.status as string)).length,
    quotes: bookings.filter((b) => b.status === "draft").length,
  }), [bookings, today]);

  // ── API Helpers ──
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
      await apiPatch({ id: cancelDialog.id, action: "cancel", reason: cancelReason || "Cancelled by admin" }, "Booking cancelled");
      setCancelDialog(null); setCancelReason("");
    } catch (e: any) { toast.error(e.message); } finally { setCancelling(false); }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog || !newDate || !newTime) return;
    setRescheduling(true);
    try {
      await apiPatch({ id: rescheduleDialog.id, action: "reschedule", scheduledDate: newDate, scheduledTime: newTime, reason: rescheduleReason }, "Booking rescheduled");
      setRescheduleDialog(null); setNewDate(""); setNewTime(""); setRescheduleReason("");
    } catch (e: any) { toast.error(e.message); } finally { setRescheduling(false); }
  };

  const handlePostpone = async () => {
    if (!postponeDialog || !postponeDate) return;
    setPostponing(true);
    try {
      await apiPatch({ id: postponeDialog.id, action: "postpone", scheduledDate: postponeDate, reason: postponeReason || "Admin postponed" }, "Booking postponed");
      setPostponeDialog(null); setPostponeDate(""); setPostponeReason("");
    } catch (e: any) { toast.error(e.message); } finally { setPostponing(false); }
  };

  const handleAssign = async () => {
    if (!assignDialog || !selectedProvider) return;
    setAssigning(true);
    try {
      await apiPatch({ id: assignDialog.id, action: "assign", providerId: selectedProvider }, "Provider assigned");
      setAssignDialog(null); setSelectedProvider("");
    } catch (e: any) { toast.error(e.message); } finally { setAssigning(false); }
  };

  const handleDiscount = async () => {
    if (!discountDialog || !discountPct) return;
    setApplyingDiscount(true);
    try {
      await apiPatch({ id: discountDialog.id, action: "edit", applyDiscount: Number(discountPct) }, `${discountPct}% discount applied`);
      setDiscountDialog(null); setDiscountPct("");
    } catch (e: any) { toast.error(e.message); } finally { setApplyingDiscount(false); }
  };

  const handleEdit = async () => {
    if (!editDialog) return;
    setEditing(true);
    try {
      await apiPatch({ id: editDialog.id, action: "edit", ...editFields }, "Booking updated");
      setEditDialog(null); setEditFields({});
    } catch (e: any) { toast.error(e.message); } finally { setEditing(false); }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await apiPatch({ id: bookingId, action: "status", status: newStatus }, `Status changed to ${newStatus}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const openEdit = (b: Booking) => {
    setEditFields({
      scheduled_date: b.scheduled_date, scheduled_time: b.scheduled_time,
      admin_notes: b.admin_notes || "", customer_notes: b.customer_notes || "",
      access_instructions: b.access_instructions || "", has_pets: !!b.has_pets,
      pet_details: b.pet_details || "",
    });
    setEditDialog(b);
  };

  const validTransitions: Record<string, string[]> = {
    draft: ["pending","confirmed","cancelled"],
    pending: ["confirmed","cancelled"],
    confirmed: ["in_progress","cancelled","no_show"],
    in_progress: ["completed","cancelled"],
    completed: [], cancelled: [], no_show: [],
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
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">{stats.active} active &middot; {stats.today} today &middot; {stats.unassigned} unassigned</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setCreateAsQuote(true); setCreateDialog(true); }}><FileText className="w-4 h-4 mr-1" /> Create Quote</Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => { setCreateAsQuote(false); setCreateDialog(true); }}><Plus className="w-4 h-4 mr-1" /> New Booking</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Active", value: stats.active, color: "text-teal-600", key: "active" },
          { label: "Today", value: stats.today, color: "text-blue-600", key: "today" },
          { label: "Unassigned", value: stats.unassigned, color: "text-amber-600", key: "unassigned" },
          { label: "Quotes", value: stats.quotes, color: "text-purple-600", key: "quotes" },
          { label: "Total", value: stats.total, color: "text-slate-600", key: "all" },
        ].map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)} className={`p-3 rounded-lg border text-left transition-colors ${filter === s.key ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 flex-wrap">
          {[{key:"active",label:"Active"},{key:"today",label:"Today"},{key:"upcoming",label:"Upcoming"},{key:"unassigned",label:"Unassigned"},{key:"quotes",label:"Quotes"},{key:"completed",label:"Completed"},{key:"cancelled",label:"Cancelled"},{key:"all",label:"All"}].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{f.label}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search name, email, booking #..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-9 w-40" placeholder="Filter by date" />
          {dateFilter && <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}><XCircle className="w-4 h-4" /></Button>}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
        <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>List View</button>
        <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "calendar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Calendar View</button>
      </div>

      {viewMode === "calendar" ? (
        <BookingCalendar
          bookings={(filtered as any[]).map((b: any) => ({
            id: b.id,
            booking_number: b.booking_number,
            scheduled_date: b.scheduled_date,
            scheduled_time: b.scheduled_time || "09:00",
            estimated_duration: b.estimated_duration,
            status: b.status,
            bedrooms: b.bedrooms,
            bathrooms: b.bathrooms,
            address_line1: b.address_line1,
            city: b.city,
            frequency: b.frequency,
            total: Number(b.total),
            customer_name: b.customers ? `${b.customers.first_name} ${b.customers.last_name}` : undefined,
            provider_name: b.providers ? `${b.providers.first_name} ${b.providers.last_name}` : undefined,
          }))}
          role="admin"
          view="week"
          onReschedule={async (bookingId, newDate, newTime) => {
            await apiPatch({ id: bookingId, action: "reschedule", scheduledDate: newDate, scheduledTime: newTime }, "Booking rescheduled");
          }}
          onBookingClick={(booking) => {
            const found = bookings.find((b: any) => b.id === booking.id);
            if (found) setDetailBooking(found);
          }}
          loading={loading}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((booking) => {
            const cust = (booking as any).customers;
            const prov = (booking as any).providers;
            const transitions = validTransitions[booking.status as string] || [];
            return (
              <Card key={booking.id as string} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">#HM-{booking.booking_number as number}</span>
                        <Badge variant="outline" className={statusColors[booking.status as string] || ""}>{statusLabels[booking.status as string] || booking.status}</Badge>
                        {!booking.provider_id && booking.status !== "cancelled" && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Unassigned</Badge>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" />{cust ? `${cust.first_name} ${cust.last_name}` : "Unknown"}</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-slate-400" />{fmtDate(booking.scheduled_date as string)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{fmtTime(booking.scheduled_time as string)}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-400" />{fmt$(Number(booking.total))}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-400">
                        <span>{booking.address_line1 as string}, {booking.city as string}</span>
                        {prov && <span>Cleaner: {prov.first_name} {prov.last_name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setDetailBooking(booking)}><Eye className="w-3.5 h-3.5 mr-1" /> View</Button>
                      {!booking.provider_id && !["cancelled","completed"].includes(booking.status as string) && (
                        <Button variant="outline" size="sm" className="text-blue-600" onClick={() => { setAssignDialog(booking); setSelectedProvider(""); }}><UserPlus className="w-3.5 h-3.5 mr-1" /> Assign</Button>
                      )}
                      {!["cancelled","completed","no_show"].includes(booking.status as string) && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEdit(booking)}><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => setRescheduleDialog(booking)}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Reschedule</Button>
                          <Button variant="outline" size="sm" onClick={() => setPostponeDialog(booking)}><PauseCircle className="w-3.5 h-3.5 mr-1" /> Postpone</Button>
                          <Button variant="outline" size="sm" onClick={() => { setDiscountDialog(booking); setDiscountPct(""); }}><Percent className="w-3.5 h-3.5 mr-1" /> Discount</Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => setCancelDialog(booking)}><XCircle className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                        </>
                      )}
                      {/* Status transitions */}
                      {transitions.length > 0 && transitions.filter(t => t !== "cancelled").map((ns) => (
                        <Button key={ns} variant="outline" size="sm"
                          className={ns === "completed" ? "text-emerald-600" : ns === "in_progress" ? "text-blue-600" : ns === "confirmed" ? "text-teal-600" : "text-orange-600"}
                          onClick={() => handleStatusChange(booking.id as string, ns)}>
                          {ns === "completed" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                          {ns.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ DETAIL DIALOG ═══ */}
      <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Booking #{detailBooking?.booking_number as number}</DialogTitle></DialogHeader>
          {detailBooking && (() => {
            const cust = (detailBooking as any).customers;
            const prov = (detailBooking as any).providers;
            return (
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={statusColors[detailBooking.status as string] || ""}>{statusLabels[detailBooking.status as string] || detailBooking.status}</Badge>
                  {detailBooking.frequency && detailBooking.frequency !== "one_time" && <Badge variant="outline" className="bg-indigo-50 text-indigo-700">{(detailBooking.frequency as string).replace("_"," ")}</Badge>}
                </div>
                {/* Customer */}
                {cust && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Customer</p>
                    <p className="font-medium text-sm">{cust.first_name} {cust.last_name}</p>
                    <p className="text-xs text-slate-500">{cust.email} &middot; {cust.phone}</p>
                  </div>
                )}
                {/* Schedule & Property */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-400 text-xs">Date</p><p className="font-medium">{fmtDate(detailBooking.scheduled_date as string)}</p></div>
                  <div><p className="text-slate-400 text-xs">Time</p><p className="font-medium">{fmtTime(detailBooking.scheduled_time as string)}</p></div>
                  <div><p className="text-slate-400 text-xs">Home Size</p><p className="font-medium">{detailBooking.bedrooms as number}bd / {detailBooking.bathrooms as number}ba</p></div>
                  <div><p className="text-slate-400 text-xs">Duration</p><p className="font-medium">{detailBooking.estimated_duration as number} min</p></div>
                  <div className="col-span-2"><p className="text-slate-400 text-xs">Address</p><p className="font-medium">{detailBooking.address_line1 as string}{detailBooking.address_line2 ? `, ${detailBooking.address_line2}` : ""}<br/>{detailBooking.city as string}, {detailBooking.state as string} {detailBooking.zip_code as string}</p></div>
                </div>
                {/* Provider */}
                {prov && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Assigned Cleaner</p>
                    <p className="font-medium text-sm">{prov.first_name} {prov.last_name}</p>
                  </div>
                )}
                {/* Pricing */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Base Price</span><span>{fmt$(Number(detailBooking.base_price))}</span></div>
                  {Number(detailBooking.discount_amount) > 0 && <div className="flex justify-between text-emerald-600"><span>Discount ({Number(detailBooking.discount_percentage)}%)</span><span>-{fmt$(Number(detailBooking.discount_amount))}</span></div>}
                  {Number(detailBooking.extras_total) > 0 && <div className="flex justify-between"><span className="text-slate-500">Extras</span><span>+{fmt$(Number(detailBooking.extras_total))}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{fmt$(Number(detailBooking.tax_amount))}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1.5"><span>Total</span><span>{fmt$(Number(detailBooking.total))}</span></div>
                  <div className="flex justify-between text-xs text-slate-400"><span>Provider Payout ({Number(detailBooking.provider_payout_percentage)}%)</span><span>{fmt$(Number(detailBooking.provider_payout_amount))}</span></div>
                </div>
                {/* Notes */}
                {detailBooking.customer_notes && <div><p className="text-xs text-slate-400">Customer Notes</p><p className="text-sm text-slate-700 mt-0.5">{detailBooking.customer_notes as string}</p></div>}
                {detailBooking.admin_notes && <div><p className="text-xs text-slate-400">Admin Notes</p><p className="text-sm text-slate-700 mt-0.5">{detailBooking.admin_notes as string}</p></div>}
                {detailBooking.access_instructions && <div><p className="text-xs text-slate-400">Access Instructions</p><p className="text-sm text-slate-700 mt-0.5">{detailBooking.access_instructions as string}</p></div>}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══ CANCEL DIALOG ═══ */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cancel Booking</DialogTitle><DialogDescription>Cancel #{cancelDialog?.booking_number as number}?</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-slate-700">Reason</label><Textarea placeholder="Reason for cancellation..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="mt-1" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelDialog(null)}>Keep</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>{cancelling ? "Cancelling..." : "Cancel Booking"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ RESCHEDULE DIALOG ═══ */}
      <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reschedule Booking</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-slate-50 rounded-lg p-3 text-sm"><strong>Current:</strong> {rescheduleDialog?.scheduled_date ? fmtDate(rescheduleDialog.scheduled_date as string) : ""} at {rescheduleDialog?.scheduled_time ? fmtTime(rescheduleDialog.scheduled_time as string) : ""}</div>
            <div><label className="text-sm font-medium text-slate-700">New Date</label><Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-slate-700">New Time</label>
              <Select value={newTime} onValueChange={setNewTime}><SelectTrigger className="mt-1"><SelectValue placeholder="Select time" /></SelectTrigger><SelectContent>{TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{fmtTime(t)}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><label className="text-sm font-medium text-slate-700">Reason</label><Textarea placeholder="Reason for rescheduling..." value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} className="mt-1" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRescheduleDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleReschedule} disabled={rescheduling || !newDate || !newTime}>{rescheduling ? "Rescheduling..." : "Confirm"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ POSTPONE DIALOG ═══ */}
      <Dialog open={!!postponeDialog} onOpenChange={() => setPostponeDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Postpone Booking</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-slate-700">New Date</label><Input type="date" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-slate-700">Reason</label><Textarea placeholder="Reason for postponement..." value={postponeReason} onChange={(e) => setPostponeReason(e.target.value)} className="mt-1" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPostponeDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handlePostpone} disabled={postponing || !postponeDate}>{postponing ? "Postponing..." : "Confirm"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ ASSIGN DIALOG ═══ */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Cleaner</DialogTitle><DialogDescription>Assign a cleaner to #{assignDialog?.booking_number as number} on {assignDialog?.scheduled_date ? fmtDate(assignDialog.scheduled_date as string) : ""} at {assignDialog?.scheduled_time ? fmtTime(assignDialog.scheduled_time as string) : ""}.</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-2">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger><SelectValue placeholder="Select a cleaner" /></SelectTrigger>
              <SelectContent>
                {providers.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleAssign} disabled={assigning || !selectedProvider}>{assigning ? "Assigning..." : "Assign"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ DISCOUNT DIALOG ═══ */}
      <Dialog open={!!discountDialog} onOpenChange={() => setDiscountDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Apply Discount</DialogTitle><DialogDescription>Apply a discount to #{discountDialog?.booking_number as number}. Current total: {fmt$(Number(discountDialog?.total || 0))}</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Discount Percentage</label>
              <div className="flex gap-2 mt-1">
                <Input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} placeholder="e.g. 10" className="flex-1" />
                <span className="flex items-center text-slate-500">%</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[5,10,15,20,25].map((p) => (
                  <button key={p} onClick={() => setDiscountPct(String(p))} className={`px-3 py-1 text-xs rounded-full border transition-colors ${discountPct === String(p) ? "bg-teal-50 border-teal-300 text-teal-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>{p}%</button>
                ))}
              </div>
            </div>
            {discountPct && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p>New total: <strong>{fmt$(Number(discountDialog?.base_price || 0) * (1 - Number(discountPct)/100) + Number(discountDialog?.extras_total || 0))}</strong> (before tax)</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDiscountDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleDiscount} disabled={applyingDiscount || !discountPct}>{applyingDiscount ? "Applying..." : "Apply Discount"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT DIALOG ═══ */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Booking #{editDialog?.booking_number as number}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-slate-700">Date</label><Input type="date" value={editFields.scheduled_date || ""} onChange={(e) => setEditFields({...editFields, scheduled_date: e.target.value})} className="mt-1" /></div>
              <div><label className="text-sm font-medium text-slate-700">Time</label>
                <Select value={editFields.scheduled_time || ""} onValueChange={(v) => setEditFields({...editFields, scheduled_time: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{fmtTime(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium text-slate-700">Admin Notes</label><Textarea value={editFields.admin_notes || ""} onChange={(e) => setEditFields({...editFields, admin_notes: e.target.value})} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-slate-700">Customer Notes</label><Textarea value={editFields.customer_notes || ""} onChange={(e) => setEditFields({...editFields, customer_notes: e.target.value})} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-slate-700">Access Instructions</label><Textarea value={editFields.access_instructions || ""} onChange={(e) => setEditFields({...editFields, access_instructions: e.target.value})} className="mt-1" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={!!editFields.has_pets} onChange={(e) => setEditFields({...editFields, has_pets: e.target.checked})} className="rounded border-slate-300" /><label className="text-sm text-slate-700">Has Pets</label></div>
            {editFields.has_pets && <div><label className="text-sm font-medium text-slate-700">Pet Details</label><Input value={editFields.pet_details || ""} onChange={(e) => setEditFields({...editFields, pet_details: e.target.value})} className="mt-1" /></div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleEdit} disabled={editing}>{editing ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE BOOKING / QUOTE DIALOG ═══ */}
      <CreateBookingDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        isQuote={createAsQuote}
        customers={customers}
        onSuccess={refetch}
      />
    </div>
  );
}

/* ─── Create Booking / Quote Dialog (separate component) ─── */
function CreateBookingDialog({ open, onClose, isQuote, customers, onSuccess }: {
  open: boolean; onClose: () => void; isQuote: boolean; customers: any[]; onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [customerMode, setCustomerMode] = useState<"existing"|"new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [custSearch, setCustSearch] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    addressLine1: "", addressLine2: "", city: "", state: "TX", zipCode: "",
    bedrooms: 3, bathrooms: 2, sqftRange: "1000-1500",
    frequency: "one_time", scheduledDate: "", scheduledTime: "",
    customerNotes: "", adminNotes: "", hasPets: false, petDetails: "",
    accessInstructions: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredCustomers = custSearch.trim()
    ? customers.filter((c) => `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(custSearch.toLowerCase())).slice(0, 10)
    : customers.slice(0, 10);

  const selectExistingCustomer = (c: any) => {
    setSelectedCustomerId(c.id);
    setForm({
      ...form,
      firstName: c.first_name, lastName: c.last_name, email: c.email, phone: c.phone || "",
      addressLine1: c.address_line1 || "", city: c.city || "", state: c.state || "TX", zipCode: c.zip_code || "",
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ ...form, isQuote, createdBy: "admin", selectedExtras: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");
      toast.success(isQuote ? "Quote created!" : "Booking created!");
      onClose();
      onSuccess();
      setStep(1);
      setForm({ firstName:"",lastName:"",email:"",phone:"",addressLine1:"",addressLine2:"",city:"",state:"TX",zipCode:"",bedrooms:3,bathrooms:2,sqftRange:"1000-1500",frequency:"one_time",scheduledDate:"",scheduledTime:"",customerNotes:"",adminNotes:"",hasPets:false,petDetails:"",accessInstructions:"" });
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isQuote ? "Create Quote" : "Create Booking"}</DialogTitle>
          <DialogDescription>Step {step} of 3</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div className="flex gap-2">
              <Button variant={customerMode === "existing" ? "default" : "outline"} size="sm" onClick={() => setCustomerMode("existing")} className={customerMode === "existing" ? "bg-teal-600" : ""}>Existing Customer</Button>
              <Button variant={customerMode === "new" ? "default" : "outline"} size="sm" onClick={() => setCustomerMode("new")} className={customerMode === "new" ? "bg-teal-600" : ""}>New Customer</Button>
            </div>
            {customerMode === "existing" ? (
              <div className="space-y-3">
                <Input placeholder="Search customers..." value={custSearch} onChange={(e) => setCustSearch(e.target.value)} />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredCustomers.map((c: any) => (
                    <button key={c.id} onClick={() => selectExistingCustomer(c)} className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${selectedCustomerId === c.id ? "bg-teal-50 border border-teal-200" : "hover:bg-slate-50 border border-transparent"}`}>
                      <p className="font-medium">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-slate-500">{c.email} &middot; {c.phone}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-slate-600">First Name</label><Input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-medium text-slate-600">Last Name</label><Input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-medium text-slate-600">Email</label><Input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-medium text-slate-600">Phone</label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="mt-1" /></div>
              </div>
            )}
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setStep(2)} disabled={!form.firstName && !selectedCustomerId}>Next: Property Details</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-2">
            <div><label className="text-xs font-medium text-slate-600">Address</label><Input value={form.addressLine1} onChange={(e) => setForm({...form, addressLine1: e.target.value})} placeholder="Street address" className="mt-1" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-600">City</label><Input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-slate-600">State</label><Input value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-slate-600">Zip</label><Input value={form.zipCode} onChange={(e) => setForm({...form, zipCode: e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-600">Bedrooms</label>
                <Select value={String(form.bedrooms)} onValueChange={(v) => setForm({...form, bedrooms: Number(v)})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Bathrooms</label>
                <Select value={String(form.bathrooms)} onValueChange={(v) => setForm({...form, bathrooms: Number(v)})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Sq Ft</label>
                <Select value={form.sqftRange} onValueChange={(v) => setForm({...form, sqftRange: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["500-1000","1000-1500","1500-2000","2000-2500","2500-3000","3000-3500","3500-4000"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div><label className="text-xs font-medium text-slate-600">Frequency</label>
              <Select value={form.frequency} onValueChange={(v) => setForm({...form, frequency: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">One-Time</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Biweekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setStep(3)} disabled={!form.addressLine1 || !form.zipCode}>Next: Schedule</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-600">Date</label><Input type="date" value={form.scheduledDate} onChange={(e) => setForm({...form, scheduledDate: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-slate-600">Time</label>
                <Select value={form.scheduledTime} onValueChange={(v) => setForm({...form, scheduledTime: v})}><SelectTrigger className="mt-1"><SelectValue placeholder="Select time" /></SelectTrigger><SelectContent>{["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"].map(t => <SelectItem key={t} value={t}>{new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div><label className="text-xs font-medium text-slate-600">Customer Notes</label><Textarea value={form.customerNotes} onChange={(e) => setForm({...form, customerNotes: e.target.value})} placeholder="Special requests..." className="mt-1" /></div>
            <div><label className="text-xs font-medium text-slate-600">Admin Notes</label><Textarea value={form.adminNotes} onChange={(e) => setForm({...form, adminNotes: e.target.value})} placeholder="Internal notes..." className="mt-1" /></div>
            <div><label className="text-xs font-medium text-slate-600">Access Instructions</label><Textarea value={form.accessInstructions} onChange={(e) => setForm({...form, accessInstructions: e.target.value})} placeholder="Lockbox, key, etc..." className="mt-1" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.hasPets} onChange={(e) => setForm({...form, hasPets: e.target.checked})} className="rounded border-slate-300" /><label className="text-sm text-slate-700">Has Pets</label></div>
            {form.hasPets && <Input value={form.petDetails} onChange={(e) => setForm({...form, petDetails: e.target.value})} placeholder="Pet details..." />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSubmit} disabled={submitting || !form.scheduledDate || !form.scheduledTime}>
                {submitting ? "Creating..." : isQuote ? "Create Quote" : "Create Booking"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
