"use client";

import { useState } from "react";
import { Search, DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp, MoreHorizontal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const payments = [
  { id: "1", booking_number: 1521, customer_name: "Henry Kabakwu", amount: 171.14, method: "card", status: "paid", paid_at: "2026-03-05T10:30:00", provider_payout: 68.46 },
  { id: "2", booking_number: 1520, customer_name: "Sarah Johnson", amount: 215.50, method: "card", status: "paid", paid_at: "2026-03-05T08:15:00", provider_payout: 86.20 },
  { id: "3", booking_number: 1519, customer_name: "Michael Chen", amount: 143.20, method: "card", status: "paid", paid_at: "2026-03-04T14:00:00", provider_payout: 57.28 },
  { id: "4", booking_number: 1518, customer_name: "Emily Davis", amount: 199.00, method: "card", status: "pending", paid_at: null, provider_payout: 79.60 },
  { id: "5", booking_number: 1517, customer_name: "James Wilson", amount: 289.00, method: "card", status: "paid", paid_at: "2026-03-03T16:00:00", provider_payout: 115.60 },
  { id: "6", booking_number: 1516, customer_name: "Lisa Martinez", amount: 119.00, method: "cash", status: "paid", paid_at: "2026-03-03T11:30:00", provider_payout: 47.60 },
];

const payouts = [
  { id: "1", provider_name: "Ana Lopez", period: "Feb 24 - Mar 2", amount: 1245.00, status: "paid", paid_at: "2026-03-03", method: "bank_transfer", bookings_count: 12 },
  { id: "2", provider_name: "Ana Lopez", period: "Feb 17 - Feb 23", amount: 1180.00, status: "paid", paid_at: "2026-02-24", method: "bank_transfer", bookings_count: 11 },
  { id: "3", provider_name: "Ana Lopez", period: "Mar 3 - Mar 9", amount: 454.74, status: "pending", paid_at: null, method: "bank_transfer", bookings_count: 5 },
];

const statusColors: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-slate-50 text-slate-600 border-slate-200",
};

const methodLabels: Record<string, string> = {
  card: "Card",
  cash: "Cash",
  check: "Check",
  bank_transfer: "Bank Transfer",
};

export default function PaymentsPage() {
  const totalRevenue = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalPayouts = payouts.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track revenue, payouts, and financial health</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.info("Feature coming soon")}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue (This Month)</p>
                <p className="text-2xl font-bold mt-1">${totalRevenue.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px] text-muted-foreground">+18% vs last month</span></div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provider Payouts</p>
                <p className="text-2xl font-bold mt-1">${totalPayouts.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">40% of revenue</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50"><CreditCard className="w-5 h-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">${pendingPayments.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{payments.filter(p => p.status === "pending").length} transactions</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Customer Payments</TabsTrigger>
          <TabsTrigger value="payouts">Provider Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-muted-foreground font-mono">#{payment.booking_number}</span>
                      <p className="text-sm font-semibold">{payment.customer_name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[payment.status]}`}>{payment.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{methodLabels[payment.method]}</span>
                      {payment.paid_at && <span>{new Date(payment.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">${payment.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Payout: ${payment.provider_payout.toFixed(2)}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>Send Receipt</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Feature coming soon")}>Refund</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-3">
          {payouts.map((payout) => (
            <Card key={payout.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold">{payout.provider_name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[payout.status]}`}>{payout.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{payout.period}</span>
                      <span>{payout.bookings_count} bookings</span>
                      <span>{methodLabels[payout.method]}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">${payout.amount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
