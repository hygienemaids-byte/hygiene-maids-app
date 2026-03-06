"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND, IMAGES } from "@/lib/constants";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import {
  Phone, Shield, Star, Clock, CheckCircle, Sparkles,
  ArrowRight, ArrowLeft, Calendar, MapPin, Home, Bed,
  Bath, Ruler, Repeat, Plus, CreditCard, User,
  Check, AlertCircle, ChevronDown, Info, Zap, Award,
  Heart, Lock, Leaf,
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

const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

const FREQ_ORDER = ["weekly", "biweekly", "monthly", "one_time"];

const FREQ_META: Record<string, { label: string; desc: string; badge?: string }> = {
  weekly: { label: "Weekly", desc: "Best value — always come home to a clean house", badge: "BEST VALUE" },
  biweekly: { label: "Biweekly", desc: "Most popular — great balance of clean & savings", badge: "MOST POPULAR" },
  monthly: { label: "Monthly", desc: "Light maintenance between deep cleans" },
  one_time: { label: "One-Time", desc: "Perfect for a one-time deep clean or move-in/out" },
};

const EXTRA_ICONS: Record<string, string> = {
  "Inside Oven": "🍳", "Inside Fridge": "🧊", "Inside Cabinets": "🗄️",
  "Laundry (Wash & Fold)": "👕", "Inside Windows": "🪟", "Baseboards": "🧹",
  "Wall Cleaning": "🏠", "Garage Sweep": "🚗", "Patio/Balcony": "🌿",
  "Pet Hair Treatment": "🐾", "Green Cleaning Upgrade": "🌱", "Organizing (per room)": "📦",
  "Dishes": "🍽️", "Blinds Cleaning": "🪟",
};

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Format bathroom count: 2.5 → "2½", 3 → "3" */
function fmtBath(n: number): string {
  if (n % 1 === 0.5) return `${Math.floor(n)}½`;
  return String(n);
}

