// @ts-nocheck
"use client";
import { CalendarDays, Clock, DollarSign, Star, ArrowRight, Sparkles, MapPin, CheckCircle2, AlertCircle, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

async function getCustomerData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get customer record by profile_id or email
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!customer) return { customer: null, bookings: [], stats: { total: 0, upcoming: 0, spent: 0 } };

  // Get bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", customer.id)
    .order("scheduled_date", { ascending: false })
    .limit(10);

  const allBookings = bookings || [];
  const today = new Date().toISOString().split("T")[0];
  const upcoming = allBookings.filter(
    (b) => b.scheduled_date >= today && b.status !== "cancelled"
  );
  const totalSpent = allBookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.total || 0), 0);

  return {
    customer,
    bookings: allBookings,
    upcoming,
    stats: {
      total: customer.total_bookings || allBookings.length,
      upcoming: upcoming.length,
      spent: totalSpent,
      lifetime: customer.lifetime_value || totalSpent,
    },
  };
}

export default function CustomerDashboard() {
  const { data, loading } = useQuery(() => getCustomerData(), []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="w-8 h-8 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-800">No Customer Profile Found</h3>
              <p className="text-sm text-amber-700 mt-1">
                Your account isn&apos;t linked to a customer profile yet. Book your first cleaning to get started!
              </p>
              <Link href="/book">
                <Button className="mt-3 bg-teal-600 hover:bg-teal-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Book Your First Cleaning
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, upcoming, stats, bookings } = data;
  const nextBooking = upcoming?.[0];

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {customer.first_name}!
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s an overview of your cleaning schedule.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Cleanings</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Upcoming</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.upcoming}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Spent</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ${stats.lifetime.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Booking */}
      {nextBooking ? (
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex flex-col items-center justify-center">
                  <span className="text-[10px] font-medium leading-none">
                    {new Date(nextBooking.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="text-lg font-bold leading-none mt-0.5">
                    {new Date(nextBooking.scheduled_date + "T12:00:00").getDate()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Next Cleaning</h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {new Date(nextBooking.scheduled_date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {nextBooking.scheduled_time
                      ? new Date(`2000-01-01T${nextBooking.scheduled_time}`).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "TBD"}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant="outline" className={statusColors[nextBooking.status] || ""}>
                      {nextBooking.status?.replace("_", " ")}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {nextBooking.bedrooms}bd / {nextBooking.bathrooms}ba
                    </span>
                    <span className="text-sm font-medium text-teal-700">
                      ${nextBooking.total?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <Link href="/customer/bookings">
                <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50">
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-8 text-center">
            <Sparkles className="w-10 h-10 text-teal-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900">No Upcoming Cleanings</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Schedule your next professional cleaning today!
            </p>
            <Link href="/book">
              <Button className="bg-teal-600 hover:bg-teal-700">Book Now</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Bookings</h2>
          <Link href="/customer/bookings">
            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        {bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking: Record<string, unknown>) => (
              <Card key={booking.id as string} className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex flex-col items-center justify-center">
                        <span className="text-[9px] text-slate-500 leading-none">
                          {new Date((booking.scheduled_date as string) + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-sm font-bold text-slate-700 leading-none mt-0.5">
                          {new Date((booking.scheduled_date as string) + "T12:00:00").getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {booking.bedrooms}bd / {booking.bathrooms}ba — {booking.frequency}
                          </span>
                          <Badge variant="outline" className={`text-[11px] ${statusColors[booking.status as string] || ""}`}>
                            {(booking.status as string)?.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {booking.address_line1}, {booking.city}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      ${(booking.total as number)?.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-slate-200 bg-white">
            <CardContent className="py-8 text-center">
              <p className="text-slate-500">No bookings yet. Book your first cleaning!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/book">
          <Card className="border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer group">
            <CardContent className="py-5 text-center">
              <Sparkles className="w-8 h-8 text-teal-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-slate-900">Book a Cleaning</h3>
              <p className="text-xs text-slate-500 mt-1">Schedule your next service</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/customer/referrals">
          <Card className="border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer group">
            <CardContent className="py-5 text-center">
              <Gift className="w-8 h-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-slate-900">Refer a Friend</h3>
              <p className="text-xs text-slate-500 mt-1">Earn $25 credit per referral</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contact">
          <Card className="border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer group">
            <CardContent className="py-5 text-center">
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-slate-900">Leave a Review</h3>
              <p className="text-xs text-slate-500 mt-1">Share your experience</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
