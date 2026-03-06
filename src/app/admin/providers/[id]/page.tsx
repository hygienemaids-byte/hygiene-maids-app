// @ts-nocheck
"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Star, MapPin, Phone, Mail, DollarSign, Calendar,
  ClipboardList, User, Shield, Key, ChevronLeft, ChevronRight, Edit2,
  CheckCircle2, Clock, AlertCircle, Percent, Briefcase, Navigation
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-50 text-gray-500 border-gray-200",
  on_leave: "bg-amber-50 text-amber-700 border-amber-200",
  terminated: "bg-red-50 text-red-700 border-red-200",
};

const bookingStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  confirmed: { label: "Confirmed", color: "text-blue-700 bg-blue-50 border-blue-200" },
  in_progress: { label: "In Progress", color: "text-purple-700 bg-purple-50 border-purple-200" },
  completed: { label: "Completed", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  cancelled: { label: "Cancelled", color: "text-red-700 bg-red-50 border-red-200" },
  no_show: { label: "No Show", color: "text-slate-700 bg-slate-50 border-slate-200" },
};

function formatTime(time: string) {
  if (!time) return "TBD";
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function AdminProviderDetail() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);
  const [payouts, setPayouts] = useState<Record<string, unknown>[]>([]);
  const [scheduleOffset, setScheduleOffset] = useState(0);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showAssignJob, setShowAssignJob] = useState(false);
  const [unassignedBookings, setUnassignedBookings] = useState<Record<string, unknown>[]>([]);
  const [assigningJob, setAssigningJob] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    status: "active", employee_type: "contractor",
    hourly_rate: "", payout_percentage: "40",
    address_line1: "", city: "", state: "", zip_code: "",
    max_daily_bookings: "4", notes: "",
    service_area_zips: "", calendar_color: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: prov } = await supabase
        .from("providers")
        .select("*")
        .eq("id", providerId)
        .single();

      if (!prov) { setLoading(false); return; }
      setProvider(prov);

      // Load profile for avatar
      if (prov.profile_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url, email")
          .eq("id", prov.profile_id)
          .single();
        setProfile(prof);
      }

      setForm({
        first_name: prov.first_name || "",
        last_name: prov.last_name || "",
        email: prov.email || "",
        phone: prov.phone || "",
        status: prov.status || "active",
        employee_type: prov.employee_type || "contractor",
        hourly_rate: String(prov.hourly_rate || ""),
        payout_percentage: String(prov.payout_percentage || 40),
        address_line1: prov.address_line1 || "",
        city: prov.city || "",
        state: prov.state || "",
        zip_code: prov.zip_code || "",
        max_daily_bookings: String(prov.max_daily_bookings || 4),
        notes: prov.notes || "",
        service_area_zips: (prov.service_area_zips || []).join(", "),
        calendar_color: prov.calendar_color || "",
      });

      // Load bookings
      const { data: bk } = await supabase
        .from("bookings")
        .select("*, customers(first_name, last_name, phone, email)")
        .eq("provider_id", providerId)
        .order("scheduled_date", { ascending: false })
        .limit(50);
      setBookings(bk || []);

      // Load reviews
      const { data: rv } = await supabase
        .from("reviews")
        .select("*, customers(first_name, last_name), bookings(booking_number)")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });
      setReviews(rv || []);

      // Load payouts
      const { data: po } = await supabase
        .from("provider_payouts")
        .select("*, booking:bookings(booking_number)")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })
        .limit(20);
      setPayouts(po || []);

      setLoading(false);
    }
    load();
  }, [providerId]);

  // Schedule data
  const scheduleRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + scheduleOffset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      label: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      days: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d.toISOString().split("T")[0];
      }),
    };
  }, [scheduleOffset]);

  const scheduleBookings = useMemo(() => {
    return bookings.filter((b) =>
      (b.scheduled_date as string) >= scheduleRange.start &&
      (b.scheduled_date as string) <= scheduleRange.end &&
      b.status !== "cancelled"
    );
  }, [bookings, scheduleRange]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const updates = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        status: form.status,
        employee_type: form.employee_type,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        payout_percentage: parseFloat(form.payout_percentage) || 40,
        address_line1: form.address_line1,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        max_daily_bookings: parseInt(form.max_daily_bookings) || 4,
        notes: form.notes,
        service_area_zips: form.service_area_zips.split(",").map((s) => s.trim()).filter(Boolean),
        calendar_color: form.calendar_color || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("providers").update(updates).eq("id", providerId);
      if (error) throw error;

      // Also update profiles table if profile_id exists
      if (provider?.profile_id) {
        await supabase.from("profiles").update({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          updated_at: new Date().toISOString(),
        }).eq("id", provider.profile_id);
      }

      toast.success("Provider updated successfully");
    } catch (err) {
      toast.error("Failed to update provider");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setResettingPassword(true);
    try {
      // Note: Admin password reset requires Supabase service role key (server-side)
      // For now, we'll send a password reset email instead
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      toast.success(`Password reset email sent to ${form.email}`);
      setShowResetPassword(false);
      setNewPassword("");
    } catch (err) {
      toast.error("Failed to send password reset email");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleAssignJob = async (bookingId: string) => {
    setAssigningJob(bookingId);
    try {
      const supabase = createClient();
      const payoutPct = parseFloat(form.payout_percentage) || 40;

      // Get booking total to calculate payout
      const booking = unassignedBookings.find((b) => b.id === bookingId);
      const total = (booking?.total as number) || 0;
      const payoutAmount = total * (payoutPct / 100);

      const { error } = await supabase
        .from("bookings")
        .update({
          provider_id: providerId,
          provider_payout_percentage: payoutPct,
          provider_payout_amount: payoutAmount,
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) throw error;
      toast.success("Job assigned successfully");
      setUnassignedBookings((prev) => prev.filter((b) => b.id !== bookingId));

      // Refresh bookings
      const { data: bk } = await supabase
        .from("bookings")
        .select("*, customers(first_name, last_name, phone, email)")
        .eq("provider_id", providerId)
        .order("scheduled_date", { ascending: false })
        .limit(50);
      setBookings(bk || []);
    } catch (err) {
      toast.error("Failed to assign job");
    } finally {
      setAssigningJob(null);
    }
  };

  const loadUnassignedBookings = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*, customers(first_name, last_name)")
      .is("provider_id", null)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_date", { ascending: true })
      .limit(20);
    setUnassignedBookings(data || []);
    setShowAssignJob(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-xl border animate-pulse" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-muted-foreground">Provider not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/providers")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cleaners
        </Button>
      </div>
    );
  }

  const initials = `${form.first_name?.charAt(0) || ""}${form.last_name?.charAt(0) || ""}`;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/providers")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={profile?.avatar_url as string} />
              <AvatarFallback className="bg-slate-800 text-white font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{form.first_name} {form.last_name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={`text-[10px] ${statusColors[form.status] || ""}`}>
                  {form.status?.replace("_", " ")}
                </Badge>
                {(provider.avg_rating as number) > 0 && (
                  <span className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {Number(provider.avg_rating).toFixed(1)} ({provider.total_reviews} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowResetPassword(true)}>
            <Key className="w-4 h-4 mr-2" /> Reset Password
          </Button>
          <Button variant="outline" onClick={loadUnassignedBookings}>
            <Briefcase className="w-4 h-4 mr-2" /> Assign Job
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Personal Info */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">First Name</Label>
                    <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Last Name</Label>
                    <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-1 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-9 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Employee Type</Label>
                    <Select value={form.employee_type} onValueChange={(v) => setForm({ ...form, employee_type: v })}>
                      <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="mt-1 h-9 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">State</Label>
                    <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Zip Code</Label>
                    <Input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} className="mt-1 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Service Area Zip Codes (comma separated)</Label>
                  <Input value={form.service_area_zips} onChange={(e) => setForm({ ...form, service_area_zips: e.target.value })} placeholder="75001, 75002, 75003" className="mt-1 h-9 text-sm" />
                </div>
              </CardContent>
            </Card>

            {/* Pay & Settings */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Pay & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Payout Rate (%)</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={form.payout_percentage}
                        onChange={(e) => setForm({ ...form, payout_percentage: e.target.value })}
                        className="h-9 text-sm pr-8"
                      />
                      <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Default: 40%</p>
                  </div>
                  <div>
                    <Label className="text-xs">Hourly Rate ($)</Label>
                    <Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} placeholder="25.00" className="mt-1 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Max Daily Bookings</Label>
                  <Input type="number" min="1" max="10" value={form.max_daily_bookings} onChange={(e) => setForm({ ...form, max_daily_bookings: e.target.value })} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Calendar Color</Label>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Color used to identify this cleaner in the booking calendar</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.calendar_color || "#3B82F6"}
                      onChange={(e) => setForm({ ...form, calendar_color: e.target.value })}
                      className="w-9 h-9 rounded border border-slate-200 cursor-pointer"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {["#3B82F6","#EF4444","#F59E0B","#10B981","#8B5CF6","#EC4899","#06B6D4","#F97316"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm({ ...form, calendar_color: c })}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${form.calendar_color === c ? "border-slate-800 scale-110" : "border-transparent hover:border-slate-300"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Internal notes about this cleaner..."
                  rows={5}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SCHEDULE TAB */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setScheduleOffset((o) => o - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[200px] text-center">{scheduleRange.label}</span>
              <Button variant="outline" size="icon" onClick={() => setScheduleOffset((o) => o + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setScheduleOffset(0)}>This Week</Button>
            </div>
            <Button variant="outline" size="sm" onClick={loadUnassignedBookings}>
              <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Assign Job
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {scheduleRange.days.map((day) => {
              const dayBookings = scheduleBookings.filter((b) => b.scheduled_date === day);
              const dayDate = new Date(day + "T12:00:00");
              const isToday = day === new Date().toISOString().split("T")[0];
              return (
                <div key={day} className={`min-h-[120px] rounded-lg border p-2 ${isToday ? "border-teal-300 bg-teal-50/30" : "border-slate-200 bg-white"}`}>
                  <p className={`text-xs font-medium mb-1.5 ${isToday ? "text-teal-700" : "text-slate-500"}`}>
                    {dayDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                  </p>
                  {dayBookings.length === 0 ? (
                    <p className="text-[10px] text-slate-300 text-center mt-4">No jobs</p>
                  ) : (
                    <div className="space-y-1">
                      {dayBookings.map((b) => {
                        const st = bookingStatusConfig[b.status as string] || bookingStatusConfig.pending;
                        const customer = b.customers as Record<string, unknown> | null;
                        return (
                          <div key={b.id as string} className={`text-[10px] px-1.5 py-1 rounded border ${st.color}`}>
                            <p className="font-medium truncate">{formatTime(b.scheduled_time as string)}</p>
                            <p className="truncate">{customer ? `${customer.first_name} ${(customer.last_name as string)?.charAt(0)}.` : `#${b.booking_number}`}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* All bookings list */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Assigned Jobs ({bookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No jobs assigned yet.</p>
              ) : (
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {bookings.slice(0, 30).map((b) => {
                    const st = bookingStatusConfig[b.status as string] || bookingStatusConfig.pending;
                    const customer = b.customers as Record<string, unknown> | null;
                    return (
                      <div key={b.id as string} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm font-medium">
                            #{b.booking_number} · {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date((b.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            {" at "}{formatTime(b.scheduled_time as string)}
                            {" · "}{b.address_line1}, {b.city}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">${(b.total as number)?.toFixed(2)}</span>
                          <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVIEWS TAB */}
        <TabsContent value="reviews" className="space-y-4">
          {reviews.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No reviews yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => {
                const customer = r.customers as Record<string, unknown> | null;
                const booking = r.bookings as Record<string, unknown> | null;
                return (
                  <Card key={r.id as string} className="border-0 shadow-sm">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className={`w-4 h-4 ${i <= (r.rating as number) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                          </span>
                          {booking && <span className="text-xs text-muted-foreground">#{booking.booking_number}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at as string).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && <p className="text-sm text-slate-600 mt-2">{r.comment as string}</p>}
                      {r.admin_response && (
                        <div className="mt-2 bg-slate-50 rounded px-3 py-2">
                          <p className="text-xs font-medium text-slate-500">Your Response</p>
                          <p className="text-sm text-slate-600">{r.admin_response as string}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Payout Rate</p>
                <p className="text-2xl font-bold mt-1">{form.payout_percentage}%</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold mt-1">
                  ${payouts.reduce((s, p) => s + ((p.amount as number) || 0), 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Completed Jobs</p>
                <p className="text-2xl font-bold mt-1">{bookings.filter((b) => b.status === "completed").length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No payouts recorded.</p>
              ) : (
                <div className="divide-y">
                  {payouts.map((p) => {
                    const booking = p.booking as Record<string, unknown> | null;
                    return (
                      <div key={p.id as string} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm font-medium">${(p.amount as number)?.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking ? `Job #${booking.booking_number}` : "Payout"}
                            {" · "}{(p.method as string)?.replace("_", " ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`text-[10px] ${
                            p.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {p.status as string}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date((p.paid_at || p.created_at) as string).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send a password reset email to <strong>{form.email}</strong>.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPassword(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resettingPassword}>
              {resettingPassword ? "Sending..." : "Send Reset Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Job Dialog */}
      <Dialog open={showAssignJob} onOpenChange={setShowAssignJob}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Job to {form.first_name}</DialogTitle>
          </DialogHeader>
          {unassignedBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No unassigned bookings available.</p>
          ) : (
            <div className="divide-y">
              {unassignedBookings.map((b) => {
                const customer = b.customers as Record<string, unknown> | null;
                return (
                  <div key={b.id as string} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">
                        #{b.booking_number} · {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date((b.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" at "}{formatTime(b.scheduled_time as string)}
                        {" · "}{b.bedrooms}bd/{b.bathrooms}ba
                      </p>
                      <p className="text-xs text-muted-foreground">{b.address_line1}, {b.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${(b.total as number)?.toFixed(2)}</p>
                      <Button
                        size="sm"
                        className="mt-1"
                        disabled={assigningJob === b.id}
                        onClick={() => handleAssignJob(b.id as string)}
                      >
                        {assigningJob === b.id ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
