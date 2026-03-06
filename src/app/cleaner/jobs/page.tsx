// @ts-nocheck
"use client";
import { useState } from "react";
import { ClipboardList, Clock, MapPin, Search, Phone, Play, CheckCircle2, User, Navigation, X, FileText, ChevronDown, Mail, Home, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-red-50 text-red-700 border-red-200",
};

async function getCleanerJobs() {
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
    .select("*, customers(first_name, last_name, phone, email)")
    .eq("provider_id", provider.id)
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: true });

  return jobs || [];
}

function JobDetailModal({ job, onClose, onStatusUpdate, onSaveNotes }: {
  job: Record<string, unknown>;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const customer = job.customers as Record<string, unknown> | null;
  const address = [job.address_line1, job.address_line2, job.city, job.state, job.zip_code].filter(Boolean).join(", ");
  const [notes, setNotes] = useState((job.provider_notes as string) || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onSaveNotes(job.id as string, notes);
    setSavingNotes(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Job #{job.booking_number}</h3>
            <Badge variant="outline" className={`mt-1 ${statusColors[job.status as string] || ""}`}>
              {(job.status as string)?.replace("_", " ")}
            </Badge>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {new Date((job.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric"
                })}
              </p>
              <p className="text-sm text-slate-500">
                {job.scheduled_time
                  ? new Date(`2000-01-01T${job.scheduled_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                  : "Time TBD"}
                {job.estimated_duration && ` · ${job.estimated_duration} hours`}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-900 font-medium">
                  {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                </span>
              </div>
              {customer?.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
                  <Phone className="w-4 h-4" /> {customer.phone as string}
                </a>
              )}
              {customer?.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
                  <Mail className="w-4 h-4" /> {customer.email as string}
                </a>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Property</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {job.bedrooms} bedrooms · {job.bathrooms} bathrooms
                  {job.sqft_range && ` · ${job.sqft_range} sqft`}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-700">{address || "Address not provided"}</span>
              </div>
              {address && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
                >
                  <Navigation className="w-4 h-4" /> Open in Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Service & Pricing */}
          <div className="flex items-center justify-between py-3 border-y border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Service Type</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {(job.service_type as string)?.replace(/_/g, " ") || "Standard Cleaning"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Frequency</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {(job.frequency as string)?.replace(/_/g, " ") || "One-time"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">${(job.total as number)?.toFixed(2)}</p>
            </div>
          </div>

          {/* Customer Notes */}
          {job.customer_notes && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Customer Notes</h4>
              <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 italic">
                &ldquo;{job.customer_notes as string}&rdquo;
              </p>
            </div>
          )}

          {/* Provider Notes */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">My Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this job (e.g., access instructions, special requirements)..."
              rows={3}
              className="text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes || notes === (job.provider_notes || "")}
              className="mt-2"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              {savingNotes ? "Saving..." : "Save Notes"}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {job.status === "confirmed" && (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => { onStatusUpdate(job.id as string, "in_progress"); onClose(); }}
              >
                <Play className="w-4 h-4 mr-2" /> Start Job
              </Button>
            )}
            {job.status === "in_progress" && (
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => { onStatusUpdate(job.id as string, "completed"); onClose(); }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CleanerJobs() {
  const { data: jobs, loading, refetch } = useQuery(() => getCleanerJobs(), []);
  const [filter, setFilter] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Record<string, unknown> | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const filtered = (jobs || []).filter((j: Record<string, unknown>) => {
    if (filter === "upcoming") return (j.scheduled_date as string) >= today && j.status !== "cancelled" && j.status !== "completed" && j.status !== "no_show";
    if (filter === "in_progress") return j.status === "in_progress";
    if (filter === "completed") return j.status === "completed";
    if (filter === "cancelled") return j.status === "cancelled" || j.status === "no_show";
    return true;
  }).filter((j: Record<string, unknown>) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const customer = j.customers as Record<string, unknown> | null;
    const name = customer ? `${customer.first_name} ${customer.last_name}`.toLowerCase() : "";
    return name.includes(q) || String(j.booking_number).includes(q) || String(j.address_line1 || "").toLowerCase().includes(q);
  });

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, action: "status", status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      toast.success(`Job marked as ${newStatus.replace("_", " ")}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update job status");
    }
  };

  const handleSaveNotes = async (bookingId: string, notes: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, providerNotes: notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      toast.success("Notes saved");
      refetch();
    } catch {
      toast.error("Failed to save notes");
    }
  };

  // Count badges
  const counts = {
    upcoming: (jobs || []).filter(j => (j.scheduled_date as string) >= today && !["cancelled", "completed", "no_show"].includes(j.status as string)).length,
    in_progress: (jobs || []).filter(j => j.status === "in_progress").length,
    completed: (jobs || []).filter(j => j.status === "completed").length,
    cancelled: (jobs || []).filter(j => j.status === "cancelled" || j.status === "no_show").length,
    all: (jobs || []).length,
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
        <p className="text-slate-500 mt-1">View and manage your assigned cleaning jobs.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by customer, address, booking #..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "upcoming", label: "Upcoming", count: counts.upcoming },
            { key: "in_progress", label: "In Progress", count: counts.in_progress },
            { key: "completed", label: "Completed", count: counts.completed },
            { key: "cancelled", label: "Cancelled", count: counts.cancelled },
            { key: "all", label: "All", count: counts.all },
          ].map((s) => (
            <Button
              key={s.key}
              variant={filter === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s.key)}
              className={filter === s.key ? "bg-slate-800 hover:bg-slate-900" : ""}
            >
              {s.label}
              {s.count > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === s.key ? "bg-white/20" : "bg-slate-100"
                }`}>
                  {s.count}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No jobs found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {filter === "upcoming" ? "No upcoming jobs assigned to you." : 
               filter === "in_progress" ? "No jobs currently in progress." :
               "Try changing your filter or search query."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job: Record<string, unknown>) => {
            const customer = job.customers as Record<string, unknown> | null;
            const address = [job.address_line1, job.city, job.state].filter(Boolean).join(", ");
            return (
              <Card
                key={job.id as string}
                className="border-slate-200 bg-white hover:border-slate-300 transition-colors cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-slate-500 font-medium leading-none">
                          {new Date((job.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                        </span>
                        <span className="text-xl font-bold text-slate-700 leading-none mt-0.5">
                          {new Date((job.scheduled_date as string) + "T12:00:00").getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">#{job.booking_number}</span>
                          <Badge variant="outline" className={statusColors[job.status as string] || ""}>
                            {(job.status as string)?.replace("_", " ")}
                          </Badge>
                          {job.frequency && job.frequency !== "one_time" && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                              {(job.frequency as string).replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                          </span>
                          {customer?.phone && (
                            <a
                              href={`tel:${customer.phone}`}
                              className="text-xs text-teal-600 flex items-center gap-0.5 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-3 h-3" />
                              {customer.phone as string}
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {job.scheduled_time
                              ? new Date(`2000-01-01T${job.scheduled_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                              : "TBD"}
                          </span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MapPin className="w-3 h-3" />
                            {job.address_line1}, {job.city}
                          </a>
                          <span>{job.bedrooms}bd/{job.bathrooms}ba</span>
                          {job.sqft_range && <span>{job.sqft_range}sqft</span>}
                        </div>
                        {job.customer_notes && (
                          <p className="text-xs text-slate-500 mt-1.5 italic bg-slate-50 px-2 py-1 rounded truncate">
                            &ldquo;{job.customer_notes as string}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-semibold text-slate-900">${(job.total as number)?.toFixed(2)}</span>
                      {job.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(job.id as string, "in_progress"); }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" /> Start
                        </Button>
                      )}
                      {job.status === "in_progress" && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(job.id as string, "completed"); }}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onStatusUpdate={handleStatusUpdate}
          onSaveNotes={handleSaveNotes}
        />
      )}
    </div>
  );
}
