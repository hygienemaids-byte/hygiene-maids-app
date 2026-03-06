// @ts-nocheck
"use client";
import { useState, useMemo } from "react";
import {
  ClipboardList, Clock, MapPin, Search, Phone, CheckCircle2, User,
  X, Calendar, ChevronLeft, ChevronRight, DollarSign, Play, Home, Mail,
  FileText, Navigation, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  in_progress: { label: "In Progress", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  no_show: { label: "No Show", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
};

type ViewMode = "day" | "week" | "month";

function mapsUrl(job: Record<string, unknown>) {
  const parts = [job.address_line1, job.city, job.state, job.zip_code].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

function formatTime(time: string) {
  if (!time) return "TBD";
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getDateRange(mode: ViewMode, offset: number) {
  const now = new Date();
  let start: Date, end: Date;

  if (mode === "day") {
    start = new Date(now);
    start.setDate(now.getDate() + offset);
    end = new Date(start);
  } else if (mode === "week") {
    start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + offset * 7);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  }
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    label:
      mode === "day"
        ? start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : mode === "week"
        ? `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

async function fetchJobs(startDate: string, endDate: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { jobs: [], provider: null };

  const { data: provider } = await supabase
    .from("providers")
    .select("id, payout_percentage, first_name, last_name")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!provider) return { jobs: [], provider: null };

  const { data: jobs } = await supabase
    .from("bookings")
    .select("*, customers(first_name, last_name, phone, email)")
    .eq("provider_id", provider.id)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  return { jobs: jobs || [], provider };
}

function JobDetailModal({ job, provider, open, onClose }: { job: Record<string, unknown> | null; provider: Record<string, unknown> | null; open: boolean; onClose: () => void }) {
  if (!job) return null;
  const customer = job.customers as Record<string, unknown> | null;
  const status = statusConfig[job.status as string] || statusConfig.pending;
  const payoutPct = (job.provider_payout_percentage as number) || (provider?.payout_percentage as number) || 40;
  const payoutAmount = (job.provider_payout_amount as number) || ((job.total as number) || 0) * (payoutPct / 100);
  const address = [job.address_line1, job.address_line2, job.city, job.state, job.zip_code].filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Job #{job.booking_number}</span>
            <Badge variant="outline" className={`${status.bg} ${status.color} border`}>{status.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Customer Info */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer</h4>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
              </p>
              {customer?.phone && (
                <a href={`tel:${customer.phone}`} className="text-sm text-teal-600 hover:underline flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> {customer.phone as string}
                </a>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address</h4>
            <a
              href={mapsUrl(job)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-600 hover:underline flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>{address}</span>
            </a>
            {job.access_instructions && (
              <p className="text-xs text-slate-500 mt-2 bg-slate-50 px-3 py-2 rounded-lg">
                <span className="font-medium">Access:</span> {job.access_instructions as string}
              </p>
            )}
            {job.has_pets && (
              <p className="text-xs text-amber-600 mt-1">🐾 Pets on premises{job.pet_details ? `: ${job.pet_details}` : ""}</p>
            )}
          </div>

          {/* Schedule */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Schedule</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-medium text-slate-900">
                  {new Date((job.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Time</p>
                <p className="font-medium text-slate-900">{formatTime(job.scheduled_time as string)}</p>
              </div>
              <div>
                <p className="text-slate-500">Duration</p>
                <p className="font-medium text-slate-900">{job.estimated_duration}h estimated</p>
              </div>
              <div>
                <p className="text-slate-500">Frequency</p>
                <p className="font-medium text-slate-900 capitalize">{(job.frequency as string)?.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          {/* Property */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Property</h4>
            <div className="flex gap-4 text-sm">
              <span className="text-slate-700"><span className="font-medium">{job.bedrooms}</span> Bed</span>
              <span className="text-slate-700"><span className="font-medium">{job.bathrooms}</span> Bath</span>
              {job.sqft_range && <span className="text-slate-700">{job.sqft_range} sqft</span>}
            </div>
          </div>

          {/* Pay */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">Your Pay</h4>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-bold text-teal-800">${payoutAmount.toFixed(2)}</p>
                <p className="text-xs text-teal-600 mt-0.5">{payoutPct}% of ${(job.total as number)?.toFixed(2)} total</p>
              </div>
              {(job.tip_amount as number) > 0 && (
                <div className="text-right">
                  <p className="text-sm font-semibold text-teal-700">+ ${(job.tip_amount as number).toFixed(2)} tip</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {(job.customer_notes || job.admin_notes) && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</h4>
              {job.customer_notes && (
                <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg mb-2">
                  <span className="font-medium text-slate-700">Customer:</span> {job.customer_notes as string}
                </p>
              )}
              {job.admin_notes && (
                <p className="text-sm text-slate-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <span className="font-medium text-amber-700">Admin:</span> {job.admin_notes as string}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button asChild className="flex-1 bg-teal-600 hover:bg-teal-700">
              <a href={mapsUrl(job)} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4 mr-2" /> Get Directions
              </a>
            </Button>
            {customer?.phone && (
              <Button asChild variant="outline" className="flex-1">
                <a href={`tel:${customer.phone}`}>
                  <Phone className="w-4 h-4 mr-2" /> Call Customer
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CleanerJobs() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<"current" | "upcoming" | "past">("upcoming");

  const range = useMemo(() => getDateRange(viewMode, offset), [viewMode, offset]);
  const { data, loading, refetch } = useQuery(() => fetchJobs(range.start, range.end), [viewMode, offset]);
  const jobs = data?.jobs || [];
  const provider = data?.provider;
  const today = new Date().toISOString().split("T")[0];

  const categorized = useMemo(() => {
    const current: Record<string, unknown>[] = [];
    const upcoming: Record<string, unknown>[] = [];
    const past: Record<string, unknown>[] = [];

    jobs.forEach((j: Record<string, unknown>) => {
      if (j.status === "in_progress") {
        current.push(j);
      } else if (j.status === "completed" || j.status === "cancelled" || j.status === "no_show") {
        past.push(j);
      } else if ((j.scheduled_date as string) >= today) {
        upcoming.push(j);
      } else {
        past.push(j);
      }
    });
    return { current, upcoming, past };
  }, [jobs, today]);

  const displayJobs = useMemo(() => {
    let list = tab === "current" ? categorized.current : tab === "upcoming" ? categorized.upcoming : categorized.past;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((j) => {
        const c = j.customers as Record<string, unknown> | null;
        const name = c ? `${c.first_name} ${c.last_name}`.toLowerCase() : "";
        return name.includes(q) || String(j.booking_number).includes(q) || String(j.address_line1 || "").toLowerCase().includes(q);
      });
    }
    return list;
  }, [tab, categorized, search]);

  const tabs = [
    { key: "current" as const, label: "Current", count: categorized.current.length },
    { key: "upcoming" as const, label: "Upcoming", count: categorized.upcoming.length },
    { key: "past" as const, label: "Past", count: categorized.past.length },
  ];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
        <p className="text-slate-500 mt-1">View and manage your assigned cleaning jobs.</p>
      </div>

      {/* View Mode + Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {(["day", "week", "month"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setViewMode(m); setOffset(0); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                viewMode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[180px] text-center">{range.label}</span>
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(0)}>Today</Button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key ? "bg-teal-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {t.label} {t.count > 0 && <span className="ml-1 text-xs opacity-80">({t.count})</span>}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : displayJobs.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No {tab} jobs</p>
            <p className="text-sm text-slate-400 mt-1">
              {tab === "current" ? "You don't have any jobs in progress right now." :
               tab === "upcoming" ? "No upcoming jobs scheduled for this period." :
               "No past jobs found for this period."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayJobs.map((job) => {
            const customer = job.customers as Record<string, unknown> | null;
            const status = statusConfig[job.status as string] || statusConfig.pending;
            const payoutPct = (job.provider_payout_percentage as number) || (provider?.payout_percentage as number) || 40;
            const payoutAmount = (job.provider_payout_amount as number) || ((job.total as number) || 0) * (payoutPct / 100);

            return (
              <Card
                key={job.id as string}
                className="border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">#{job.booking_number}</span>
                        <Badge variant="outline" className={`text-[11px] ${status.bg} ${status.color} border`}>
                          {status.label}
                        </Badge>
                        <span className="text-xs text-slate-400 capitalize">{(job.frequency as string)?.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1.5">
                        <User className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date((job.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          {" at "}
                          {formatTime(job.scheduled_time as string)}
                        </span>
                        <a
                          href={mapsUrl(job)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MapPin className="w-3 h-3" />
                          {job.address_line1}, {job.city}
                        </a>
                        <span>{job.bedrooms}bd/{job.bathrooms}ba</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-teal-700">${payoutAmount.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">your pay</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        provider={provider}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
