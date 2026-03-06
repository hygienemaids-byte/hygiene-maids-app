"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND, IMAGES } from "@/lib/constants";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import {
  Phone, Shield, Star, Clock, CheckCircle, Sparkles,
  ArrowRight, ArrowLeft, Calendar, MapPin, Home, Bed,
  Bath, Ruler, Repeat, Plus, CreditCard, User,
  Check, AlertCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface PricingMatrix {
  id: string;
  bedrooms: number;
  bathrooms: number;
  sqft_min: number;
  sqft_max: number;
  base_price: number;
  estimated_hours: number;
}

interface FrequencyDiscount {
  id: string;
  frequency: string;
  discount_percentage: number;
}

interface Extra {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

interface ServiceArea {
  id: string;
  zip_code: string;
  city: string;
  state: string;
}

interface PricingData {
  pricingMatrix: PricingMatrix[];
  frequencyDiscounts: FrequencyDiscount[];
  extras: Extra[];
  serviceAreas: ServiceArea[];
  taxRate: number;
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const STEPS = [
  { id: 1, label: "Location", icon: MapPin },
  { id: 2, label: "Home", icon: Home },
  { id: 3, label: "Frequency", icon: Repeat },
  { id: 4, label: "Extras", icon: Plus },
  { id: 5, label: "Schedule", icon: Calendar },
  { id: 6, label: "Contact", icon: User },
  { id: 7, label: "Confirm", icon: Check },
];

const SQFT_RANGES = [
  { min: 0, max: 499, label: "Under 500 sq ft" },
  { min: 500, max: 999, label: "500 – 999 sq ft" },
  { min: 1000, max: 1499, label: "1,000 – 1,499 sq ft" },
  { min: 1500, max: 1999, label: "1,500 – 1,999 sq ft" },
  { min: 2000, max: 2499, label: "2,000 – 2,499 sq ft" },
  { min: 2500, max: 2999, label: "2,500 – 2,999 sq ft" },
  { min: 3000, max: 3499, label: "3,000 – 3,499 sq ft" },
  { min: 3500, max: 3999, label: "3,500 – 3,999 sq ft" },
  { min: 4000, max: 9999, label: "4,000+ sq ft" },
];

const BEDROOM_OPTIONS = [0, 1, 2, 3, 4, 5];
const BATHROOM_OPTIONS = [1, 2, 3, 4];

const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

const FREQ_DESCRIPTIONS: Record<string, string> = {
  one_time: "Perfect for a one-time deep clean",
  weekly: "Best value — always come home to a clean house",
  biweekly: "Most popular — great balance of clean & savings",
  monthly: "Light maintenance between deep cleans",
};

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function BookingWizard({ data }: { data: PricingData }) {
  const { pricingMatrix, frequencyDiscounts, extras, serviceAreas, taxRate } = data;

  // ── State ──
  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [sqftMin, setSqftMin] = useState(1000);
  const [sqftMax, setSqftMax] = useState(1499);
  const [frequency, setFrequency] = useState("biweekly");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [contact, setContact] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "", notes: "",
  });

  // ── Zip validation (pure client-side lookup) ──
  const zipMatch = useMemo(() => {
    if (zipCode.length < 5) return null;
    return serviceAreas.find(a => a.zip_code === zipCode) || null;
  }, [zipCode, serviceAreas]);

  // ── Price calculation (pure client-side) ──
  const price = useMemo(() => {
    const entry = pricingMatrix.find(
      m => m.bedrooms === bedrooms && m.bathrooms === bathrooms &&
           m.sqft_min === sqftMin && m.sqft_max === sqftMax
    );
    if (!entry) return null;

    const basePrice = entry.base_price;
    const disc = frequencyDiscounts.find(d => d.frequency === frequency);
    const discPct = disc ? Number(disc.discount_percentage) : 0;
    const discAmt = round2(basePrice * discPct / 100);
    const discounted = round2(basePrice - discAmt);

    const chosenExtras = extras.filter(e => selectedExtras.includes(e.id));
    const extrasTotal = round2(chosenExtras.reduce((s, e) => s + Number(e.price), 0));

    const subtotal = round2(discounted + extrasTotal);
    const tax = round2(subtotal * taxRate);
    const total = round2(subtotal + tax);

    return {
      basePrice, discPct, discAmt, discounted,
      extras: chosenExtras.map(e => ({ name: e.name, price: Number(e.price) })),
      extrasTotal, subtotal, taxRate, tax, total,
      hours: entry.estimated_hours,
    };
  }, [bedrooms, bathrooms, sqftMin, sqftMax, frequency, selectedExtras, pricingMatrix, frequencyDiscounts, extras, taxRate]);

