"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND } from "@/lib/constants";
import {
  Phone, Shield, Star, Clock, CheckCircle, Sparkles,
  Calendar, MapPin, Home, Bed, Bath, Ruler, Repeat, Plus,
  CreditCard, User, Check, AlertCircle, ChevronDown, Zap,
  Award, Lock, Leaf, Loader2, PartyPopper, Mail,
  PawPrint, Key, Building, ArrowDown,
} from "lucide-react";
import {
  type PricingData, type TimeSlot, type ContactInfo, type ServiceArea,
  FREQ_ORDER, FREQ_META, EXTRA_ICONS,
  fmt, round2, fmtBath, fmtSqft, formatPhone,
  calculatePrice, getAvailableDates, getFallbackTimeSlots,
  validateContact, buildBookingPayload,
} from "@/lib/booking-utils";

/* ═══════════════════════════════════════════════════════════════════
   CUSTOMER BOOKING FORM — Single-page, pre-populated, compact
   ═══════════════════════════════════════════════════════════════════ */

export default function CustomerBookingForm({ data }: { data: PricingData }) {
  const { pricingMatrix, frequencyDiscounts, extras, serviceAreas, taxRate } = data;

  // ── Loading & Auth ──
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);

  // ── Core Booking State ──
  const [zipCode, setZipCode] = useState("");
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [sqftKey, setSqftKey] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("biweekly");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [contact, setContact] = useState<ContactInfo>({
    firstName: "", lastName: "", email: "", phone: "",
    addressLine1: "", addressLine2: "", notes: "",
  });
  const [hasPets, setHasPets] = useState(false);
  const [petDetails, setPetDetails] = useState("");
  const [accessInstructions, setAccessInstructions] = useState("");

  // ── Availability ──
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ── Submission ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<{
    bookingNumber: number; bookingId: string; status: string;
    providerAssigned: boolean; message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Section collapse (all open by default) ──
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    home: true, frequency: true, extras: false, schedule: true, contact: true, notes: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ═══════════════════════════════════════════════════════════════════
  // PREFILL from logged-in customer
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function prefill() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) { setLoading(false); return; }

      // Fetch customer record
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
        .single();

      if (customer && !cancelled) {
        setCustomerData(customer);
        setContact({
          firstName: customer.first_name || "",
          lastName: customer.last_name || "",
          email: customer.email || user.email || "",
          phone: customer.phone ? formatPhone(customer.phone) : "",
          addressLine1: customer.address_line1 || "",
          addressLine2: customer.address_line2 || "",
          notes: "",
        });
        if (customer.zip_code) setZipCode(customer.zip_code);
      } else if (user.email && !cancelled) {
        // Fallback: use profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profile && !cancelled) {
          setContact(prev => ({
            ...prev,
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            email: user.email || "",
          }));
        }
      }

      if (!cancelled) setLoading(false);
    }

    prefill();
    return () => { cancelled = true; };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // CASCADING FILTERS
  // ═══════════════════════════════════════════════════════════════════

  const bedroomOptions = useMemo(() => {
    const set = new Set(pricingMatrix.map(m => m.bedrooms));
    return Array.from(set).sort((a, b) => a - b);
  }, [pricingMatrix]);

  const bathroomOptions = useMemo(() => {
    if (bedrooms === null) return [];
    const set = new Set(pricingMatrix.filter(m => m.bedrooms === bedrooms).map(m => m.bathrooms));
    return Array.from(set).sort((a, b) => a - b);
  }, [pricingMatrix, bedrooms]);

  const sqftOptions = useMemo(() => {
    if (bedrooms === null || bathrooms === null) return [];
    return pricingMatrix
      .filter(m => m.bedrooms === bedrooms && m.bathrooms === bathrooms)
      .sort((a, b) => a.sqft_min - b.sqft_min)
      .map(m => ({ key: `${m.sqft_min}-${m.sqft_max}`, min: m.sqft_min, max: m.sqft_max, label: fmtSqft(m.sqft_min, m.sqft_max) }));
  }, [pricingMatrix, bedrooms, bathrooms]);

  // Auto-reset downstream
  useEffect(() => {
    if (bedrooms === null) return;
    const validBaths = pricingMatrix.filter(m => m.bedrooms === bedrooms).map(m => m.bathrooms);
    if (bathrooms !== null && !validBaths.includes(bathrooms)) {
      setBathrooms(null); setSqftKey(null);
    }
  }, [bedrooms, pricingMatrix]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bedrooms === null || bathrooms === null) { setSqftKey(null); return; }
    const validSqft = pricingMatrix
      .filter(m => m.bedrooms === bedrooms && m.bathrooms === bathrooms)
      .map(m => `${m.sqft_min}-${m.sqft_max}`);
    if (sqftKey !== null && !validSqft.includes(sqftKey)) setSqftKey(null);
    if (validSqft.length === 1 && sqftKey === null) setSqftKey(validSqft[0]);
  }, [bedrooms, bathrooms, pricingMatrix]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select defaults
  useEffect(() => {
    if (bedroomOptions.length > 0 && bedrooms === null) {
      const defaultBed = bedroomOptions.includes(1) ? 1 : bedroomOptions[0];
      setBedrooms(defaultBed);
      const baths = pricingMatrix.filter(m => m.bedrooms === defaultBed).map(m => m.bathrooms);
      const uniqueBaths = Array.from(new Set(baths)).sort((a, b) => a - b);
      const defaultBath = uniqueBaths.includes(1) ? 1 : uniqueBaths[0];
      setBathrooms(defaultBath);
      const sqfts = pricingMatrix.filter(m => m.bedrooms === defaultBed && m.bathrooms === defaultBath);
      const preferred = sqfts.find(m => m.sqft_min === 500 && m.sqft_max === 999);
      if (preferred) setSqftKey(`${preferred.sqft_min}-${preferred.sqft_max}`);
      else if (sqfts.length > 0) setSqftKey(`${sqfts[0].sqft_min}-${sqfts[0].sqft_max}`);
    }
  }, [bedroomOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const sqftMin = sqftKey ? Number(sqftKey.split("-")[0]) : null;
  const sqftMax = sqftKey ? Number(sqftKey.split("-")[1]) : null;

  const zipMatch = useMemo(() => {
    if (zipCode.length < 5) return null;
    return serviceAreas.find(a => a.zip_code === zipCode) || null;
  }, [zipCode, serviceAreas]);

  // ═══════════════════════════════════════════════════════════════════
  // PRICING
  // ═══════════════════════════════════════════════════════════════════

  const price = useMemo(() => {
    return calculatePrice(pricingMatrix, frequencyDiscounts, extras, taxRate,
      bedrooms, bathrooms, sqftMin, sqftMax, frequency, selectedExtras);
  }, [bedrooms, bathrooms, sqftMin, sqftMax, frequency, selectedExtras, pricingMatrix, frequencyDiscounts, extras, taxRate]);

  const sortedFrequencies = useMemo(() => {
    return [...frequencyDiscounts].sort((a, b) => {
      const ai = FREQ_ORDER.indexOf(a.frequency);
      const bi = FREQ_ORDER.indexOf(b.frequency);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [frequencyDiscounts]);

  const availableDates = useMemo(() => getAvailableDates(), []);

  // ═══════════════════════════════════════════════════════════════════
  // TIME SLOTS
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!selectedDate) { setTimeSlots([]); return; }
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedTime("");

    fetch(`/api/bookings?mode=availability&date=${selectedDate}`)
      .then(r => r.json())
      .then(data => { if (!cancelled && data.slots) setTimeSlots(data.slots); })
      .catch(() => { if (!cancelled) setTimeSlots(getFallbackTimeSlots()); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });

    return () => { cancelled = true; };
  }, [selectedDate]);

  // ═══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const updateContact = (field: string, value: string) => {
    setContact(p => ({ ...p, [field]: value }));
    setFieldErrors(p => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async () => {
    if (!price || isSubmitting) return;
    const errs = validateContact(contact);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    if (!selectedDate || !selectedTime) { setSubmitError("Please select a date and time"); return; }
    if (!zipMatch) { setSubmitError("Please enter a valid zip code"); return; }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildBookingPayload(
        contact, zipMatch, zipCode, bedrooms, bathrooms, sqftKey,
        frequency, selectedExtras, selectedDate, selectedTime,
        hasPets, petDetails, accessInstructions, price
      );
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.details?.join(", ") || "Failed to create booking");
      setBookingConfirmed({
        bookingNumber: result.booking.bookingNumber,
        bookingId: result.booking.id,
        status: result.booking.status,
        providerAssigned: result.booking.providerAssigned,
        message: result.message,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const freqLabel = (f: string) => FREQ_META[f]?.label || f;

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Loading your details...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONFIRMED STATE
  // ═══════════════════════════════════════════════════════════════════

  if (bookingConfirmed) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Success Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25"
            >
              <PartyPopper size={28} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Booking Confirmed!
            </h2>
            <p className="text-sm text-slate-500 mt-1">{bookingConfirmed.message}</p>
          </div>

          {/* Booking Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 text-center">
              <p className="text-xs text-white/70 font-medium mb-1">Booking Number</p>
              <p className="text-2xl font-black text-white tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                HM-{bookingConfirmed.bookingNumber}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full">
                <div className={`w-2 h-2 rounded-full ${bookingConfirmed.status === "confirmed" ? "bg-green-400" : "bg-yellow-400"}`} />
                <span className="text-xs font-bold text-white uppercase">
                  {bookingConfirmed.status === "confirmed" ? "Confirmed" : "Pending Assignment"}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={Calendar} label="Date" value={selectedDate ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""} />
                <InfoCard icon={Clock} label="Time" value={timeSlots.find(s => s.time === selectedTime)?.label || selectedTime} />
                <InfoCard icon={Home} label="Home" value={`${bedrooms} bed / ${fmtBath(bathrooms!)} bath`} />
                <InfoCard icon={Repeat} label="Frequency" value={freqLabel(frequency)} />
              </div>

              {price && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-xl font-black text-teal-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/customer/bookings" className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold rounded-xl text-center text-sm hover:shadow-lg transition-all">
                  View My Bookings
                </Link>
                <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-center text-sm hover:bg-slate-200 transition-all">
                  Book Another
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAIN FORM — Single Page
  // ═══════════════════════════════════════════════════════════════════

  const isReady = price !== null && selectedDate && selectedTime && zipMatch &&
    contact.firstName && contact.lastName && contact.email && contact.phone && contact.addressLine1;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Book a Cleaning
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {customerData ? `Welcome back, ${customerData.first_name || contact.firstName}` : "Complete the form below to schedule your cleaning"}
          </p>
        </div>
        {price && (
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Estimated Total</p>
            <p className="text-2xl font-black text-teal-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── LEFT: Form ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* SECTION: Location */}
          <FormSection title="Service Location" icon={MapPin} defaultOpen>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Street Address *</label>
                <input
                  type="text"
                  value={contact.addressLine1}
                  onChange={e => updateContact("addressLine1", e.target.value)}
                  placeholder="123 Main Street"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium focus:outline-none transition-all ${
                    fieldErrors.addressLine1 ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  }`}
                />
                {fieldErrors.addressLine1 && <p className="mt-1 text-xs text-red-500">{fieldErrors.addressLine1}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Apt / Suite</label>
                <input
                  type="text"
                  value={contact.addressLine2}
                  onChange={e => updateContact("addressLine2", e.target.value)}
                  placeholder="Apt 4B"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Zip Code *</label>
                <input
                  type="text"
                  maxLength={5}
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="75201"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all"
                />
                {zipCode.length === 5 && !zipMatch && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> We don&apos;t serve this area yet</p>
                )}
                {zipMatch && (
                  <p className="mt-1 text-xs text-teal-600 flex items-center gap-1"><CheckCircle size={11} /> {zipMatch.city}, {zipMatch.state}</p>
                )}
              </div>
            </div>
          </FormSection>

          {/* SECTION: Home Details */}
          <FormSection title="Home Details" icon={Home} defaultOpen>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                  <Bed size={12} /> Bedrooms
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {bedroomOptions.map(n => (
                    <button key={n} onClick={() => setBedrooms(n)}
                      className={`min-w-[44px] py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        bedrooms === n
                          ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                  <Bath size={12} /> Bathrooms
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {bathroomOptions.map(n => (
                    <button key={n} onClick={() => setBathrooms(n)}
                      className={`min-w-[44px] py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        bathrooms === n
                          ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}>
                      {fmtBath(n)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                  <Ruler size={12} /> Square Footage
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {sqftOptions.map(opt => (
                    <button key={opt.key} onClick={() => setSqftKey(opt.key)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        sqftKey === opt.key
                          ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          {/* SECTION: Frequency */}
          <FormSection title="Cleaning Frequency" icon={Repeat} defaultOpen>
            <div className="grid grid-cols-2 gap-2">
              {sortedFrequencies.map(fd => {
                const meta = FREQ_META[fd.frequency];
                const isSelected = frequency === fd.frequency;
                const discPct = Number(fd.discount_percentage);
                return (
                  <button key={fd.id} onClick={() => setFrequency(fd.frequency)}
                    className={`relative p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}>
                    {meta?.badge && (
                      <span className={`absolute -top-2 right-3 px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        meta.badge === "MOST POPULAR" ? "bg-amber-500 text-white" : "bg-teal-600 text-white"
                      }`}>{meta.badge}</span>
                    )}
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-teal-600 bg-teal-600" : "border-slate-300"
                      }`}>
                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{meta?.label || fd.frequency}</span>
                      {discPct > 0 && (
                        <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-bold rounded">
                          -{discPct}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-6">{meta?.desc || ""}</p>
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* SECTION: Extras */}
          <FormSection title={`Add-Ons ${selectedExtras.length > 0 ? `(${selectedExtras.length})` : ""}`} icon={Plus} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              {extras.map(extra => {
                const isSel = selectedExtras.includes(extra.id);
                const icon = EXTRA_ICONS[extra.name] || "✨";
                return (
                  <button key={extra.id} onClick={() => toggleExtra(extra.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                      isSel ? "border-teal-500 bg-teal-50/50" : "border-slate-200 hover:border-slate-300"
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                      isSel ? "bg-teal-600 text-white" : "bg-slate-50"
                    }`}>
                      {isSel ? <Check size={14} className="text-white" /> : <span>{icon}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{extra.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{extra.description}</div>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${isSel ? "text-teal-600" : "text-slate-400"}`}>
                      +{fmt(Number(extra.price))}
                    </span>
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* SECTION: Schedule */}
          <FormSection title="Date & Time" icon={Calendar} defaultOpen>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Select Date</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {availableDates.map(d => {
                    const ds = d.toISOString().split("T")[0];
                    return (
                      <button key={ds} onClick={() => setSelectedDate(ds)}
                        className={`p-2 rounded-lg text-center transition-all ${
                          selectedDate === ds
                            ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                            : "bg-slate-50 hover:bg-slate-100 border border-slate-200"
                        }`}>
                        <div className={`text-[9px] font-bold uppercase ${selectedDate === ds ? "text-white/70" : "text-slate-400"}`}>
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className="text-sm font-bold mt-0.5">{d.getDate()}</div>
                        <div className={`text-[9px] ${selectedDate === ds ? "text-white/70" : "text-slate-400"}`}>
                          {d.toLocaleDateString("en-US", { month: "short" })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">
                    Select Time {loadingSlots && <Loader2 size={12} className="inline-block ml-1 animate-spin text-teal-600" />}
                  </label>
                  {loadingSlots ? (
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-slate-50 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5">
                      {timeSlots.map(slot => (
                        <button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            selectedTime === slot.time
                              ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                              : slot.available
                                ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                          }`}>
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormSection>

          {/* SECTION: Contact (pre-populated) */}
          <FormSection title="Contact Details" icon={User} defaultOpen>
            <div className="grid sm:grid-cols-2 gap-3">
              <CompactInput label="First Name *" value={contact.firstName} onChange={v => updateContact("firstName", v)} error={fieldErrors.firstName} />
              <CompactInput label="Last Name *" value={contact.lastName} onChange={v => updateContact("lastName", v)} error={fieldErrors.lastName} />
              <CompactInput label="Email *" value={contact.email} onChange={v => updateContact("email", v)} type="email" error={fieldErrors.email} />
              <CompactInput label="Phone *" value={contact.phone} onChange={v => updateContact("phone", formatPhone(v))} type="tel" error={fieldErrors.phone} />
            </div>
          </FormSection>

          {/* SECTION: Notes & Pets */}
          <FormSection title="Additional Details" icon={Key} defaultOpen={false}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <PawPrint size={14} className="text-teal-600" />
                  <span className="text-xs font-bold text-slate-700">Pets in home?</span>
                </div>
                <button onClick={() => setHasPets(!hasPets)}
                  className={`relative w-10 h-6 rounded-full transition-all ${hasPets ? "bg-teal-600" : "bg-slate-200"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${hasPets ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </div>
              {hasPets && (
                <input type="text" value={petDetails} onChange={e => setPetDetails(e.target.value)}
                  placeholder="e.g. 2 dogs (friendly), 1 cat"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all"
                />
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Access Instructions</label>
                <input type="text" value={accessInstructions} onChange={e => setAccessInstructions(e.target.value)}
                  placeholder="Gate code, key location, etc."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Special Instructions</label>
                <textarea value={contact.notes} onChange={e => setContact(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Focus areas, allergies, specific requests..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 resize-none transition-all"
                />
              </div>
            </div>
          </FormSection>
        </div>

        {/* ── RIGHT: Sticky Summary ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Price Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Sparkles size={11} className="text-amber-500" /> Booking Summary
              </h3>
              {price ? (
                <div className="space-y-2">
                  <SummaryRow label="Base Price" value={fmt(price.basePrice)} />
                  {price.discAmt > 0 && (
                    <SummaryRow label={`${freqLabel(frequency)} (-${price.discPct}%)`} value={`-${fmt(price.discAmt)}`} accent />
                  )}
                  {price.extras.map(e => (
                    <SummaryRow key={e.name} label={e.name} value={`+${fmt(e.price)}`} />
                  ))}
                  <SummaryRow label={`Tax (${(price.taxRate * 100).toFixed(1)}%)`} value={fmt(price.tax)} />
                  <hr className="border-slate-100 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Total</span>
                    <span className="text-xl font-black text-teal-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</span>
                  </div>
                  {price.hours > 0 && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> Est. {price.hours} hours</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Home size={20} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">Select home details to see pricing</p>
                </div>
              )}
            </div>

            {/* Selected Details */}
            {(selectedDate || zipMatch) && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Details</h4>
                <div className="space-y-2">
                  {zipMatch && (
                    <DetailRow icon={MapPin} text={`${contact.addressLine1 || "Address"}, ${zipMatch.city}, ${zipMatch.state}`} />
                  )}
                  {selectedDate && (
                    <DetailRow icon={Calendar} text={new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} />
                  )}
                  {selectedTime && (
                    <DetailRow icon={Clock} text={timeSlots.find(s => s.time === selectedTime)?.label || selectedTime} />
                  )}
                  <DetailRow icon={Repeat} text={freqLabel(frequency)} />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!isReady || isSubmitting}
              whileHover={isReady && !isSubmitting ? { scale: 1.01 } : {}}
              whileTap={isReady && !isSubmitting ? { scale: 0.99 } : {}}
              className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                isReady && !isSubmitting
                  ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-600/25 hover:shadow-xl"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle size={16} /> Confirm Booking</>
              )}
            </motion.button>

            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Trust */}
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { icon: Shield, text: "Guaranteed" },
                { icon: Lock, text: "Secure" },
                { icon: Leaf, text: "Eco-Friendly" },
              ].map(item => (
                <span key={item.text} className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <item.icon size={10} className="text-teal-600" /> {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function FormSection({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <Icon size={14} className="text-teal-600" />
          </div>
          <span className="text-sm font-bold text-slate-900">{title}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompactInput({ label, value, onChange, type = "text", error }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium focus:outline-none transition-all ${
          error ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className={accent ? "text-teal-600 font-medium" : "text-slate-500"}>{label}</span>
      <span className={accent ? "text-teal-600 font-bold" : "text-slate-700 font-semibold"}>{value}</span>
    </div>
  );
}

function DetailRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={12} className="text-teal-600 flex-shrink-0" />
      <span className="text-xs text-slate-600 truncate">{text}</span>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-lg">
      <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
        <Icon size={12} className="text-teal-600" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-xs font-bold text-slate-900 truncate">{value}</div>
      </div>
    </div>
  );
}
