// @ts-nocheck
"use client";
import { useState } from "react";
import { ClipboardList, Clock, MapPin, Search, Phone, Play, CheckCircle2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function CleanerJobs() {
  const { data: jobs, loading, refetch } = useQuery(() => getCleanerJobs(), []);
  const [filter, setFilter] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const filtered = (jobs || []).filter((j: Record<string, unknown>) => {
    if (filter === "upcoming") return (j.scheduled_date as string) >= today && j.status !== "cancelled" && j.status !== "completed";
    if (filter === "completed") return j.status === "completed";
    if (filter === "cancelled") return j.status === "cancelled";
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
        body: JSON.stringify({ bookingId, action: "status", status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Job marked as ${newStatus.replace("_", " ")}`);
      refetch();
    } catch {
      toast.error("Failed to update job status");
    }
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
            placeholder="Search by customer, address..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "upcoming", label: "Upcoming" },
            { key: "all", label: "All" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map((s) => (
            <Button
              key={s.key}
              variant={filter === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s.key)}
              className={filter === s.key ? "bg-slate-800 hover:bg-slate-900" : ""}
            >
              {s.label}
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
              {filter === "upcoming" ? "No upcoming jobs assigned." : "Try changing your filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job: Record<string, unknown>) => {
            const customer = job.customers as Record<string, unknown> | null;
            return (
              <Card key={job.id as string} className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
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
                          <span className="text-xs text-slate-400">{job.frequency}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {customer ? `${customer.first_name} ${customer.last_name}` : "Customer"}
                          </span>
                          {customer?.phone && (
                            <a href={`tel:${customer.phone}`} className="text-xs text-teal-600 flex items-center gap-0.5 hover:underline">
                              <Phone className="w-3 h-3" />
                              {customer.phone as string}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {job.scheduled_time
                              ? new Date(`2000-01-01T${job.scheduled_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                              : "TBD"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.address_line1}, {job.city}
                          </span>
                          <span>{job.bedrooms}bd/{job.bathrooms}ba &middot; {job.sqft_range}sqft</span>
                        </div>
                        {job.customer_notes && (
                          <p className="text-xs text-slate-500 mt-1.5 italic bg-slate-50 px-2 py-1 rounded">
                            &ldquo;{job.customer_notes as string}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-semibold text-slate-900">${(job.total as number)?.toFixed(2)}</span>
                      {job.status === "confirmed" && (
                        <Button size="sm" onClick={() => handleStatusUpdate(job.id as string, "in_progress")} className="bg-blue-600 hover:bg-blue-700">
                          <Play className="w-3.5 h-3.5 mr-1" /> Start
                        </Button>
                      )}
                      {job.status === "in_progress" && (
                        <Button size="sm" onClick={() => handleStatusUpdate(job.id as string, "completed")} className="bg-emerald-600 hover:bg-emerald-700">
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
    </div>
  );
}
