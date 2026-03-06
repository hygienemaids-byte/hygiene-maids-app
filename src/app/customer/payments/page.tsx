"use client";
import { DollarSign, CreditCard, Clock, CheckCircle2, Download, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";

const paymentStatusColors: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-blue-50 text-blue-700 border-blue-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

async function getCustomerPayments() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { payments: [], stats: { total: 0, pending: 0, count: 0 } };

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!customer) return { payments: [], stats: { total: 0, pending: 0, count: 0 } };

  const { data: payments } = await supabase
    .from("payments")
    .select("*, bookings(booking_number, scheduled_date, bedrooms, bathrooms)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const all = payments || [];
  const totalPaid = all.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const pendingAmount = all.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0);

  return {
    payments: all,
    stats: { total: totalPaid, pending: pendingAmount, count: all.length },
  };
}

export default function CustomerPayments() {
  const { data, loading } = useQuery(() => getCustomerPayments(), []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { payments, stats } = data || { payments: [], stats: { total: 0, pending: 0, count: 0 } };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
        <p className="text-slate-500 mt-1">Track all your cleaning service payments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">${stats.total.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">${stats.pending.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Transactions</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.count}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No payments yet</h3>
            <p className="text-sm text-slate-500 mt-1">Your payment history will appear here after your first booking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment: Record<string, unknown>) => {
            const booking = payment.bookings as Record<string, unknown> | null;
            return (
              <Card key={payment.id as string} className="border-slate-200 bg-white">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        {payment.status === "paid" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {booking ? `Booking #${booking.booking_number}` : "Payment"}
                          </span>
                          <Badge variant="outline" className={paymentStatusColors[payment.status as string] || ""}>
                            {payment.status as string}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(payment.created_at as string).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="capitalize">{payment.method as string}</span>
                          {booking && (
                            <span>
                              {booking.bedrooms}bd/{booking.bathrooms}ba
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">
                      ${(payment.amount as number)?.toFixed(2)}
                    </span>
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
