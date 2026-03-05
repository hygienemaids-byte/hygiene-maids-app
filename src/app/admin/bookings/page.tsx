"use client";

import { useState } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-50 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-gray-50 text-gray-500 border-gray-200",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  in_progress: "In Progress",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  draft: "Draft",
};

// Demo bookings data
const bookings = [
  {
    id: "1521",
    booking_number: 1521,
    customer_name: "Henry Kabakwu",
    customer_email: "henry@example.com",
    provider_name: "Ana Lopez",
    scheduled_date: "2026-03-06",
    scheduled_time: "13:00",
    address: "890 Maple Dr, Dallas, TX 75254",
    frequency: "Weekly",
    bedrooms: 3,
    bathrooms: 2,
    status: "confirmed",
    total: 171.14,
  },
  {
    id: "1520",
    booking_number: 1520,
    customer_name: "Sarah Johnson",
    customer_email: "sarah@example.com",
    provider_name: "Ana Lopez",
    scheduled_date: "2026-03-06",
    scheduled_time: "08:00",
    address: "1234 Oak Lane, Plano, TX 75023",
    frequency: "Bi-Weekly",
    bedrooms: 4,
    bathrooms: 3,
    status: "confirmed",
    total: 215.50,
  },
  {
    id: "1519",
    booking_number: 1519,
    customer_name: "Michael Chen",
    customer_email: "michael@example.com",
    provider_name: "Ana Lopez",
    scheduled_date: "2026-03-06",
    scheduled_time: "10:30",
    address: "567 Elm St, Richardson, TX 75080",
    frequency: "Weekly",
    bedrooms: 2,
    bathrooms: 2,
    status: "in_progress",
    total: 143.20,
  },
  {
    id: "1518",
    booking_number: 1518,
    customer_name: "Emily Davis",
    customer_email: "emily@example.com",
    provider_name: "Unassigned",
    scheduled_date: "2026-03-07",
    scheduled_time: "09:00",
    address: "321 Pine Ave, Frisco, TX 75034",
    frequency: "One-Time",
    bedrooms: 3,
    bathrooms: 2.5,
    status: "pending",
    total: 199.00,
  },
  {
    id: "1517",
    booking_number: 1517,
    customer_name: "James Wilson",
    customer_email: "james@example.com",
    provider_name: "Ana Lopez",
    scheduled_date: "2026-03-05",
    scheduled_time: "14:00",
    address: "789 Cedar Blvd, Irving, TX 75062",
    frequency: "Monthly",
    bedrooms: 5,
    bathrooms: 3,
    status: "completed",
    total: 289.00,
  },
  {
    id: "1516",
    booking_number: 1516,
    customer_name: "Lisa Martinez",
    customer_email: "lisa@example.com",
    provider_name: "Ana Lopez",
    scheduled_date: "2026-03-05",
    scheduled_time: "11:00",
    address: "456 Birch Rd, McKinney, TX 75070",
    frequency: "Weekly",
    bedrooms: 2,
    bathrooms: 1,
    status: "completed",
    total: 119.00,
  },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.booking_number.toString().includes(searchQuery) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track all cleaning appointments
          </p>
        </div>
        <Button className="gap-2" onClick={() => toast.info("Feature coming soon")}>
          <Plus className="w-4 h-4" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, booking #, or address..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Date/Time block */}
                <div className="hidden sm:flex flex-col items-center justify-center w-20 shrink-0 py-2 px-3 rounded-xl bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">
                    {formatDate(booking.scheduled_date).split(",")[0]}
                  </p>
                  <p className="text-lg font-bold leading-tight">
                    {new Date(booking.scheduled_date + "T00:00:00").getDate()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTime(booking.scheduled_time)}
                  </p>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{booking.booking_number}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[booking.status]}`}
                    >
                      {statusLabels[booking.status]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                      {booking.frequency}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold truncate">{booking.customer_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {booking.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground sm:hidden">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(booking.scheduled_date)}, {formatTime(booking.scheduled_time)}
                    </span>
                  </div>
                </div>

                {/* Provider */}
                <div className="hidden md:block text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span
                      className={`text-xs font-medium ${
                        booking.provider_name === "Unassigned"
                          ? "text-amber-600"
                          : "text-foreground"
                      }`}
                    >
                      {booking.provider_name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {booking.bedrooms}BR / {booking.bathrooms}BA
                  </p>
                </div>

                {/* Total */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">${booking.total.toFixed(2)}</p>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Booking
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => toast.info("Feature coming soon")}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