  // ── Frequency label ──
  const freqLabel = useCallback((f: string) => {
    const labels: Record<string, string> = {
      one_time: "One-time", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly",
    };
    return labels[f] || f;
  }, []);

  // ── Available dates (next 14 days, no Sundays) ──
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 1; i <= 21 && dates.length < 12; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (d.getDay() !== 0) dates.push(d);
    }
    return dates;
  }, []);

  // ── Toggle extra ──
  const toggleExtra = (id: string) => {
    setSelectedExtras(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Can proceed ──
  const canProceed = () => {
    switch (step) {
      case 1: return zipMatch !== null;
      case 2: return price !== null;
      case 3: return frequency !== "";
      case 4: return true;
      case 5: return selectedDate !== "" && selectedTime !== "";
      case 6: return contact.firstName && contact.lastName && contact.email && contact.phone && contact.address;
      default: return true;
    }
  };

  const next = () => { if (canProceed() && step < 7) setStep(step + 1); };
  const prev = () => { if (step > 1) setStep(step - 1); };

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-[#0C1829]">
        <div className="absolute inset-0 opacity-15">
          <img src={IMAGES.luxuryHero} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C1829] via-[#0C1829]/95 to-[#0C1829]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/20 rounded-full mb-6">
            <Calendar size={14} className="text-[#0D9488]" />
            <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Book Your Cleaning</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Book Your <span className="text-[#0D9488]">Professional Cleaning</span>
          </h1>
          <p className="mt-4 text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
            Book online in under 2 minutes. No obligations, no hidden fees.
          </p>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[{ label: "Book Now" }]} />
      </div>

      {/* ═══ STEP INDICATOR ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  s.id === step ? "scale-105" : s.id < step ? "cursor-pointer opacity-80 hover:opacity-100" : "opacity-40"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  s.id === step ? "bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/30" :
                  s.id < step ? "bg-[#0D9488]/20 text-[#0D9488]" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {s.id < step ? <Check size={18} /> : <s.icon size={18} />}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide hidden sm:block ${
                  s.id === step ? "text-[#0D9488]" : s.id < step ? "text-[#0C1829]" : "text-gray-400"
                }`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 rounded transition-all ${
                  s.id < step ? "bg-[#0D9488]" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Form Area ── */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">

                    {/* ── STEP 1: Location ── */}
                    {step === 1 && (
                      <div>
                        <StepHeader icon={MapPin} title="Where do you need cleaning?" subtitle="Enter your zip code to check service availability" />
                        <div className="max-w-sm">
                          <label className="block text-sm font-semibold text-[#0C1829] mb-2">Zip Code</label>
                          <input
                            type="text" maxLength={5}
                            value={zipCode}
                            onChange={e => setZipCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="e.g. 75201"
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-lg font-semibold text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                          />
                          {zipCode.length === 5 && (
                            <div className={`mt-3 flex items-center gap-2 text-sm ${zipMatch ? "text-[#0D9488]" : "text-red-500"}`}>
                              {zipMatch ? (
                                <><CheckCircle size={16} /> We serve {zipMatch.city}, {zipMatch.state}!</>
                              ) : (
                                <><AlertCircle size={16} /> Sorry, we don&apos;t serve this area yet.</>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: Home Details ── */}
                    {step === 2 && (
                      <div>
                        <StepHeader icon={Home} title="Tell us about your home" subtitle="Select bedrooms, bathrooms, and square footage" />
                        <div className="grid sm:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-[#0C1829] mb-2 flex items-center gap-1.5"><Bed size={14} className="text-[#0D9488]" /> Bedrooms</label>
                            <div className="grid grid-cols-3 gap-2">
                              {BEDROOM_OPTIONS.map(n => (
                                <button key={n} onClick={() => setBedrooms(n)}
                                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    bedrooms === n ? "bg-[#0D9488] text-white shadow-md" : "bg-gray-50 text-[#0C1829] hover:bg-gray-100"
                                  }`}>{n}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-[#0C1829] mb-2 flex items-center gap-1.5"><Bath size={14} className="text-[#0D9488]" /> Bathrooms</label>
                            <div className="grid grid-cols-2 gap-2">
                              {BATHROOM_OPTIONS.map(n => (
                                <button key={n} onClick={() => setBathrooms(n)}
                                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    bathrooms === n ? "bg-[#0D9488] text-white shadow-md" : "bg-gray-50 text-[#0C1829] hover:bg-gray-100"
                                  }`}>{n}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-[#0C1829] mb-2 flex items-center gap-1.5"><Ruler size={14} className="text-[#0D9488]" /> Square Feet</label>
                            <select
                              value={`${sqftMin}-${sqftMax}`}
                              onChange={e => {
                                const [min, max] = e.target.value.split("-").map(Number);
                                setSqftMin(min);
                                setSqftMax(max);
                              }}
                              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-[#0C1829] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                            >
                              {SQFT_RANGES.map(r => (
                                <option key={`${r.min}-${r.max}`} value={`${r.min}-${r.max}`}>{r.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {!price && (
                          <p className="mt-4 text-sm text-amber-600 flex items-center gap-1.5">
                            <AlertCircle size={14} /> No pricing for this combination. Try different options.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── STEP 3: Frequency ── */}
                    {step === 3 && (
                      <div>
                        <StepHeader icon={Repeat} title="How often do you need cleaning?" subtitle="Save more with recurring service" />
                        <div className="grid sm:grid-cols-2 gap-4">
                          {frequencyDiscounts.map(fd => (
                            <button key={fd.id} onClick={() => setFrequency(fd.frequency)}
                              className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                                frequency === fd.frequency
                                  ? "border-[#0D9488] bg-[#0D9488]/5 shadow-md"
                                  : "border-gray-100 hover:border-gray-200"
                              }`}>
                              {Number(fd.discount_percentage) > 0 && (
                                <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#C9A84C] text-white text-[10px] font-bold rounded-full">
                                  SAVE {fd.discount_percentage}%
                                </span>
                              )}
                              <div className="text-base font-bold text-[#0C1829] capitalize" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                {freqLabel(fd.frequency)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {FREQ_DESCRIPTIONS[fd.frequency] || ""}
                              </div>
                              {frequency === fd.frequency && (
                                <div className="absolute top-3 left-3"><Check size={16} className="text-[#0D9488]" /></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 4: Extras ── */}
                    {step === 4 && (
                      <div>
                        <StepHeader icon={Plus} title="Add extras (optional)" subtitle="Customize your cleaning with add-ons" />
                        <div className="grid sm:grid-cols-2 gap-3">
                          {extras.map(extra => {
                            const isSel = selectedExtras.includes(extra.id);
                            return (
                              <button key={extra.id} onClick={() => toggleExtra(extra.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                  isSel ? "border-[#0D9488] bg-[#0D9488]/5" : "border-gray-100 hover:border-gray-200"
                                }`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isSel ? "bg-[#0D9488] text-white" : "bg-gray-100 text-gray-400"
                                }`}>
                                  {isSel ? <Check size={16} /> : <Plus size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-[#0C1829]">{extra.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{extra.description}</div>
                                </div>
                                <span className="text-sm font-bold text-[#0D9488] flex-shrink-0">+{fmt(Number(extra.price))}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 5: Date & Time ── */}
                    {step === 5 && (
                      <div>
                        <StepHeader icon={Calendar} title="Pick a date & time" subtitle="Choose your preferred cleaning schedule" />
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-semibold text-[#0C1829] mb-3">Select Date</label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                              {availableDates.map(d => {
                                const ds = d.toISOString().split("T")[0];
                                return (
                                  <button key={ds} onClick={() => setSelectedDate(ds)}
                                    className={`p-3 rounded-xl text-center transition-all ${
                                      selectedDate === ds ? "bg-[#0D9488] text-white shadow-md" : "bg-gray-50 hover:bg-gray-100"
                                    }`}>
                                    <div className={`text-[10px] font-semibold ${selectedDate === ds ? "text-white/70" : "text-gray-400"}`}>
                                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                                    </div>
                                    <div className="text-lg font-bold">{d.getDate()}</div>
                                    <div className={`text-[10px] ${selectedDate === ds ? "text-white/70" : "text-gray-400"}`}>
                                      {d.toLocaleDateString("en-US", { month: "short" })}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {selectedDate && (
                            <div>
                              <label className="block text-sm font-semibold text-[#0C1829] mb-3">Select Time</label>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {TIME_SLOTS.map(t => (
                                  <button key={t} onClick={() => setSelectedTime(t)}
                                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                                      selectedTime === t ? "bg-[#0D9488] text-white shadow-md" : "bg-gray-50 hover:bg-gray-100 text-[#0C1829]"
                                    }`}>{t}</button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 6: Contact ── */}
                    {step === 6 && (
                      <div>
                        <StepHeader icon={User} title="Your contact details" subtitle="We'll send your booking confirmation here" />
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input label="First Name *" value={contact.firstName} onChange={v => setContact(p => ({ ...p, firstName: v }))} placeholder="John" />
                          <Input label="Last Name *" value={contact.lastName} onChange={v => setContact(p => ({ ...p, lastName: v }))} placeholder="Doe" />
                          <Input label="Email *" value={contact.email} onChange={v => setContact(p => ({ ...p, email: v }))} placeholder="john@example.com" type="email" />
                          <Input label="Phone *" value={contact.phone} onChange={v => setContact(p => ({ ...p, phone: v }))} placeholder="(469) 555-0123" type="tel" />
                          <div className="sm:col-span-2">
                            <Input label="Service Address *" value={contact.address} onChange={v => setContact(p => ({ ...p, address: v }))} placeholder="123 Main St, Dallas, TX" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-[#0C1829] mb-1.5">Special Instructions (optional)</label>
                            <textarea value={contact.notes} onChange={e => setContact(p => ({ ...p, notes: e.target.value }))} rows={3}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
                              placeholder="Gate code, pet info, focus areas..." />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 7: Confirm ── */}
                    {step === 7 && price && (
                      <div>
                        <StepHeader icon={Check} title="Review & Confirm" subtitle="Review your booking details before confirming" />
                        <div className="space-y-4">
                          <div className="bg-[#FAFAF8] rounded-xl p-5 space-y-3">
                            <Row label="Location" value={`${zipMatch?.city}, ${zipMatch?.state} ${zipCode}`} />
                            <Row label="Home" value={`${bedrooms} bed / ${bathrooms} bath / ${sqftMin}–${sqftMax} sqft`} />
                            <Row label="Frequency" value={freqLabel(frequency)} />
                            <Row label="Date & Time" value={`${selectedDate} at ${selectedTime}`} />
                            <Row label="Customer" value={`${contact.firstName} ${contact.lastName}`} />
                            <Row label="Address" value={contact.address} />
                          </div>
                          <div className="bg-[#0C1829] rounded-xl p-5 space-y-2">
                            <PriceRow label="Base Price" value={fmt(price.basePrice)} />
                            {price.discAmt > 0 && (
                              <PriceRow label={`${freqLabel(frequency)} Discount (${price.discPct}%)`} value={`-${fmt(price.discAmt)}`} accent />
                            )}
                            {price.extras.map(e => (
                              <PriceRow key={e.name} label={e.name} value={`+${fmt(e.price)}`} />
                            ))}
                            <PriceRow label={`Tax (${(price.taxRate * 100).toFixed(1)}%)`} value={fmt(price.tax)} />
                            <hr className="border-white/10" />
                            <div className="flex justify-between">
                              <span className="text-white font-bold">Total</span>
                              <span className="text-2xl font-bold text-[#0D9488]">{fmt(price.total)}</span>
                            </div>
                          </div>
                          <button className="w-full py-4 bg-[#0D9488] text-white font-bold rounded-xl hover:bg-[#0B8278] transition-all shadow-lg shadow-[#0D9488]/25 flex items-center justify-center gap-2 text-lg">
                            <CreditCard size={20} /> Proceed to Payment
                          </button>
                          <p className="text-center text-xs text-gray-400">
                            You&apos;ll be asked to create a password after payment to access your customer portal.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Nav Buttons ── */}
                    {step < 7 && (
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                        <button onClick={prev} disabled={step === 1}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            step === 1 ? "opacity-0 pointer-events-none" : "text-[#0C1829] hover:bg-gray-50"
                          }`}>
                          <ArrowLeft size={16} /> Back
                        </button>
                        <button onClick={next} disabled={!canProceed()}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                            canProceed()
                              ? "bg-[#0D9488] text-white hover:bg-[#0B8278] shadow-lg shadow-[#0D9488]/25"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}>
                          Continue <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── SIDEBAR ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                {/* Live Price */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0C1829] mb-4 flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <Sparkles size={14} className="text-[#0D9488]" /> Your Quote
                  </h3>
                  {price ? (
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Base Price</span><span className="font-semibold">{fmt(price.basePrice)}</span></div>
                      {price.discAmt > 0 && (
                        <div className="flex justify-between text-sm"><span className="text-[#0D9488]">Discount ({price.discPct}%)</span><span className="text-[#0D9488] font-semibold">-{fmt(price.discAmt)}</span></div>
                      )}
                      {price.extras.map(e => (
                        <div key={e.name} className="flex justify-between text-sm"><span className="text-gray-500">{e.name}</span><span className="font-semibold">+{fmt(e.price)}</span></div>
                      ))}
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-semibold">{fmt(price.tax)}</span></div>
                      <hr className="border-gray-100" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[#0C1829]">Total</span>
                        <span className="text-2xl font-bold text-[#0D9488]">{fmt(price.total)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">Select your home details to see pricing</p>
                    </div>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <ul className="space-y-3">
                    {["100% Satisfaction Guarantee", "Bonded & Insured Team", "Background-Checked Cleaners", "No Hidden Fees", "Eco-Friendly Products"].map(item => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-[#0C1829]">
                        <CheckCircle size={15} className="text-[#0D9488] flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call CTA */}
                <div className="bg-gradient-to-br from-[#0D9488] to-[#0B8278] rounded-2xl p-5 text-center">
                  <p className="text-white font-bold text-sm mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Prefer to Call?</p>
                  <a href={`tel:${BRAND.phoneRaw}`} className="inline-flex items-center gap-2 text-white text-lg font-bold">
                    <Phone size={18} /> {BRAND.phone}
                  </a>
                  <p className="text-white/60 text-xs mt-1.5">Mon–Sat 7AM–7PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              How It <span className="text-[#0D9488]">Works</span>
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Booking your professional cleaning is simple.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { s: "01", title: "Book Online", desc: "Choose your service, select a date and time. Takes less than 2 minutes.", icon: Calendar },
              { s: "02", title: "We Clean", desc: "Our vetted, insured team arrives on time with all supplies and equipment.", icon: Sparkles },
              { s: "03", title: "You Relax", desc: "Come home to a spotless space. Not satisfied? We re-clean free within 24 hours.", icon: Star },
            ].map((item, i) => (
              <div key={item.s} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-5 relative">
                  <item.icon size={28} className="text-[#0D9488]" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#C9A84C] text-white text-xs font-bold rounded-full flex items-center justify-center">{item.s}</span>
                </div>
                <h3 className="text-lg font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function StepHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
        <Icon size={20} className="text-[#0D9488]" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0C1829] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        placeholder={placeholder} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#0C1829]">{value}</span>
    </div>
  );
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={accent ? "text-[#0D9488]" : "text-white/60"}>{label}</span>
      <span className={accent ? "text-[#0D9488]" : "text-white"}>{value}</span>
    </div>
  );
}
