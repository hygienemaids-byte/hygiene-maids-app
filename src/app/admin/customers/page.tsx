"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Mail, Phone, MapPin, DollarSign, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const customers = [
  { id: "1", first_name: "Henry", last_name: "Kabakwu", email: "henry@example.com", phone: "(214) 555-0101", city: "Dallas", zip_code: "75254", total_bookings: 24, lifetime_value: 4107.36, tags: ["weekly", "loyal"] },
  { id: "2", first_name: "Sarah", last_name: "Johnson", email: "sarah@example.com", phone: "(469) 555-0202", city: "Plano", zip_code: "75023", total_bookings: 18, lifetime_value: 3879.00, tags: ["biweekly"] },
  { id: "3", first_name: "Michael", last_name: "Chen", email: "michael@example.com", phone: "(972) 555-0303", city: "Richardson", zip_code: "75080", total_bookings: 32, lifetime_value: 4582.40, tags: ["weekly", "loyal", "vip"] },
  { id: "4", first_name: "Emily", last_name: "Davis", email: "emily@example.com", phone: "(214) 555-0404", city: "Frisco", zip_code: "75034", total_bookings: 1, lifetime_value: 199.00, tags: ["new"] },
  { id: "5", first_name: "James", last_name: "Wilson", email: "james@example.com", phone: "(469) 555-0505", city: "Irving", zip_code: "75062", total_bookings: 6, lifetime_value: 1734.00, tags: ["monthly"] },
  { id: "6", first_name: "Lisa", last_name: "Martinez", email: "lisa@example.com", phone: "(972) 555-0606", city: "McKinney", zip_code: "75070", total_bookings: 15, lifetime_value: 1785.00, tags: ["weekly"] },
];

const tagColors: Record<string, string> = {
  weekly: "bg-blue-50 text-blue-700 border-blue-200",
  biweekly: "bg-purple-50 text-purple-700 border-purple-200",
  monthly: "bg-amber-50 text-amber-700 border-amber-200",
  loyal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  vip: "bg-yellow-50 text-yellow-700 border-yellow-200",
  new: "bg-sky-50 text-sky-700 border-sky-200",
};

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = customers.filter((c) =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.city}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} total customers</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((customer) => (
          <Card key={customer.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {customer.first_name[0]}{customer.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{customer.first_name} {customer.last_name}</p>
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {customer.city}, TX {customer.zip_code}
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {customer.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${tagColors[tag] || ""}`}>
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />
                  {customer.total_bookings} bookings
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <DollarSign className="w-3 h-3" />
                  {customer.lifetime_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
