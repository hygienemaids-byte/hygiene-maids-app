"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, ChevronRight, ChevronLeft, MapPin, Home, Bed, Bath, Ruler, Repeat, Sparkles, Calendar, Clock, User, CreditCard, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: 1, label: "Location", icon: MapPin },
  { id: 2, label: "Home Details", icon: Home },
  { id: 3, label: "Frequency", icon: Repeat },
  { id: 4, label: "Extras", icon: Sparkles },
  { id: 5, label: "Date & Time", icon: Calendar },
  { id: 6, label: "Your Info", icon: User },
  { id: 7, label: "Confirm", icon: CreditCard },
];

const SQFT_OPTIONS = [
  "0-999", "1000-1499", "1500-1999", "2000-2499", "2500-2999", "3000-3499", "3500+"
];

const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM",
];

interface BookingData {
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  sqftRange: string;
  frequency: string;
  selectedExtras: string[];
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  specialInstructions: string;
}

interface PricingRow {
  id: string;
  bedrooms: number;
  bathrooms: number;
  sqft_range: string;
  base_price: number;
  estimated_hours: number;
}

interface FreqDiscount {
  id: string;
  frequency: string;
  discount_percentage: number;
}

interface Extra {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

export default function BookingWizard() {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingData>({
    zipCode: "",
    bedrooms: 2,
    bathrooms: 2,
    sqftRange: "1500-1999",
    frequency: "One-Time",
    selectedExtras: [],
    date: "",
    time: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    specialInstructions: "",
  });

  const [pricingMatrix, setPricingMatrix] = useState<PricingRow[]>([]);
  const [discounts, setDiscounts] = useState<FreqDiscount[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [taxRate, setTaxRate] = useState(7.5);
  const [zipValid, setZipValid] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load pricing data on mount
  useEffect(() => {
    const supabase = createClient();
    async function loadData() {
      const [matrixRes, discountRes, extrasRes, areasRes, settingsRes] = await Promise.all([
        supabase.from("pricing_matrix").select("*").order("bedrooms").order("bathrooms"),
        supabase.from("frequency_discounts").select("*").order("discount_percentage"),
        supabase.from("extras").select("*").eq("is_active", true).order("category").order("name"),
        supabase.from("service_areas").select("zip_code").eq("is_active", true),
        supabase.from("system_settings").select("*"),
      ]);
      setPricingMatrix(matrixRes.data || []);
      setDiscounts(discountRes.data || []);
      setExtras(extrasRes.data || []);
      setServiceAreas((areasRes.data || []).map((a: any) => a.zip_code));
      const settings: Record<string, string> = {};
      (settingsRes.data || []).forEach((s: any) => { settings[s.key] = s.value; });
      setTaxRate(Number(settings.tax_rate || "7.5"));
    }
    loadData();
  }, []);

  // Calculate pricing
  const pricing = useMemo(() => {
    const priceRow = pricingMatrix.find(
      (p) => p.bedrooms === booking.bedrooms && p.bathrooms === booking.bathrooms && p.sqft_range === booking.sqftRange
    );
    const basePrice = priceRow ? Number(priceRow.base_price) : 0;
    const estimatedHours = priceRow ? Number(priceRow.estimated_hours) : 0;

    const selectedExtrasData = extras.filter((e) => booking.selectedExtras.includes(e.id));
    const extrasTotal = selectedExtrasData.reduce((sum, e) => sum + Number(e.price), 0);

    const discount = discounts.find((d) => d.frequency === booking.frequency);
    const discountPct = discount ? Number(discount.discount_percentage) : 0;
    const discountAmount = (basePrice * discountPct) / 100;

    const subtotal = basePrice - discountAmount + extrasTotal;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return { basePrice, extrasTotal, discountPct, discountAmount, subtotal, taxAmount, total, estimatedHours };
  }, [booking, pricingMatrix, discounts, extras, taxRate]);

  const update = (field: keyof BookingData, value: any) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  };

  const checkZip = () => {
    if (booking.zipCode.length === 5) {
      setZipValid(serviceAreas.includes(booking.zipCode));
    }
  };

  const toggleExtra = (id: string) => {
    setBooking((prev) => ({
      ...prev,
      selectedExtras: prev.selectedExtras.includes(id)
        ? prev.selectedExtras.filter((e) => e !== id)
        : [...prev.selectedExtras, id],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return zipValid === true;
      case 2: return booking.bedrooms > 0 && booking.bathrooms > 0 && booking.sqftRange !== "";
      case 3: return booking.frequency !== "";
      case 4: return true;
      case 5: return booking.date !== "" && booking.time !== "";
      case 6: return booking.firstName && booking.lastName && booking.email && booking.phone;
      case 7: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const supabase = createClient();

      // Create or find customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", booking.email)
        .single();

      let customerId: string;
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: custErr } = await supabase
          .from("customers")
          .insert({
            first_name: booking.firstName,
            last_name: booking.lastName,
            email: booking.email,
            phone: booking.phone,
            address: booking.address,
            zip_code: booking.zipCode,
          })
          .select("id")
          .single();
        if (custErr) throw custErr;
        customerId = newCustomer!.id;
      }

      // Create booking
      const { data: newBooking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          customer_id: customerId,
          status: "pending",
          frequency: booking.frequency,
          bedrooms: booking.bedrooms,
          bathrooms: booking.bathrooms,
          sqft_range: booking.sqftRange,
          scheduled_date: booking.date,
          scheduled_time: booking.time,
          base_price: pricing.basePrice,
          discount_amount: pricing.discountAmount,
          extras_total: pricing.extrasTotal,
          tax_amount: pricing.taxAmount,
          total_price: pricing.total,
          estimated_hours: pricing.estimatedHours,
          special_instructions: booking.specialInstructions,
          address: booking.address,
          zip_code: booking.zipCode,
        })
        .select("id, booking_number")
        .single();
      if (bookErr) throw bookErr;

      // Add extras
      if (booking.selectedExtras.length > 0) {
        const extrasInsert = booking.selectedExtras.map((extraId) => {
          const extra = extras.find((e) => e.id === extraId);
          return {
            booking_id: newBooking!.id,
            extra_id: extraId,
            price: extra ? Number(extra.price) : 0,
          };
        });
        await supabase.from("booking_extras").insert(extrasInsert);
      }

      toast.success(`Booking #${newBooking!.booking_number} created successfully!`);
      setStep(8); // Success step
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err.message || "Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate next 14 days for date selection
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push({
        value: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        dayOfWeek: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return dates;
  }, []);

  // Success state
  if (step === 8) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              We&apos;ve received your booking request. You&apos;ll receive a confirmation email shortly.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{new Date(booking.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{booking.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-emerald-600">${pricing.total.toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => { setStep(1); setBooking({ zipCode: "", bedrooms: 2, bathrooms: 2, sqftRange: "1500-1999", frequency: "One-Time", selectedExtras: [], date: "", time: "", firstName: "", lastName: "", email: "", phone: "", address: "", specialInstructions: "" }); }}>
              Book Another Cleaning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30">
      {/* Header */}
      <header className="bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              HM
            </div>
            <span className="font-semibold text-lg hidden sm:block">Hygiene Maids</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {step} of 7
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center py-3 overflow-x-auto gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isComplete = s.id < step;
              return (
                <div key={s.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => s.id < step && setStep(s.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? "bg-teal-50 text-teal-700" : isComplete ? "text-teal-600 hover:bg-teal-50/50 cursor-pointer" : "text-muted-foreground"
                    }`}
                    disabled={s.id > step}
                  >
                    {isComplete ? (
                      <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? "text-teal-600" : ""}`} />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 mx-0.5 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 sm:p-8">
                {/* Step 1: Location */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Where do you need cleaning?</h2>
                      <p className="text-sm text-muted-foreground">Enter your zip code to check if we serve your area</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Zip Code</Label>
                      <div className="flex gap-3">
                        <Input
                          type="text"
                          maxLength={5}
                          placeholder="e.g., 75254"
                          value={booking.zipCode}
                          onChange={(e) => { update("zipCode", e.target.value.replace(/\D/g, "")); setZipValid(null); }}
                          className="h-12 text-lg font-medium max-w-[200px]"
                        />
                        <Button onClick={checkZip} className="h-12 px-6" disabled={booking.zipCode.length !== 5}>
                          Check Availability
                        </Button>
                      </div>
                      {zipValid === true && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Great news! We serve your area.</span>
                        </div>
                      )}
                      {zipValid === false && (
                        <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">
                          Sorry, we don&apos;t serve this area yet. We&apos;re expanding soon!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Home Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Tell us about your home</h2>
                      <p className="text-sm text-muted-foreground">This helps us estimate the time and cost</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <Label className="text-sm font-medium mb-3 flex items-center gap-2"><Bed className="w-4 h-4 text-teal-600" />Bedrooms</Label>
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} onClick={() => update("bedrooms", n)}
                              className={`w-14 h-14 rounded-xl border-2 text-lg font-semibold transition-all ${
                                booking.bedrooms === n ? "border-teal-600 bg-teal-50 text-teal-700" : "border-border hover:border-teal-300"
                              }`}>{n}</button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 flex items-center gap-2"><Bath className="w-4 h-4 text-teal-600" />Bathrooms</Label>
                        <div className="flex gap-2 mt-2">
                          {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((n) => (
                            <button key={n} onClick={() => update("bathrooms", n)}
                              className={`w-14 h-14 rounded-xl border-2 text-sm font-semibold transition-all ${
                                booking.bathrooms === n ? "border-teal-600 bg-teal-50 text-teal-700" : "border-border hover:border-teal-300"
                              }`}>{n}</button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 flex items-center gap-2"><Ruler className="w-4 h-4 text-teal-600" />Square Footage</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                          {SQFT_OPTIONS.map((opt) => (
                            <button key={opt} onClick={() => update("sqftRange", opt)}
                              className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                booking.sqftRange === opt ? "border-teal-600 bg-teal-50 text-teal-700" : "border-border hover:border-teal-300"
                              }`}>{opt} sqft</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Frequency */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">How often do you need cleaning?</h2>
                      <p className="text-sm text-muted-foreground">Save more with recurring service</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {discounts.map((d) => {
                        const isSelected = booking.frequency === d.frequency;
                        return (
                          <button key={d.id} onClick={() => update("frequency", d.frequency)}
                            className={`p-5 rounded-xl border-2 text-left transition-all ${
                              isSelected ? "border-teal-600 bg-teal-50" : "border-border hover:border-teal-300"
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-base font-semibold">{d.frequency}</span>
                              {Number(d.discount_percentage) > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                                  Save {d.discount_percentage}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {d.frequency === "One-Time" && "Perfect for a single deep clean"}
                              {d.frequency === "Weekly" && "Best value — consistent clean home"}
                              {d.frequency === "Bi-Weekly" && "Most popular — great balance"}
                              {d.frequency === "Monthly" && "Light maintenance between deep cleans"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Extras */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Add extras to your cleaning</h2>
                      <p className="text-sm text-muted-foreground">Optional add-ons for a more thorough clean</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {extras.map((extra) => {
                        const isSelected = booking.selectedExtras.includes(extra.id);
                        return (
                          <button key={extra.id} onClick={() => toggleExtra(extra.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                              isSelected ? "border-teal-600 bg-teal-50" : "border-border hover:border-teal-300"
                            }`}>
                            <div>
                              <p className="text-sm font-medium">{extra.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{extra.category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-emerald-600">+${Number(extra.price).toFixed(0)}</span>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 5: Date & Time */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Pick your preferred date & time</h2>
                      <p className="text-sm text-muted-foreground">Choose from available slots</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-600" />Select Date</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
                        {availableDates.map((d) => (
                          <button key={d.value} onClick={() => update("date", d.value)}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                              booking.date === d.value ? "border-teal-600 bg-teal-50" : "border-border hover:border-teal-300"
                            }`}>
                            <p className="text-[10px] text-muted-foreground uppercase">{d.dayOfWeek}</p>
                            <p className="text-lg font-bold">{d.dayNum}</p>
                            <p className="text-[10px] text-muted-foreground">{d.month}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-teal-600" />Select Time</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                        {TIME_SLOTS.map((t) => (
                          <button key={t} onClick={() => update("time", t)}
                            className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                              booking.time === t ? "border-teal-600 bg-teal-50 text-teal-700" : "border-border hover:border-teal-300"
                            }`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Contact Info */}
                {step === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Your contact information</h2>
                      <p className="text-sm text-muted-foreground">We&apos;ll send booking confirmation to your email</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">First Name</Label>
                        <Input value={booking.firstName} onChange={(e) => update("firstName", e.target.value)} className="h-11" placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Last Name</Label>
                        <Input value={booking.lastName} onChange={(e) => update("lastName", e.target.value)} className="h-11" placeholder="Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email</Label>
                        <Input type="email" value={booking.email} onChange={(e) => update("email", e.target.value)} className="h-11" placeholder="john@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Phone</Label>
                        <Input type="tel" value={booking.phone} onChange={(e) => update("phone", e.target.value)} className="h-11" placeholder="(214) 555-0000" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Service Address</Label>
                      <Input value={booking.address} onChange={(e) => update("address", e.target.value)} className="h-11" placeholder="123 Main St, Dallas, TX" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Special Instructions (optional)</Label>
                      <textarea
                        value={booking.specialInstructions}
                        onChange={(e) => update("specialInstructions", e.target.value)}
                        className="w-full rounded-lg border border-border p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Gate code, pet info, areas to focus on..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 7: Confirm */}
                {step === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Review your booking</h2>
                      <p className="text-sm text-muted-foreground">Make sure everything looks good</p>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service</span>
                          <span className="font-medium">Home Cleaning</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Home</span>
                          <span className="font-medium">{booking.bedrooms} bed / {booking.bathrooms} bath / {booking.sqftRange} sqft</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Frequency</span>
                          <span className="font-medium">{booking.frequency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Date & Time</span>
                          <span className="font-medium">{booking.date && new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {booking.time}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Est. Duration</span>
                          <span className="font-medium">{pricing.estimatedHours}h</span>
                        </div>
                        {booking.selectedExtras.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Extras</span>
                            <span className="font-medium">{booking.selectedExtras.length} add-ons</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Customer</span>
                          <span className="font-medium">{booking.firstName} {booking.lastName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium">{booking.email}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-medium">{booking.phone}</span>
                        </div>
                        {booking.address && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Address</span>
                            <span className="font-medium">{booking.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
                  {step > 1 ? (
                    <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2">
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 7 ? (
                    <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2 bg-teal-600 hover:bg-teal-700">
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-emerald-600 hover:bg-emerald-700 px-8">
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Confirm Booking
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-base font-bold mb-4">Booking Summary</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base price</span>
                      <span className="font-medium">{pricing.basePrice > 0 ? `$${pricing.basePrice.toFixed(2)}` : "—"}</span>
                    </div>

                    {pricing.discountPct > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>{booking.frequency} discount ({pricing.discountPct}%)</span>
                        <span className="font-medium">-${pricing.discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {pricing.extrasTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extras ({booking.selectedExtras.length})</span>
                        <span className="font-medium">+${pricing.extrasTotal.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t border-border/50 pt-3 flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${pricing.subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                      <span className="font-medium">${pricing.taxAmount.toFixed(2)}</span>
                    </div>

                    <div className="border-t-2 border-border pt-3 flex justify-between">
                      <span className="font-bold text-base">Total</span>
                      <span className="font-bold text-xl text-emerald-600">${pricing.total.toFixed(2)}</span>
                    </div>

                    {pricing.estimatedHours > 0 && (
                      <div className="bg-teal-50 rounded-lg p-3 mt-3">
                        <p className="text-xs text-teal-700 font-medium">Estimated duration: {pricing.estimatedHours} hours</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span>100% satisfaction guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Check className="w-4 h-4 text-teal-600" />
                  <span>Insured & background-checked cleaners</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
