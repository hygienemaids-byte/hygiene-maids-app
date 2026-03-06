"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Star, MapPin, Phone, Mail, MoreHorizontal, CheckCircle2, Clock, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery } from "@/hooks/use-query";
import { getProviders } from "@/lib/queries";
import { ListSkeleton } from "@/components/loading-skeleton";

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-50 text-gray-500 border-gray-200",
  on_leave: "bg-amber-50 text-amber-700 border-amber-200",
  terminated: "bg-red-50 text-red-700 border-red-200",
};

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: providers, loading } = useQuery(() => getProviders(), []);

  const filtered = (providers || []).filter((p: Record<string, any>) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return `${p.first_name} ${p.last_name} ${p.email || ""} ${p.phone || ""}`.toLowerCase().includes(s);
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cleaners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${filtered.length} cleaners`}
          </p>
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

      {loading ? (
        <ListSkeleton rows={3} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No cleaners found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((provider: Record<string, any>) => (
            <Card key={provider.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/admin/providers/${provider.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {provider.first_name?.[0]}{provider.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold">{provider.first_name} {provider.last_name}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[provider.status] || ""}`}>
                          {provider.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium">{Number(provider.avg_rating || 0).toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">({provider.total_reviews || 0} reviews)</span>
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
                      <DropdownMenuItem asChild><Link href={`/admin/providers/${provider.id}`}>View Profile</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href={`/admin/providers/${provider.id}`}>Edit</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href={`/admin/providers/${provider.id}?tab=schedule`}>View Schedule</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-2.5 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{provider.total_jobs_completed || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Jobs Done</p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{provider.performance_score || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{provider.payout_percentage || 0}%</p>
                    <p className="text-[10px] text-muted-foreground">Payout</p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-emerald-50">
                    <p className="text-lg font-bold text-emerald-700">${provider.payout_percentage ? "1,450" : "0"}</p>
                    <p className="text-[10px] text-emerald-600">Monthly</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {provider.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />{provider.phone}
                    </div>
                  )}
                </div>

                {provider.service_area_zips && (provider.service_area_zips as string[]).length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {(provider.service_area_zips as string[]).slice(0, 5).map((zip: string) => (
                      <Badge key={zip} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        {zip}
                      </Badge>
                    ))}
                    {(provider.service_area_zips as string[]).length > 5 && (
                      <span className="text-[10px] text-muted-foreground">+{(provider.service_area_zips as string[]).length - 5} more</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Card className="border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer" onClick={() => toast.info("Feature coming soon")}>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-semibold">Hire a New Cleaner</p>
              <p className="text-xs text-muted-foreground mt-1">Post a job listing or add from the hiring pipeline</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
