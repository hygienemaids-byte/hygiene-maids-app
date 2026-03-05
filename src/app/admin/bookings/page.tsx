"use client";

import { useState } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import { useQuery } from "@/hooks/use-query";
import { getBookings } from "@/lib/queries";
import { ListSkeleton } from "@/components/loading-skeleton";
import Link from "next/link";

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

const frequencyLabels: Record<string, string> = {
  one_time: "One-Time",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
};

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

  const { data: bookings, loading } = useQuery(
    () => getBookings({ status: statusFilter }),
    [statusFilter]
  );

  const filteredBookings = (bookings || []).filter((b: Record<string, any>) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    const customerName = `${b.customer?.first_name || ""} ${b.customer?.last_name || ""}`;
    return (
      customerName.toLowerCase().includes(s) ||
      String(b.booking_number).includes(s) ||
      (b.city || "").toLowerCase().includes(s) ||
      (b.address_line1 || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading bookings..." : `${filteredBookings.length} bookings found`}
          </p>
        </div>
        <Link href="/book">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </Button>
        </Link>
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
      {loading ? (
        <ListSkeleton rows={6} />
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No bookings found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking: Record<string, any>) => (
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
                        {statusLabels[booking.status] || booking.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        {frequencyLabels[booking.frequency] || booking.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {booking.customer?.first_name} {booking.customer?.last_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {booking.address_line1}, {booking.city}, TX {booking.zip_code}
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
                          !booking.provider
                            ? "text-amber-600"
                            : "text-foreground"
                        }`}
                      >
                        {booking.provider
                          ? `${booking.provider.first_name} ${booking.provider.last_name}`
                          : "Unassigned"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.bedrooms}BR / {booking.bathrooms}BA
                    </p>
                  </div>

                  {/* Total */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">${Number(booking.total).toFixed(2)}</p>
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
      )}
    </div>
  );
}
