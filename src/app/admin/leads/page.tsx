"use client";

import { useState } from "react";
import { Plus, Search, Target, Sparkles, Phone, Mail, ArrowUpRight, MoreHorizontal, Flame, ThermometerSun, Snowflake, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const leads = [
  { id: "1", first_name: "Amanda", last_name: "Brooks", email: "amanda@example.com", phone: "(214) 555-7001", source: "website", status: "new", temperature: "hot", score: 85, zip_code: "75205", frequency_interest: "weekly", estimated_value: 680, created_at: "2026-03-04", notes: "Requested quote for 4BR home" },
  { id: "2", first_name: "Robert", last_name: "Kim", email: "robert@example.com", phone: "(469) 555-7002", source: "google_ads", status: "contacted", temperature: "warm", score: 62, zip_code: "75024", frequency_interest: "biweekly", estimated_value: 340, created_at: "2026-03-03", notes: "Interested in bi-weekly service" },
  { id: "3", first_name: "Patricia", last_name: "Garcia", email: "patricia@example.com", phone: "(972) 555-7003", source: "referral", status: "qualified", temperature: "hot", score: 91, zip_code: "75070", frequency_interest: "weekly", estimated_value: 720, created_at: "2026-03-02", notes: "Referred by Sarah Johnson. Large home." },
  { id: "4", first_name: "David", last_name: "Thompson", email: "david@example.com", phone: "(214) 555-7004", source: "chatbot", status: "new", temperature: "warm", score: 55, zip_code: "75080", frequency_interest: "one_time", estimated_value: 199, created_at: "2026-03-04", notes: "Move-out cleaning inquiry" },
  { id: "5", first_name: "Jennifer", last_name: "Lee", email: null, phone: "(469) 555-7005", source: "phone", status: "contacted", temperature: "cool", score: 35, zip_code: "77006", frequency_interest: "monthly", estimated_value: 180, created_at: "2026-03-01", notes: "Houston area. Budget conscious." },
];

const tempConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  hot: { icon: Flame, color: "text-red-600", bg: "bg-red-50" },
  warm: { icon: ThermometerSun, color: "text-amber-600", bg: "bg-amber-50" },
  cool: { icon: Thermometer, color: "text-blue-500", bg: "bg-blue-50" },
  cold: { icon: Snowflake, color: "text-slate-400", bg: "bg-slate-50" },
};

const statusConfig: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 border-sky-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  proposal: "bg-purple-50 text-purple-700 border-purple-200",
  won: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  dormant: "bg-gray-50 text-gray-500 border-gray-200",
};

const sourceLabels: Record<string, string> = {
  website: "Website",
  google_ads: "Google Ads",
  referral: "Referral",
  chatbot: "AI Chatbot",
  phone: "Phone",
  social_media: "Social Media",
  abandoned_booking: "Abandoned",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold">{score}</span>
    </div>
  );
}

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = leads.filter((l) => {
    const matchesSearch = `${l.first_name} ${l.last_name} ${l.email || ""} ${l.phone || ""}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const hotLeads = leads.filter((l) => l.temperature === "hot").length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI CRM / Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI-powered lead management and nurturing</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info("Feature coming soon")}>
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{leads.length}</p><p className="text-[11px] text-muted-foreground">Total Leads</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{hotLeads}</p><p className="text-[11px] text-muted-foreground">Hot Leads</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">${totalValue.toLocaleString()}</p><p className="text-[11px] text-muted-foreground">Pipeline Value</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold">68%</p><p className="text-[11px] text-muted-foreground">Conversion Rate</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search leads..." className="pl-9 h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads list */}
      <div className="space-y-3">
        {filtered.map((lead) => {
          const temp = tempConfig[lead.temperature];
          const TempIcon = temp.icon;
          return (
            <Card key={lead.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Temperature indicator */}
                  <div className={`p-2.5 rounded-xl ${temp.bg} shrink-0`}>
                    <TempIcon className={`w-5 h-5 ${temp.color}`} />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold">{lead.first_name} {lead.last_name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusConfig[lead.status]}`}>
                        {lead.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        {sourceLabels[lead.source] || lead.source}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                    </div>
                    {lead.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{lead.notes}</p>}
                  </div>

                  {/* Score */}
                  <div className="hidden sm:block shrink-0">
                    <p className="text-[10px] text-muted-foreground mb-1">AI Score</p>
                    <ScoreBar score={lead.score} />
                  </div>

                  {/* Value */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">${lead.estimated_value?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{lead.frequency_interest}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Log Activity</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Convert to Customer</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Mark as Lost</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
