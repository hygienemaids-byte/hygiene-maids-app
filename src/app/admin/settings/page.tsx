"use client";

import { Settings, DollarSign, Percent, MapPin, Tag, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery } from "@/hooks/use-query";
import { getPricingMatrix, getFrequencyDiscounts, getExtras, getServiceAreas, getSystemSettings } from "@/lib/queries";
import { ListSkeleton } from "@/components/loading-skeleton";

export default function SettingsPage() {
  const { data: pricingMatrix, loading: loadingPricing } = useQuery(() => getPricingMatrix(), []);
  const { data: frequencyDiscounts, loading: loadingDiscounts } = useQuery(() => getFrequencyDiscounts(), []);
  const { data: extras, loading: loadingExtras } = useQuery(() => getExtras(), []);
  const { data: serviceAreas, loading: loadingAreas } = useQuery(() => getServiceAreas(), []);
  const { data: settings, loading: loadingSettings } = useQuery(() => getSystemSettings(), []);

  // Group service areas by city
  const areasByCity: Record<string, string[]> = {};
  (serviceAreas || []).forEach((area: any) => {
    const city = area.city || "Other";
    if (!areasByCity[city]) areasByCity[city] = [];
    areasByCity[city].push(area.zip_code);
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure pricing, service areas, and platform settings</p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pricing" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" />Pricing</TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5"><Percent className="w-3.5 h-3.5" />Discounts</TabsTrigger>
          <TabsTrigger value="extras" className="gap-1.5"><Tag className="w-3.5 h-3.5" />Extras</TabsTrigger>
          <TabsTrigger value="areas" className="gap-1.5"><MapPin className="w-3.5 h-3.5" />Service Areas</TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5"><Shield className="w-3.5 h-3.5" />General</TabsTrigger>
        </TabsList>

        {/* Pricing Matrix */}
        <TabsContent value="pricing">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Base Pricing Matrix</CardTitle>
              <CardDescription>Set base prices by bedroom, bathroom, and square footage combination</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPricing ? (
                <ListSkeleton rows={8} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase">Bedrooms</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase">Bathrooms</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase">Sq Ft</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase">Base Price</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase">Est. Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pricingMatrix || []).map((row: any, i: number) => (
                        <tr key={row.id || i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-medium">{row.bedrooms}</td>
                          <td className="py-2.5 px-3">{row.bathrooms}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{row.sqft_range}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-600">${Number(row.base_price).toFixed(0)}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{row.estimated_hours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => toast.info("Feature coming soon")}>Add Row</Button>
                <Button size="sm" variant="outline" onClick={() => toast.info("Feature coming soon")}>Import CSV</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frequency Discounts */}
        <TabsContent value="discounts">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Frequency Discounts</CardTitle>
              <CardDescription>Recurring service discounts applied to the base price</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDiscounts ? (
                <ListSkeleton rows={4} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(frequencyDiscounts || []).map((fd: any) => (
                    <div key={fd.id} className="p-4 rounded-xl border border-border bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">{fd.frequency}</p>
                        {fd.frequency === "Weekly" && <Badge variant="outline" className="text-[10px]">Best value</Badge>}
                        {fd.frequency === "Bi-Weekly" && <Badge variant="outline" className="text-[10px]">Popular</Badge>}
                      </div>
                      <p className="text-3xl font-bold text-primary">{fd.discount_percentage}%</p>
                      <p className="text-xs text-muted-foreground mt-1">off base price</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm mt-4">
            <CardHeader>
              <CardTitle className="text-base">Tax Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="space-y-2 w-48">
                  <Label className="text-sm">Sales Tax Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue={settings?.tax_rate || "7.5"} step="0.1" className="h-9" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2 w-48">
                  <Label className="text-sm">Provider Payout %</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue={settings?.provider_payout_percentage || "40"} step="1" className="h-9" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <Button size="sm" className="mt-4" onClick={() => toast.success("Settings saved!")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extras */}
        <TabsContent value="extras">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Service Extras / Add-Ons</CardTitle>
              <CardDescription>Additional services customers can add to their booking</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingExtras ? (
                <ListSkeleton rows={6} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(extras || []).map((extra: any) => (
                    <div key={extra.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{extra.name}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">{extra.category}</Badge>
                      </div>
                      <p className="text-sm font-bold text-emerald-600">${Number(extra.price).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button size="sm" className="mt-4" onClick={() => toast.info("Feature coming soon")}>Add Extra</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Areas */}
        <TabsContent value="areas">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Service Areas</CardTitle>
              <CardDescription>Zip codes where Hygiene Maids operates</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAreas ? (
                <ListSkeleton rows={4} />
              ) : (
                <div className="space-y-4">
                  {Object.entries(areasByCity).map(([city, zips]) => (
                    <div key={city}>
                      <p className="text-sm font-semibold mb-2">{city} Metro</p>
                      <div className="flex flex-wrap gap-2">
                        {zips.map((zip) => (
                          <Badge key={zip} variant="outline" className="text-xs">{zip}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button size="sm" className="mt-4" onClick={() => toast.info("Feature coming soon")}>Add Zip Code</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General */}
        <TabsContent value="general">
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Business Name</Label>
                    <Input defaultValue={settings?.business_name || "Hygiene Maids"} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Contact Email</Label>
                    <Input defaultValue={settings?.contact_email || "hygienemaids@gmail.com"} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Phone</Label>
                    <Input defaultValue={settings?.contact_phone || "(214) 555-0000"} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Website</Label>
                    <Input defaultValue={settings?.website_url || "https://hygienemaids.com"} className="h-9" />
                  </div>
                </div>
                <Button size="sm" onClick={() => toast.success("Settings saved!")}>Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Email booking confirmations</p><p className="text-xs text-muted-foreground">Send customers email when booking is confirmed</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">SMS reminders</p><p className="text-xs text-muted-foreground">Send reminder 24 hours before appointment</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Provider notifications</p><p className="text-xs text-muted-foreground">Notify providers of new assignments</p></div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
