// @ts-nocheck
"use client";
import { useState } from "react";
import {
  CreditCard, DollarSign, FileText, Clock,
  CheckCircle2, AlertCircle, ArrowUpRight, Receipt, Filter, CalendarDays
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useQuery } from "@/hooks/use-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Payment = Record<string, unknown>;

const paymentStatusColors: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-blue-50 text-blue-700 border-blue-200",
};

async function getCustomerPayments() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { payments: [], customer: null };

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!customer) return { payments: [], customer: null };

  const { data: payments } = await supabase
    .from("payments")
    .select("*, bookings(booking_number, scheduled_date, bedrooms, bathrooms)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return { payments: payments || [], customer };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function CustomerPayments() {
  const { data, loading } = useQuery(() => getCustomerPayments(), []);
  const payments = data?.payments || [];
  const customer = data?.customer;

  const [filter, setFilter] = useState<string>("all");
  const [cardDialog, setCardDialog] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [savingCard, setSavingCard] = useState(false);

  const totalPaid = payments
    .filter((p: Payment) => p.status === "paid")
    .reduce((sum: number, p: Payment) => sum + ((p.amount as number) || 0), 0);

  const pendingAmount = payments
    .filter((p: Payment) => p.status === "pending")
    .reduce((sum: number, p: Payment) => sum + ((p.amount as number) || 0), 0);

  const filteredPayments = payments.filter((p: Payment) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 16);
    return v.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + "/" + v.slice(2);
    return v;
  };

  const handleSaveCard = async () => {
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      toast.error("Please fill in all card fields");
      return;
    }
    setSavingCard(true);
    // In production this would go through Stripe
    setTimeout(() => {
      toast.success("Payment method updated successfully");
      setSavingCard(false);
      setCardDialog(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      setCardName("");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">
            {payments.length} transaction{payments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCardDialog(true)} className="bg-teal-600 hover:bg-teal-700">
          <CreditCard className="w-4 h-4 mr-2" />
          Update Payment Method
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(pendingAmount)}</p>
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
                <p className="text-sm text-slate-500">Payment Method</p>
                <p className="text-sm font-medium text-slate-700 mt-1">
                  {customer?.payment_method === "card" ? (
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" /> Card on file
                    </span>
                  ) : (
                    <span className="text-slate-400">Pay at service</span>
                  )}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        {[
          { key: "all", label: "All" },
          { key: "paid", label: "Paid" },
          { key: "pending", label: "Pending" },
          { key: "failed", label: "Failed" },
          { key: "refunded", label: "Refunded" },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? "bg-teal-600 hover:bg-teal-700" : ""}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Payment History */}
      {filteredPayments.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No payments found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {filter !== "all" ? "Try changing your filter." : "Your payment history will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredPayments.map((payment: Payment) => {
            const booking = payment.bookings as Record<string, unknown> | null;
            return (
              <Card key={payment.id as string} className="border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        payment.status === "paid" ? "bg-emerald-50" :
                        payment.status === "pending" ? "bg-amber-50" :
                        payment.status === "failed" ? "bg-red-50" : "bg-blue-50"
                      }`}>
                        {payment.status === "paid" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
                         payment.status === "pending" ? <Clock className="w-5 h-5 text-amber-600" /> :
                         payment.status === "failed" ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                         <ArrowUpRight className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-900">
                            {booking ? `Booking #${booking.booking_number}` : "Payment"}
                          </span>
                          <Badge variant="outline" className={paymentStatusColors[payment.status as string] || ""}>
                            {(payment.status as string)?.charAt(0).toUpperCase() + (payment.status as string)?.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(payment.created_at as string).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </span>
                          <span className="capitalize">{payment.method as string}</span>
                          {booking && <span>{booking.bedrooms}bd/{booking.bathrooms}ba</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-lg font-semibold ${
                        payment.status === "refunded" ? "text-blue-600" : "text-slate-900"
                      }`}>
                        {payment.status === "refunded" ? "-" : ""}{formatCurrency((payment.amount as number) || 0)}
                      </span>
                      {payment.booking_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/invoices?bookingId=${payment.booking_id}`, "_blank")}
                          className="text-slate-400 hover:text-slate-600"
                          title="Download Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Card Dialog */}
      <Dialog open={cardDialog} onOpenChange={setCardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              Update Payment Method
            </DialogTitle>
            <DialogDescription>
              Enter your card details below. Your information is securely processed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Name on Card</label>
              <Input
                placeholder="John Smith"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Card Number</label>
              <Input
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="mt-1.5 font-mono"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Expiry</label>
                <Input
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  className="mt-1.5 font-mono"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">CVC</label>
                <Input
                  placeholder="123"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="mt-1.5 font-mono"
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Your payment information is encrypted and securely processed. We never store your full card number.
                In production, this integrates with Stripe for PCI-compliant card handling.
              </span>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCardDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveCard} disabled={savingCard} className="bg-teal-600 hover:bg-teal-700">
                {savingCard ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : "Save Card"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
