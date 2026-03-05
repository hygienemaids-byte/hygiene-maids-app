"use client";

import { useState } from "react";
import { Settings, DollarSign, Percent, MapPin, Tag, Bell, Shield, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const pricingMatrix = [
  { bedrooms: 1, bathrooms: 1, sqft: "0-999", price: 99, hours: 1.5 },
  { bedrooms: 1, bathrooms: 1, sqft: "1000-1499", price: 109, hours: 1.75 },
  { bedrooms: 2, bathrooms: 1, sqft: "1000-1499", price: 119, hours: 2.0 },
  { bedrooms: 2, bathrooms: 2, sqft: "1000-1499", price: 139, hours: 2.25 },
  { bedrooms: 2, bathrooms: 2, sqft: "1500-1999", price: 149, hours: 2.5 },
  { bedrooms: 3, bathrooms: 2, sqft: "1500-1999", price: 169, hours: 2.75 },
  { bedrooms: 3, bathrooms: 2, sqft: "2000-2499", price: 179, hours: 3.0 },
  { bedrooms: 3, bathrooms: 2.5, sqft: "2000-2499", price: 189, hours: 3.0 },
  { bedrooms: 3, bathrooms: 3, sqft: "2000-2499", price: 199, hours: 3.25 },
  { bedrooms: 4, bathrooms: 3, sqft: "2500-2999", price: 229, hours: 3.5 },
  { bedrooms: 4, bathrooms: 3, sqft: "3000-3499", price: 259, hours: 4.0 },
  { bedrooms: 5, bathrooms: 3, sqft: "3000-3499", price: 289, hours: 4.5 },
  { bedrooms: 5, bathrooms: 4, sqft: "3500+", price: 329, hours: 5.0 },
];

const frequencyDiscounts = [
  { frequency: "One-Time", discount: 0, label: "No discount" },
  { frequency: "Weekly", discount: 20, label: "Best value" },
  { frequency: "Bi-Weekly", discount: 10, label: "Popular" },
  { frequency: "Monthly", discount: 5, label: "Starter" },
];

const extras = [
  { name: "Inside Fridge", price: 35, category: "kitchen" },
  { name: "Inside Oven", price: 35, category: "kitchen" },
  { name: "Inside Cabinets", price: 40, category: "kitchen" },
  { name: "Laundry (wash & fold)", price: 25, category: "laundry" },
  { name: "Interior Windows", price: 45, category: "windows" },
  { name: "Baseboards (detailed)", price: 30, category: "deep_clean" },
  { name: "Garage Sweep", price: 40, category: "exterior" },
  { name: "Patio/Balcony", price: 30, category: "exterior" },
  { name: "Dishes", price: 15, category: "kitchen" },
  { name: "Wall Spot Cleaning", price: 25, category: "deep_clean" },
  { name: "Blinds (detailed)", price: 35, category: "deep_clean" },
  { name: "Green Cleaning Products", price: 15, category: "special" },
  { name: "Organization (per room)", price: 50, category: "special" },
  { name: "Move-In/Move-Out Deep", price: 75, category: "deep_clean" },
];

export default function SettingsPage() {
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
                    {pricingMatrix.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{row.bedrooms}</td>
                        <td className="py-2.5 px-3">{row.bathrooms}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{row.sqft}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-600">${row.price}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{row.hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {frequencyDiscounts.map((fd) => (
                  <div key={fd.frequency} className="p-4 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">{fd.frequency}</p>
                      {fd.label && <Badge variant="outline" className="text-[10px]">{fd.label}</Badge>}
                    </div>
                    <p className="text-3xl font-bold text-primary">{fd.discount}%</p>
                    <p className="text-xs text-muted-foreground mt-1">off base price</p>
                  </div>
                ))}
              </div>
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
                    <Input type="number" defaultValue="7.5" step="0.1" className="h-9" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2 w-48">
                  <Label className="text-sm">Provider Payout %</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="40" step="1" className="h-9" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {extras.map((extra) => (
                  <div key={extra.name} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{extra.name}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">{extra.category}</Badge>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">${extra.price}</p>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Dallas-Fort Worth Metro</p>
                  <div className="flex flex-wrap gap-2">
                    {["75201","75202","75204","75205","75206","75214","75219","75220","75225","75230","75231","75240","75243","75248","75252","75254","75023","75024","75025","75034","75035","75070","75071","75080","75081","75082","75062","75063"].map((zip) => (
                      <Badge key={zip} variant="outline" className="text-xs">{zip}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Houston Metro</p>
                  <div className="flex flex-wrap gap-2">
                    {["77001","77002","77003","77004","77005","77006","77007","77008","77019","77024","77025","77027","77030","77035","77036","77040","77042","77055","77056","77057","77063","77077"].map((zip) => (
                      <Badge key={zip} variant="outline" className="text-xs">{zip}</Badge>
                    ))}
                  </div>
                </div>
              </div>
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
                    <Input defaultValue="Hygiene Maids" className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Contact Email</Label>
                    <Input defaultValue="hygienemaids@gmail.com" className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Phone</Label>
                    <Input defaultValue="(214) 555-0000" className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Website</Label>
                    <Input defaultValue="https://hygienemaids.com" className="h-9" />
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
