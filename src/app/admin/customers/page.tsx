"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Mail, Phone, MapPin, DollarSign, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery } from "@/hooks/use-query";
import { getCustomers } from "@/lib/queries";
import { ListSkeleton } from "@/components/loading-skeleton";

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-50 text-slate-600 border-slate-200",
  churned: "bg-red-50 text-red-700 border-red-200",
};

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: customers, loading } = useQuery(() => getCustomers(), []);

  const filtered = (customers || []).filter((c: Record<string, any>) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return `${c.first_name} ${c.last_name} ${c.email || ""} ${c.city || ""} ${c.phone || ""}`.toLowerCase().includes(s);
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${filtered.length} customers`}
          </p>
        </div>
        <Button className="gap-2" onClick={() => toast.info("Feature coming soon")}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search customers..." className="pl-9 h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((customer: Record<string, any>) => (
            <Card key={customer.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {customer.first_name?.[0]}{customer.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{customer.first_name} {customer.last_name}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[customer.status] || ""}`}>
                          {customer.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
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
                      <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Book Service</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-3">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />{customer.phone}
                    </div>
                  )}
                  {customer.city && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />{customer.city}, TX {customer.zip_code}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="w-3 h-3" />
                    {customer.total_bookings || 0} bookings
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <DollarSign className="w-3 h-3" />
                    {Number(customer.lifetime_value || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
