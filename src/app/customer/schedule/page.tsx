// @ts-nocheck
"use client";
import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";
import BookingCalendar, { CalendarBooking } from "@/components/BookingCalendar";
import { toast } from "sonner";

async function getCustomerBookings(): Promise<CalendarBooking[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!customer) return [];

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, providers(first_name, last_name)")
    .eq("customer_id", customer.id)
    .not("status", "eq", "cancelled")
    .order("scheduled_date", { ascending: true });

  return (bookings || []).map((b: any) => ({
    id: b.id,
    booking_number: b.booking_number,
    scheduled_date: b.scheduled_date,
    scheduled_time: b.scheduled_time || "09:00",
    estimated_duration: b.estimated_duration,
    status: b.status,
    bedrooms: b.bedrooms,
    bathrooms: b.bathrooms,
    sqft_range: b.sqft_range,
    address_line1: b.address_line1,
    city: b.city,
    frequency: b.frequency,
    total: Number(b.total),
    provider_name: b.providers
      ? `${b.providers.first_name} ${b.providers.last_name}`
      : undefined,
  }));
}

export default function CustomerSchedule() {
  const { data: bookings, loading, refetch } = useQuery(() => getCustomerBookings(), []);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const handleReschedule = useCallback(async (bookingId: string, newDate: string, newTime: string) => {
    setRescheduleError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          action: "reschedule",
          scheduledDate: newDate,
          scheduledTime: newTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to reschedule");
        throw new Error(data.error);
      }
      toast.success("Booking rescheduled successfully!");
      refetch();
    } catch (err: any) {
      setRescheduleError(err.message);
      throw err;
    }
  }, [refetch]);

  const handleBookingClick = useCallback((booking: CalendarBooking) => {
    // Navigate to bookings page with the booking highlighted
    window.location.href = `/customer/bookings?highlight=${booking.id}`;
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
          <p className="text-slate-500 mt-1">
            View and manage your cleaning schedule. Drag bookings to reschedule.
          </p>
        </div>
        <Link href="/customer/book">
          <Button className="bg-teal-600 hover:bg-teal-700" size="sm">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Book New Cleaning
          </Button>
        </Link>
      </div>

      {rescheduleError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {rescheduleError}
        </div>
      )}

      {/* Calendar with drag-and-drop */}
      <BookingCalendar
        bookings={bookings || []}
        role="customer"
        view="month"
        onReschedule={handleReschedule}
        onBookingClick={handleBookingClick}
        loading={loading}
      />
    </div>
  );
}
