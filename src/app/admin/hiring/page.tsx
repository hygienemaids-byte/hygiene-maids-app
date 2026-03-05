"use client";

import { useState } from "react";
import { Plus, Search, UserPlus, MoreHorizontal, Calendar, MapPin, Car, Clock, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery } from "@/hooks/use-query";
import { getApplicants } from "@/lib/queries";
import { ListSkeleton } from "@/components/loading-skeleton";

const stages = [
  { key: "applied", label: "Applied", color: "bg-slate-100 text-slate-700" },
  { key: "screening", label: "Screening", color: "bg-blue-50 text-blue-700" },
  { key: "interview_scheduled", label: "Interview", color: "bg-purple-50 text-purple-700" },
  { key: "background_check", label: "Background", color: "bg-amber-50 text-amber-700" },
  { key: "offer", label: "Offer", color: "bg-emerald-50 text-emerald-700" },
  { key: "onboarding", label: "Onboarding", color: "bg-green-50 text-green-700" },
];

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : score >= 60 ? "text-amber-600 border-amber-200 bg-amber-50" : "text-red-500 border-red-200 bg-red-50";
  return (
    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold ${color}`}>
      {score}
    </div>
  );
}

export default function HiringPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: applicants, loading } = useQuery(() => getApplicants(), []);

  const filtered = (applicants || []).filter((a: any) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return `${a.first_name} ${a.last_name} ${a.email || ""} ${a.city || ""}`.toLowerCase().includes(s);
  });

  const stageCounts = stages.map((s) => ({
    ...s,
    count: (applicants || []).filter((a: any) => a.stage === s.key).length,
  }));

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Hiring Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${(applicants || []).length} applicants in pipeline`}
          </p>
        </div>
        <Button className="gap-2" onClick={() => toast.info("Feature coming soon")}>
          <Plus className="w-4 h-4" />
          Post Job
        </Button>
      </div>

      {/* Pipeline stages */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stageCounts.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-2 shrink-0">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${stage.color}`}>
              {stage.label} ({stage.count})
            </div>
            {i < stageCounts.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/50" />}
          </div>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search applicants..." className="pl-9 h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No applicants found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((applicant: any) => {
            const stage = stages.find((s) => s.key === applicant.stage);
            return (
              <Card key={applicant.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <ScoreCircle score={applicant.ai_score || 0} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold">{applicant.first_name} {applicant.last_name}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${stage?.color || ""}`}>
                          {stage?.label || applicant.stage}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {applicant.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{applicant.city}, TX</span>}
                        {applicant.years_experience != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{applicant.years_experience} yrs exp</span>}
                        <span className="flex items-center gap-1">
                          {applicant.has_own_transport ? <Car className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-400" />}
                          {applicant.has_own_transport ? "Own transport" : "No transport"}
                        </span>
                        {applicant.interview_date && (
                          <span className="flex items-center gap-1 text-purple-600 font-medium">
                            <Calendar className="w-3 h-3" />
                            Interview: {new Date(applicant.interview_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs text-muted-foreground">Applied</p>
                      <p className="text-xs font-medium">{new Date(applicant.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>View Application</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Advance Stage</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Schedule Interview</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Feature coming soon")}>Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
