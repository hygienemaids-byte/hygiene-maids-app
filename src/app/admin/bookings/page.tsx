// @ts-nocheck
"use client";

import { useState, useCallback } from "react";
import {
  CalendarDays, Plus, Search, MoreHorizontal, Eye, Edit2, Trash2,
  MapPin, Clock, User, X, CheckCircle2, Play, Ban, ArrowRight,
  Phone, Mail, Home, DollarSign, FileText, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery } from "@/hooks/use-query";
import { getBookings, getProviders } from "@/lib/queries";
import { ListSkeleton } from "@/components/loading-skeleton";
import Link from "next/link";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-50 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-gray-50 text-gray-500 border-gray-200",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  in_progress: "In Progress",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  draft: "Draft",
};

const frequencyLabels: Record<string, string> = {
  one_time: "One-Time",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// Valid status transitions
const nextStatuses: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Record<string, any> | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignBookingId, setAssignBookingId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const { data: bookings, loading, refetch } = useQuery(
    () => getBookings({ status: statusFilter }),
    [statusFilter]
  );

  const { data: providers } = useQuery(() => getProviders(), []);

  const filteredBookings = (bookings || []).filter((b: Record<string, any>) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    const customerName = `${b.customer?.first_name || ""} ${b.customer?.last_name || ""}`;
    return (
      customerName.toLowerCase().includes(s) ||
      String(b.booking_number).includes(s) ||
      (b.city || "").toLowerCase().includes(s) ||
      (b.address_line1 || "").toLowerCase().includes(s)
    );
  });

  const handleViewDetails = (booking: Record<string, any>) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "status", status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast.success(`Booking status updated to ${statusLabels[newStatus] || newStatus}`);
      refetch();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: cancelBookingId, action: "cancel" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel");
      }
      toast.success("Booking cancelled successfully");
      setCancelDialogOpen(false);
      setCancelBookingId(null);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const handleAssignProvider = async () => {
    if (!assignBookingId || !selectedProviderId) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: assignBookingId, action: "assign", providerId: selectedProviderId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to assign");
      }
      toast.success("Provider assigned successfully");
      setAssignDialogOpen(false);
      setAssignBookingId(null);
      setSelectedProviderId("");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to assign provider");
    } finally {
      setAssigning(false);
    }
  };

  // Stats
  const allBookings = bookings || [];
  const pendingCount = allBookings.filter((b: any) => b.status === "pending").length;
  const confirmedCount = allBookings.filter((b: any) => b.status === "confirmed").length;
  const inProgressCount = allBookings.filter((b: any) => b.status === "in_progress").length;
  const totalRevenue = allBookings
    .filter((b: any) => b.status !== "cancelled")
    .reduce((s: number, b: any) => s + (Number(b.total) || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading bookings..." : `${filteredBookings.length} bookings found`}
          </p>
        </div>
        <Link href="/book">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Confirmed</p>
            <p className="text-xl font-bold text-emerald-600">{confirmedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-xl font-bold text-blue-600">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, booking #, or address..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {loading ? (
        <ListSkeleton rows={6} />
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No bookings found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking: Record<string, any>) => {
            const validNext = nextStatuses[booking.status] || [];
            return (
              <Card key={booking.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Date/Time block */}
                    <div className="hidden sm:flex flex-col items-center justify-center w-20 shrink-0 py-2 px-3 rounded-xl bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">
                        {formatDate(booking.scheduled_date).split(",")[0]}
                      </p>
                      <p className="text-lg font-bold leading-tight">
                        {new Date(booking.scheduled_date + "T00:00:00").getDate()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(booking.scheduled_time)}
                      </p>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">#{booking.booking_number}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[booking.status]}`}>
                          {statusLabels[booking.status] || booking.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {frequencyLabels[booking.frequency] || booking.frequency}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold truncate">
                        {booking.customer?.first_name} {booking.customer?.last_name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {booking.address_line1}, {booking.city}, TX {booking.zip_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground sm:hidden">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(booking.scheduled_date)}, {formatTime(booking.scheduled_time)}
                        </span>
                      </div>
                    </div>

                    {/* Provider */}
                    <div className="hidden md:block text-right shrink-0">
                      <div className="flex items-center gap-1.5 justify-end">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs font-medium ${!booking.provider ? "text-amber-600" : "text-foreground"}`}>
                          {booking.provider
                            ? `${booking.provider.first_name} ${booking.provider.last_name}`
                            : "Unassigned"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {booking.bedrooms}BR / {booking.bathrooms}BA
                      </p>
                      {!booking.provider && booking.status !== "cancelled" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-teal-600 hover:text-teal-700 px-1 mt-0.5"
                          onClick={() => {
                            setAssignBookingId(booking.id);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <UserPlus className="w-3 h-3 mr-0.5" /> Assign
                        </Button>
                      )}
                    </div>

                    {/* Total */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">${Number(booking.total).toFixed(2)}</p>
                    </div>

                    {/* Quick Status Actions */}
                    {validNext.length > 0 && (
                      <div className="hidden lg:flex gap-1 shrink-0">
                        {validNext.map((ns) => (
                          <Button
                            key={ns}
                            variant="outline"
                            size="sm"
                            className={`h-7 text-[10px] px-2 ${
                              ns === "confirmed" ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50" :
                              ns === "in_progress" ? "text-blue-600 border-blue-200 hover:bg-blue-50" :
                              ns === "completed" ? "text-slate-600 border-slate-200 hover:bg-slate-50" :
                              ns === "cancelled" ? "text-red-600 border-red-200 hover:bg-red-50" : ""
                            }`}
                            disabled={updatingStatus === booking.id}
                            onClick={() => {
                              if (ns === "cancelled") {
                                setCancelBookingId(booking.id);
                                setCancelDialogOpen(true);
                              } else {
                                handleStatusChange(booking.id, ns);
                              }
                            }}
                          >
                            {ns === "confirmed" && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                            {ns === "in_progress" && <Play className="w-3 h-3 mr-0.5" />}
                            {ns === "completed" && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                            {ns === "cancelled" && <Ban className="w-3 h-3 mr-0.5" />}
                            {statusLabels[ns]}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {!booking.provider && booking.status !== "cancelled" && (
                          <DropdownMenuItem onClick={() => {
                            setAssignBookingId(booking.id);
                            setAssignDialogOpen(true);
                          }}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Provider
                          </DropdownMenuItem>
                        )}
                        {/* Status transitions for mobile */}
                        {validNext.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            {validNext.map((ns) => (
                              <DropdownMenuItem
                                key={ns}
                                onClick={() => {
                                  if (ns === "cancelled") {
                                    setCancelBookingId(booking.id);
                                    setCancelDialogOpen(true);
                                  } else {
                                    handleStatusChange(booking.id, ns);
                                  }
                                }}
                                className={ns === "cancelled" ? "text-destructive" : ""}
                              >
                                {ns === "confirmed" && <CheckCircle2 className="w-4 h-4 mr-2" />}
                                {ns === "in_progress" && <Play className="w-4 h-4 mr-2" />}
                                {ns === "completed" && <CheckCircle2 className="w-4 h-4 mr-2" />}
                                {ns === "cancelled" && <Ban className="w-4 h-4 mr-2" />}
                                Mark as {statusLabels[ns]}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== BOOKING DETAILS SHEET ===== */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Booking #{selectedBooking?.booking_number}
              {selectedBooking && (
                <Badge variant="outline" className={statusColors[selectedBooking.status]}>
                  {statusLabels[selectedBooking.status]}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          {selectedBooking && (
            <div className="mt-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" /> Customer
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}</p>
                  {selectedBooking.customer?.email && (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5" /> {selectedBooking.customer.email}
                    </p>
                  )}
                  {selectedBooking.customer?.phone && (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5" /> {selectedBooking.customer.phone}
                    </p>
                  )}
                </div>
              </div>
              <Separator />

              {/* Service Details */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4 text-teal-600" /> Service Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="font-medium">{formatDate(selectedBooking.scheduled_date)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Time</p>
                    <p className="font-medium">{formatTime(selectedBooking.scheduled_time)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Frequency</p>
                    <p className="font-medium">{frequencyLabels[selectedBooking.frequency] || selectedBooking.frequency}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Home Size</p>
                    <p className="font-medium">{selectedBooking.bedrooms}BR / {selectedBooking.bathrooms}BA</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Address</p>
                    <p className="font-medium">
                      {selectedBooking.address_line1}
                      {selectedBooking.address_line2 && `, ${selectedBooking.address_line2}`}
                      <br />
                      {selectedBooking.city}, {selectedBooking.state || "TX"} {selectedBooking.zip_code}
                    </p>
                  </div>
                </div>
              </div>
              <Separator />

              {/* Provider */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-teal-600" /> Assigned Provider
                </h3>
                {selectedBooking.provider ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                      {selectedBooking.provider.first_name?.charAt(0)}{selectedBooking.provider.last_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedBooking.provider.first_name} {selectedBooking.provider.last_name}</p>
                      {selectedBooking.provider.phone && (
                        <p className="text-xs text-slate-500">{selectedBooking.provider.phone}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-amber-600">No provider assigned</p>
                    {selectedBooking.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssignBookingId(selectedBooking.id);
                          setAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <Separator />

              {/* Pricing */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-600" /> Pricing
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Price</span>
                    <span className="font-medium">${Number(selectedBooking.base_price || 0).toFixed(2)}</span>
                  </div>
                  {Number(selectedBooking.discount_amount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Discount</span>
                      <span className="font-medium text-emerald-600">-${Number(selectedBooking.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(selectedBooking.extras_total) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Extras</span>
                      <span className="font-medium">${Number(selectedBooking.extras_total).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(selectedBooking.tax_amount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tax</span>
                      <span className="font-medium">${Number(selectedBooking.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">${Number(selectedBooking.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.customer_notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" /> Customer Notes
                    </h3>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic">
                      &ldquo;{selectedBooking.customer_notes}&rdquo;
                    </p>
                  </div>
                </>
              )}

              {/* Status Actions */}
              {(nextStatuses[selectedBooking.status] || []).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {(nextStatuses[selectedBooking.status] || []).map((ns) => (
                        <Button
                          key={ns}
                          variant="outline"
                          size="sm"
                          disabled={updatingStatus === selectedBooking.id}
                          onClick={() => {
                            if (ns === "cancelled") {
                              setCancelBookingId(selectedBooking.id);
                              setCancelDialogOpen(true);
                            } else {
                              handleStatusChange(selectedBooking.id, ns);
                            }
                          }}
                          className={
                            ns === "confirmed" ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50" :
                            ns === "in_progress" ? "text-blue-600 border-blue-200 hover:bg-blue-50" :
                            ns === "completed" ? "text-slate-600 border-slate-200 hover:bg-slate-50" :
                            ns === "cancelled" ? "text-red-600 border-red-200 hover:bg-red-50" : ""
                          }
                        >
                          Mark as {statusLabels[ns]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ===== CANCEL DIALOG ===== */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
              The customer will be notified of the cancellation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Yes, Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== ASSIGN PROVIDER DIALOG ===== */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Provider</DialogTitle>
            <DialogDescription>
              Select a cleaning provider to assign to this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Provider</Label>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a provider..." />
              </SelectTrigger>
              <SelectContent>
                {(providers || [])
                  .filter((p: any) => p.status === "active")
                  .map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                      {p.phone ? ` (${p.phone})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigning}>
              Cancel
            </Button>
            <Button onClick={handleAssignProvider} disabled={assigning || !selectedProviderId} className="bg-teal-600 hover:bg-teal-700">
              {assigning ? "Assigning..." : "Assign Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
