"use client";

import { useState } from "react";
import { Plus, Search, Star, MapPin, Phone, Mail, MoreHorizontal, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const providers = [
  {
    id: "1",
    first_name: "Ana",
    last_name: "Lopez",
    email: "ana@hygienemaids.com",
    phone: "(214) 555-1001",
    status: "active" as const,
    avg_rating: 4.77,
    total_reviews: 65,
    total_jobs_completed: 312,
    performance_score: 92,
    payout_percentage: 40,
    service_areas: ["Dallas", "Plano", "Richardson", "Frisco"],
    hire_date: "2024-06-15",
    monthly_earnings: 1450,
  },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-50 text-gray-500 border-gray-200",
  on_leave: "bg-amber-50 text-amber-700 border-amber-200",
  terminated: "bg-red-50 text-red-700 border-red-200",
};

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cleaners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your cleaning team</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info("Feature coming soon")}>
          <Plus className="w-4 h-4" />
          Add Cleaner
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search cleaners..." className="pl-9 h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {providers.map((provider) => (
          <Card key={provider.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {provider.first_name[0]}{provider.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold">{provider.first_name} {provider.last_name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[provider.status]}`}>
                        {provider.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium">{provider.avg_rating}</span>
                      <span className="text-xs text-muted-foreground">({provider.total_reviews} reviews)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{provider.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>View Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>View Schedule</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Login as Provider</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2.5 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{provider.total_jobs_completed}</p>
                  <p className="text-[10px] text-muted-foreground">Jobs Done</p>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{provider.performance_score}</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{provider.payout_percentage}%</p>
                  <p className="text-[10px] text-muted-foreground">Payout</p>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-emerald-50">
                  <p className="text-lg font-bold text-emerald-700">${provider.monthly_earnings}</p>
                  <p className="text-[10px] text-emerald-600">Monthly</p>
                </div>
              </div>

              {/* Service areas */}
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {provider.service_areas.map((area) => (
                  <Badge key={area} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty state for hiring */}
        <Card className="border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer" onClick={() => toast.info("Feature coming soon")}>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-semibold">Hire a New Cleaner</p>
            <p className="text-xs text-muted-foreground mt-1">
              Post a job listing or add from the hiring pipeline
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
