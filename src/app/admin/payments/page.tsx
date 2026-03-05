"use client";

import { Search, DollarSign, ArrowUpRight, CreditCard, TrendingUp, MoreHorizontal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery } from "@/hooks/use-query";
import { getPayments, getProviderPayouts } from "@/lib/queries";
import { ListSkeleton } from "@/components/loading-skeleton";

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
  stripe: "Stripe",
};

export default function PaymentsPage() {
  const { data: payments, loading: loadingPayments } = useQuery(() => getPayments(), []);
  const { data: payouts, loading: loadingPayouts } = useQuery(() => getProviderPayouts(), []);

  const totalRevenue = (payments || []).filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const totalPayoutAmt = (payouts || []).filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const pendingPayments = (payments || []).filter((p: any) => p.status === "pending").reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

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
                <p className="text-2xl font-bold mt-1">${totalPayoutAmt.toFixed(2)}</p>
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
                <p className="text-[11px] text-muted-foreground mt-1">{(payments || []).filter((p: any) => p.status === "pending").length} transactions</p>
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
          {loadingPayments ? (
            <ListSkeleton rows={5} />
          ) : (payments || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No payments found</p>
            </div>
          ) : (
            (payments || []).map((payment: any) => (
              <Card key={payment.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-muted-foreground font-mono">#{payment.booking?.booking_number || "—"}</span>
                        <p className="text-sm font-semibold">
                          {payment.customer?.first_name} {payment.customer?.last_name}
                        </p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[payment.status] || ""}`}>{payment.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{methodLabels[payment.payment_method] || payment.payment_method}</span>
                        {payment.paid_at && <span>{new Date(payment.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">${Number(payment.amount || 0).toFixed(2)}</p>
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
            ))
          )}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-3">
          {loadingPayouts ? (
            <ListSkeleton rows={3} />
          ) : (payouts || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No payouts found</p>
            </div>
          ) : (
            (payouts || []).map((payout: any) => (
              <Card key={payout.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold">
                          {payout.provider?.first_name} {payout.provider?.last_name}
                        </p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[payout.status] || ""}`}>{payout.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(payout.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(payout.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span>{payout.bookings_count || 0} bookings</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">${Number(payout.amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