/** Format sqft range label */
function fmtSqft(min: number, max: number): string {
  if (min === 0) return `Under ${max + 1} sq ft`;
  if (max >= 9999) return `${min.toLocaleString()}+ sq ft`;
  return `${min.toLocaleString()} – ${max.toLocaleString()} sq ft`;
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function BookingWizard({ data }: { data: PricingData }) {
  const { pricingMatrix, frequencyDiscounts, extras, serviceAreas, taxRate } = data;

  // ── State ──
  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [sqftKey, setSqftKey] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("biweekly");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [contact, setContact] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "", notes: "",
  });

  // ═══════════════════════════════════════════════════════════════════
  // DYNAMIC CASCADING FILTERS — derived from actual Supabase data
  // ═══════════════════════════════════════════════════════════════════

  /** All unique bedroom values from the pricing matrix */
  const bedroomOptions = useMemo(() => {
    const set = new Set(pricingMatrix.map(m => m.bedrooms));
    return Array.from(set).sort((a, b) => a - b);
  }, [pricingMatrix]);

  /** Valid bathroom values for the selected bedroom count */
  const bathroomOptions = useMemo(() => {
    if (bedrooms === null) return [];
    const set = new Set(pricingMatrix.filter(m => m.bedrooms === bedrooms).map(m => m.bathrooms));
    return Array.from(set).sort((a, b) => a - b);
  }, [pricingMatrix, bedrooms]);

  /** Valid sqft ranges for the selected bedroom + bathroom combo */
  const sqftOptions = useMemo(() => {
    if (bedrooms === null || bathrooms === null) return [];
    return pricingMatrix
      .filter(m => m.bedrooms === bedrooms && m.bathrooms === bathrooms)
      .sort((a, b) => a.sqft_min - b.sqft_min)
      .map(m => ({ key: `${m.sqft_min}-${m.sqft_max}`, min: m.sqft_min, max: m.sqft_max, label: fmtSqft(m.sqft_min, m.sqft_max) }));
  }, [pricingMatrix, bedrooms, bathrooms]);

  // ── Auto-reset downstream when upstream changes ──
  useEffect(() => {
    if (bedrooms === null) return;
    // Check if current bathroom is still valid
    const validBaths = pricingMatrix.filter(m => m.bedrooms === bedrooms).map(m => m.bathrooms);
    if (bathrooms !== null && !validBaths.includes(bathrooms)) {
      setBathrooms(null);
      setSqftKey(null);
    }
  }, [bedrooms, pricingMatrix]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bedrooms === null || bathrooms === null) { setSqftKey(null); return; }
    const validSqft = pricingMatrix
      .filter(m => m.bedrooms === bedrooms && m.bathrooms === bathrooms)
      .map(m => `${m.sqft_min}-${m.sqft_max}`);
    if (sqftKey !== null && !validSqft.includes(sqftKey)) {
      setSqftKey(null);
    }
    // Auto-select if only one option
    if (validSqft.length === 1 && sqftKey === null) {
      setSqftKey(validSqft[0]);
    }
  }, [bedrooms, bathrooms, pricingMatrix]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-select defaults on mount ──
  useEffect(() => {
    if (bedroomOptions.length > 0 && bedrooms === null) {
      const defaultBed = bedroomOptions.includes(2) ? 2 : bedroomOptions[0];
      setBedrooms(defaultBed);
      // Find default bath for this bedroom
      const baths = pricingMatrix.filter(m => m.bedrooms === defaultBed).map(m => m.bathrooms);
      const uniqueBaths = Array.from(new Set(baths)).sort((a, b) => a - b);
      const defaultBath = uniqueBaths.includes(2) ? 2 : uniqueBaths[0];
      setBathrooms(defaultBath);
      // Find default sqft
      const sqfts = pricingMatrix.filter(m => m.bedrooms === defaultBed && m.bathrooms === defaultBath);
      if (sqfts.length > 0) {
        const mid = sqfts[Math.floor(sqfts.length / 2)];
        setSqftKey(`${mid.sqft_min}-${mid.sqft_max}`);
      }
    }
  }, [bedroomOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Parse sqftKey into min/max ──
  const sqftMin = sqftKey ? Number(sqftKey.split("-")[0]) : null;
  const sqftMax = sqftKey ? Number(sqftKey.split("-")[1]) : null;

  // ── Zip validation ──
  const zipMatch = useMemo(() => {
    if (zipCode.length < 5) return null;
    return serviceAreas.find(a => a.zip_code === zipCode) || null;
  }, [zipCode, serviceAreas]);

  // ── Price calculation ──
  const price = useMemo(() => {
    if (bedrooms === null || bathrooms === null || sqftMin === null || sqftMax === null) return null;
    const entry = pricingMatrix.find(
      m => m.bedrooms === bedrooms && m.bathrooms === bathrooms &&
           m.sqft_min === sqftMin && m.sqft_max === sqftMax
    );
    if (!entry) return null;

    const basePrice = Number(entry.base_price);
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

  // ── Sorted frequency discounts ──
  const sortedFrequencies = useMemo(() => {
    return [...frequencyDiscounts].sort((a, b) => {
      const ai = FREQ_ORDER.indexOf(a.frequency);
      const bi = FREQ_ORDER.indexOf(b.frequency);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [frequencyDiscounts]);

  // ── Available dates (next 14 days, no Sundays) ──
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 1; i <= 21 && dates.length < 14; i++) {
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
      case 6: return !!(contact.firstName && contact.lastName && contact.email && contact.phone && contact.address);
      default: return true;
    }
  };

  const next = () => { if (canProceed() && step < 7) setStep(step + 1); };
  const prev = () => { if (step > 1) setStep(step - 1); };

  // ── Frequency label helper ──
  const freqLabel = (f: string) => FREQ_META[f]?.label || f;

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFB] to-[#F0F4F3]">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-[#0C1829]">
        <div className="absolute inset-0 opacity-10">
          <img src={IMAGES.luxuryHero} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C1829]/80 via-[#0C1829]/95 to-[#0C1829]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0D9488]/15 border border-[#0D9488]/20 rounded-full mb-5">
              <Sparkles size={13} className="text-[#0D9488]" />
              <span className="text-xs font-semibold text-[#0D9488] tracking-wider uppercase">Instant Online Booking</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Book Your <span className="text-[#0D9488]">Professional Cleaning</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-white/50 leading-relaxed max-w-xl mx-auto">
              Get an instant quote in under 2 minutes. No obligations, no hidden fees.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Breadcrumbs items={[{ label: "Book Now" }]} />
      </div>

      {/* ═══ STEP INDICATOR ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                    s.id === step ? "scale-110" : s.id < step ? "cursor-pointer hover:scale-105" : "opacity-35"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    s.id === step
                      ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/30"
                      : s.id < step
                        ? "bg-[#0D9488]/15 text-[#0D9488]"
                        : "bg-gray-50 text-gray-300"
                  }`}>
                    {s.id < step ? <Check size={18} strokeWidth={3} /> : <s.icon size={17} />}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wide hidden sm:block uppercase ${
                    s.id === step ? "text-[#0D9488]" : s.id < step ? "text-[#0C1829]/70" : "text-gray-300"
                  }`}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="w-6 sm:w-12 h-[3px] mx-1 sm:mx-2 rounded-full transition-all duration-500 overflow-hidden bg-gray-100">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      s.id < step ? "w-full bg-gradient-to-r from-[#0D9488] to-[#0D9488]/70" : "w-0"
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Progress text */}
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Step {step} of {STEPS.length}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#0D9488] to-[#0D9488]/70 rounded-full"
                  initial={false}
                  animate={{ width: `${(step / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-bold text-[#0D9488]">{Math.round((step / STEPS.length) * 100)}%</span>
            </div>
          </div>
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
                  initial={{ opacity: 0, x: 30, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100/80 shadow-sm">

                    {/* ── STEP 1: Location ── */}
                    {step === 1 && (
                      <div>
                        <StepHeader icon={MapPin} title="Where do you need cleaning?" subtitle="Enter your zip code to check service availability in the DFW metroplex" step={1} />
                        <div className="max-w-md">
                          <label className="block text-sm font-bold text-[#0C1829] mb-2">Your Zip Code</label>
                          <div className="relative">
                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                              type="text" maxLength={5}
                              value={zipCode}
                              onChange={e => setZipCode(e.target.value.replace(/\D/g, ""))}
                              placeholder="e.g. 75201"
                              className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-gray-100 text-lg font-bold text-[#0C1829] placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 transition-all"
                            />
                          </div>
                          <AnimatePresence>
                            {zipCode.length === 5 && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className={`mt-3 flex items-center gap-2.5 p-3 rounded-xl text-sm font-medium ${
                                  zipMatch
                                    ? "bg-[#0D9488]/8 text-[#0D9488] border border-[#0D9488]/15"
                                    : "bg-red-50 text-red-600 border border-red-100"
                                }`}
                              >
                                {zipMatch ? (
                                  <><CheckCircle size={18} /> <span>Great news! We serve <strong>{zipMatch.city}, {zipMatch.state}</strong></span></>
                                ) : (
                                  <><AlertCircle size={18} /> <span>Sorry, we don&apos;t serve this area yet. <Link href="/contact" className="underline">Contact us</Link> for availability.</span></>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Service area hint */}
                          <div className="mt-6 p-4 bg-[#FAFAF8] rounded-xl border border-gray-100">
                            <div className="flex items-start gap-3">
                              <Info size={16} className="text-[#C9A84C] mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-[#0C1829] mb-1">We serve the entire DFW Metroplex</p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  Dallas, Fort Worth, Plano, Frisco, McKinney, Arlington, Irving, Richardson, Garland, Carrollton, and more.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: Home Details (Dynamic Cascading) ── */}
                    {step === 2 && (
                      <div>
                        <StepHeader icon={Home} title="Tell us about your home" subtitle="Select your home size — options update automatically based on available pricing" step={2} />

                        <div className="space-y-6">
                          {/* Bedrooms */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-[#0C1829] mb-3">
                              <Bed size={15} className="text-[#0D9488]" /> Bedrooms
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {bedroomOptions.map(n => (
                                <button key={n} onClick={() => setBedrooms(n)}
                                  className={`min-w-[56px] py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    bedrooms === n
                                      ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25 scale-105"
                                      : "bg-gray-50 text-[#0C1829] hover:bg-gray-100 border border-gray-100"
                                  }`}>
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Bathrooms — only show valid options for selected bedrooms */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-[#0C1829] mb-3">
                              <Bath size={15} className="text-[#0D9488]" /> Bathrooms
                              {bathroomOptions.length === 0 && bedrooms !== null && (
                                <span className="text-xs font-normal text-gray-400 ml-1">Select bedrooms first</span>
                              )}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {bathroomOptions.map(n => (
                                <button key={n} onClick={() => setBathrooms(n)}
                                  className={`min-w-[56px] py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    bathrooms === n
                                      ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25 scale-105"
                                      : "bg-gray-50 text-[#0C1829] hover:bg-gray-100 border border-gray-100"
                                  }`}>
                                  {fmtBath(n)}
                                </button>
                              ))}
                              {bathroomOptions.length === 0 && (
                                <div className="text-sm text-gray-400 italic py-3">Select bedrooms above to see bathroom options</div>
                              )}
                            </div>
                          </div>

                          {/* Square Footage — only show valid options for selected bed+bath */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-[#0C1829] mb-3">
                              <Ruler size={15} className="text-[#0D9488]" /> Square Footage
                            </label>
                            {sqftOptions.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {sqftOptions.map(opt => (
                                  <button key={opt.key} onClick={() => setSqftKey(opt.key)}
                                    className={`py-3 px-4 rounded-xl text-sm font-semibold text-left transition-all duration-200 ${
                                      sqftKey === opt.key
                                        ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25"
                                        : "bg-gray-50 text-[#0C1829] hover:bg-gray-100 border border-gray-100"
                                    }`}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic py-3">
                                {bathrooms === null ? "Select bathrooms above to see size options" : "No sizes available for this combination"}
                              </div>
                            )}
                          </div>

                          {/* Price preview for this step */}
                          {price && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0D9488]/5 to-transparent rounded-xl border border-[#0D9488]/10"
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-[#0D9488]" />
                                <span className="text-sm font-semibold text-[#0C1829]">
                                  {bedrooms} bed / {fmtBath(bathrooms!)} bath — Est. {price.hours} hours
                                </span>
                              </div>
                              <span className="text-lg font-bold text-[#0D9488]">{fmt(price.basePrice)}</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 3: Frequency ── */}
                    {step === 3 && (
                      <div>
                        <StepHeader icon={Repeat} title="How often do you need cleaning?" subtitle="Recurring service saves you money — cancel anytime" step={3} />
                        <div className="grid sm:grid-cols-2 gap-4">
                          {sortedFrequencies.map(fd => {
                            const meta = FREQ_META[fd.frequency];
                            const isSelected = frequency === fd.frequency;
                            const discPct = Number(fd.discount_percentage);
                            return (
                              <button key={fd.id} onClick={() => setFrequency(fd.frequency)}
                                className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 group ${
                                  isSelected
                                    ? "border-[#0D9488] bg-gradient-to-br from-[#0D9488]/5 to-[#0D9488]/0 shadow-lg shadow-[#0D9488]/10"
                                    : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                }`}>
                                {/* Badge */}
                                {meta?.badge && (
                                  <span className={`absolute -top-2.5 right-4 px-3 py-0.5 text-[10px] font-bold rounded-full shadow-sm ${
                                    meta.badge === "MOST POPULAR"
                                      ? "bg-[#C9A84C] text-white"
                                      : "bg-[#0D9488] text-white"
                                  }`}>
                                    {meta.badge}
                                  </span>
                                )}
                                {/* Check indicator */}
                                <div className={`absolute top-4 left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected ? "border-[#0D9488] bg-[#0D9488]" : "border-gray-200"
                                }`}>
                                  {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                </div>
                                <div className="pl-8">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                      {meta?.label || fd.frequency}
                                    </span>
                                    {discPct > 0 && (
                                      <span className="px-2 py-0.5 bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-bold rounded-md">
                                        Save {discPct}%
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                    {meta?.desc || ""}
                                  </p>
                                  {/* Show calculated price if available */}
                                  {price && (
                                    <div className="mt-2 text-sm font-bold text-[#0D9488]">
                                      {discPct > 0
                                        ? `${fmt(round2(price.basePrice - price.basePrice * discPct / 100))}/visit`
                                        : `${fmt(price.basePrice)}/visit`
                                      }
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 4: Extras ── */}
                    {step === 4 && (
                      <div>
                        <StepHeader icon={Plus} title="Customize with extras" subtitle="Add-ons to make your cleaning even more thorough (all optional)" step={4} />
                        <div className="grid sm:grid-cols-2 gap-3">
                          {extras.map(extra => {
                            const isSel = selectedExtras.includes(extra.id);
                            const icon = EXTRA_ICONS[extra.name] || "✨";
                            return (
                              <motion.button
                                key={extra.id}
                                onClick={() => toggleExtra(extra.id)}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3.5 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                  isSel
                                    ? "border-[#0D9488] bg-[#0D9488]/5 shadow-md shadow-[#0D9488]/10"
                                    : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-all ${
                                  isSel ? "bg-[#0D9488] shadow-lg shadow-[#0D9488]/25" : "bg-gray-50"
                                }`}>
                                  {isSel ? <Check size={18} className="text-white" /> : <span>{icon}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold text-[#0C1829]">{extra.name}</div>
                                  <div className="text-[11px] text-gray-400 truncate mt-0.5">{extra.description}</div>
                                </div>
                                <span className={`text-sm font-bold flex-shrink-0 ${isSel ? "text-[#0D9488]" : "text-gray-400"}`}>
                                  +{fmt(Number(extra.price))}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                        {selectedExtras.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center justify-between p-3 bg-[#0D9488]/5 rounded-xl border border-[#0D9488]/10"
                          >
                            <span className="text-sm text-[#0C1829] font-medium">{selectedExtras.length} extra{selectedExtras.length > 1 ? "s" : ""} selected</span>
                            <span className="text-sm font-bold text-[#0D9488]">
                              +{fmt(extras.filter(e => selectedExtras.includes(e.id)).reduce((s, e) => s + Number(e.price), 0))}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* ── STEP 5: Date & Time ── */}
                    {step === 5 && (
                      <div>
                        <StepHeader icon={Calendar} title="Pick your preferred date & time" subtitle="Choose when you'd like us to arrive" step={5} />
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-bold text-[#0C1829] mb-3">Select Date</label>
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                              {availableDates.map(d => {
                                const ds = d.toISOString().split("T")[0];
                                const isToday = ds === new Date(Date.now() + 86400000).toISOString().split("T")[0];
                                return (
                                  <button key={ds} onClick={() => setSelectedDate(ds)}
                                    className={`p-2.5 rounded-xl text-center transition-all duration-200 ${
                                      selectedDate === ds
                                        ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25 scale-105"
                                        : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                                    }`}>
                                    <div className={`text-[10px] font-bold uppercase ${selectedDate === ds ? "text-white/70" : "text-gray-400"}`}>
                                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                                    </div>
                                    <div className="text-lg font-bold mt-0.5">{d.getDate()}</div>
                                    <div className={`text-[10px] ${selectedDate === ds ? "text-white/70" : "text-gray-400"}`}>
                                      {d.toLocaleDateString("en-US", { month: "short" })}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <AnimatePresence>
                            {selectedDate && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <label className="block text-sm font-bold text-[#0C1829] mb-3">Select Time</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {TIME_SLOTS.map(t => (
                                    <button key={t} onClick={() => setSelectedTime(t)}
                                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                                        selectedTime === t
                                          ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25"
                                          : "bg-gray-50 hover:bg-gray-100 text-[#0C1829] border border-gray-100"
                                      }`}>{t}</button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 6: Contact ── */}
                    {step === 6 && (
                      <div>
                        <StepHeader icon={User} title="Your contact details" subtitle="We'll send your booking confirmation here" step={6} />
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormInput label="First Name" value={contact.firstName} onChange={v => setContact(p => ({ ...p, firstName: v }))} placeholder="John" required />
                          <FormInput label="Last Name" value={contact.lastName} onChange={v => setContact(p => ({ ...p, lastName: v }))} placeholder="Doe" required />
                          <FormInput label="Email" value={contact.email} onChange={v => setContact(p => ({ ...p, email: v }))} placeholder="john@example.com" type="email" required />
                          <FormInput label="Phone" value={contact.phone} onChange={v => setContact(p => ({ ...p, phone: v }))} placeholder="(469) 555-0123" type="tel" required />
                          <div className="sm:col-span-2">
                            <FormInput label="Service Address" value={contact.address} onChange={v => setContact(p => ({ ...p, address: v }))} placeholder="123 Main St, Dallas, TX 75201" required />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-bold text-[#0C1829] mb-2">Special Instructions <span className="font-normal text-gray-400">(optional)</span></label>
                            <textarea value={contact.notes} onChange={e => setContact(p => ({ ...p, notes: e.target.value }))} rows={3}
                              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 resize-none transition-all placeholder:text-gray-300"
                              placeholder="Gate code, pet info, focus areas, allergies..." />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                          <Lock size={12} /> Your information is encrypted and never shared with third parties.
                        </div>
                      </div>
                    )}

                    {/* ── STEP 7: Confirm ── */}
                    {step === 7 && price && (
                      <div>
                        <StepHeader icon={Check} title="Review & Confirm Your Booking" subtitle="Double-check everything before we lock in your appointment" step={7} />
                        <div className="space-y-5">
                          {/* Summary cards */}
                          <div className="grid sm:grid-cols-2 gap-3">
                            <SummaryCard icon={MapPin} label="Location" value={`${zipMatch?.city}, ${zipMatch?.state} ${zipCode}`} />
                            <SummaryCard icon={Home} label="Home Size" value={`${bedrooms} bed / ${fmtBath(bathrooms!)} bath`} />
                            <SummaryCard icon={Ruler} label="Square Feet" value={sqftKey ? fmtSqft(sqftMin!, sqftMax!) : ""} />
                            <SummaryCard icon={Repeat} label="Frequency" value={freqLabel(frequency)} />
                            <SummaryCard icon={Calendar} label="Date & Time" value={`${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${selectedTime}`} />
                            <SummaryCard icon={User} label="Customer" value={`${contact.firstName} ${contact.lastName}`} />
                          </div>

                          {/* Price breakdown */}
                          <div className="bg-gradient-to-br from-[#0C1829] to-[#162A45] rounded-2xl p-6 space-y-3">
                            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Price Breakdown</h3>
                            <PriceRow label="Base Price" value={fmt(price.basePrice)} />
                            {price.discAmt > 0 && (
                              <PriceRow label={`${freqLabel(frequency)} Discount (${price.discPct}%)`} value={`-${fmt(price.discAmt)}`} accent />
                            )}
                            {price.extras.map(e => (
                              <PriceRow key={e.name} label={e.name} value={`+${fmt(e.price)}`} />
                            ))}
                            <PriceRow label={`Tax (${(price.taxRate * 100).toFixed(1)}%)`} value={fmt(price.tax)} />
                            <hr className="border-white/10 my-2" />
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-white font-bold text-lg">Total Due</span>
                              <span className="text-3xl font-black text-[#0D9488]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</span>
                            </div>
                            {price.hours > 0 && (
                              <p className="text-white/30 text-xs mt-1">Estimated cleaning time: {price.hours} hours</p>
                            )}
                          </div>

                          {/* CTA */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-4.5 bg-gradient-to-r from-[#0D9488] to-[#0B7C72] text-white font-bold rounded-xl hover:shadow-xl hover:shadow-[#0D9488]/25 transition-all flex items-center justify-center gap-2.5 text-lg"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            <CreditCard size={20} /> Confirm & Proceed to Payment
                          </motion.button>
                          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Lock size={11} /> Secure Payment</span>
                            <span className="flex items-center gap-1"><Shield size={11} /> 100% Guarantee</span>
                            <span className="flex items-center gap-1"><Leaf size={11} /> Eco-Friendly</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Nav Buttons ── */}
                    {step < 7 && (
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-50">
                        <button onClick={prev} disabled={step === 1}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                            step === 1 ? "opacity-0 pointer-events-none" : "text-[#0C1829] hover:bg-gray-50"
                          }`}>
                          <ArrowLeft size={16} /> Back
                        </button>
                        <motion.button
                          onClick={next}
                          disabled={!canProceed()}
                          whileHover={canProceed() ? { scale: 1.02 } : {}}
                          whileTap={canProceed() ? { scale: 0.98 } : {}}
                          className={`flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all ${
                            canProceed()
                              ? "bg-gradient-to-r from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25 hover:shadow-xl"
                              : "bg-gray-100 text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          Continue <ArrowRight size={16} />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── SIDEBAR ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-5">
                {/* Live Price */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm">
                  <h3 className="text-xs font-bold text-[#0C1829]/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles size={13} className="text-[#C9A84C]" /> Your Quote
                  </h3>
                  {price ? (
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Base Price</span>
                        <span className="font-bold text-[#0C1829]">{fmt(price.basePrice)}</span>
                      </div>
                      {price.discAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0D9488] font-medium">Discount ({price.discPct}%)</span>
                          <span className="text-[#0D9488] font-bold">-{fmt(price.discAmt)}</span>
                        </div>
                      )}
                      {price.extras.map(e => (
                        <div key={e.name} className="flex justify-between text-sm">
                          <span className="text-gray-500">{e.name}</span>
                          <span className="font-semibold">+{fmt(e.price)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax ({(price.taxRate * 100).toFixed(1)}%)</span>
                        <span className="font-semibold">{fmt(price.tax)}</span>
                      </div>
                      <hr className="border-gray-100 my-1" />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-bold text-[#0C1829]">Total</span>
                        <span className="text-2xl font-black text-[#0D9488]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</span>
                      </div>
                      {price.hours > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                          <Clock size={11} /> Est. {price.hours} hours
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                        <Home size={20} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">Select your home details<br />to see your quote</p>
                    </div>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100/80">
                  <ul className="space-y-3">
                    {[
                      { icon: Shield, text: "100% Satisfaction Guarantee" },
                      { icon: Award, text: "Bonded & Insured Team" },
                      { icon: CheckCircle, text: "Background-Checked Cleaners" },
                      { icon: Zap, text: "No Hidden Fees" },
                      { icon: Leaf, text: "Eco-Friendly Products" },
                    ].map(item => (
                      <li key={item.text} className="flex items-center gap-2.5 text-sm text-[#0C1829]">
                        <item.icon size={14} className="text-[#0D9488] flex-shrink-0" />
                        <span className="font-medium">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call CTA */}
                <div className="bg-gradient-to-br from-[#0D9488] to-[#0B7C72] rounded-2xl p-5 text-center shadow-lg shadow-[#0D9488]/15">
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Prefer to Call?</p>
                  <a href={`tel:${BRAND.phoneRaw}`} className="inline-flex items-center gap-2 text-white text-xl font-black" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <Phone size={18} /> {BRAND.phone}
                  </a>
                  <p className="text-white/40 text-xs mt-2">Mon–Sat 7AM–7PM</p>
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
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">Booking your professional cleaning is simple.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              { s: "01", title: "Book Online", desc: "Choose your service, select a date and time. Takes less than 2 minutes.", icon: Calendar },
              { s: "02", title: "We Clean", desc: "Our vetted, insured team arrives on time with all supplies and equipment.", icon: Sparkles },
              { s: "03", title: "You Relax", desc: "Come home to a spotless space. Not satisfied? We re-clean free within 24 hours.", icon: Heart },
            ].map(item => (
              <div key={item.s} className="text-center group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0D9488]/8 flex items-center justify-center mb-5 relative group-hover:bg-[#0D9488]/15 transition-all">
                  <item.icon size={26} className="text-[#0D9488]" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-[#C9A84C] to-[#B8923E] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">{item.s}</span>
                </div>
                <h3 className="text-lg font-bold text-[#0C1829] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
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

function StepHeader({ icon: Icon, title, subtitle, step }: { icon: React.ElementType; title: string; subtitle: string; step: number }) {
  return (
    <div className="flex items-start gap-3.5 mb-7">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0D9488]/15 to-[#0D9488]/5 flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-[#0D9488]" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#0C1829] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-[#0C1829] mb-2">
        {label} {required && <span className="text-[#0D9488]">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-medium focus:outline-none focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 transition-all placeholder:text-gray-300"
        placeholder={placeholder} />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-[#FAFAF8] rounded-xl border border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-[#0D9488]" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-bold text-[#0C1829] truncate">{value}</div>
      </div>
    </div>
  );
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={accent ? "text-[#0D9488] font-medium" : "text-white/50"}>{label}</span>
      <span className={accent ? "text-[#0D9488] font-bold" : "text-white font-semibold"}>{value}</span>
    </div>
  );
}
