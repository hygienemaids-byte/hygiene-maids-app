"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND } from "@/lib/constants";
import {
  Phone, Shield, Clock, CheckCircle, Sparkles,
  Calendar, MapPin, Home, Bed, Bath, Ruler, Repeat, Plus,
  CreditCard, User, Check, AlertCircle, Search,
  Loader2, PartyPopper, Mail, PawPrint, Key, Building,
  UserPlus, Users, ChevronRight, X, Hash,
} from "lucide-react";
import {
  type PricingData, type TimeSlot, type ContactInfo, type ServiceArea,
  FREQ_ORDER, FREQ_META, EXTRA_ICONS,
  fmt, round2, fmtBath, fmtSqft, formatPhone,
  calculatePrice, getAvailableDates, getFallbackTimeSlots,
  validateContact, buildBookingPayload,
} from "@/lib/booking-utils";

/* ═══════════════════════════════════════════════════════════════════
   ADMIN BOOKING FORM — Split-screen, BookingKoala-style
   Left: Booking form  |  Right: Customer details + Summary
   ═══════════════════════════════════════════════════════════════════ */

export default function AdminBookingForm({ data }: { data: PricingData }) {
  const { pricingMatrix, frequencyDiscounts, extras, serviceAreas, taxRate } = data;

  // ── Customer Mode ──
  const [customerMode, setCustomerMode] = useState<"new" | "existing">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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

  // ═══════════════════════════════════════════════════════════════════
  // CUSTOMER SEARCH
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (customerMode !== "existing" || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: customers } = await supabase
          .from("customers")
          .select("*")
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
          .limit(8);
        if (!cancelled) setSearchResults(customers || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery, customerMode]);

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setContact({
      firstName: customer.first_name || "",
      lastName: customer.last_name || "",
      email: customer.email || "",
      phone: customer.phone ? formatPhone(customer.phone) : "",
      addressLine1: customer.address_line1 || "",
      addressLine2: customer.address_line2 || "",
      notes: "",
    });
    if (customer.zip_code) setZipCode(customer.zip_code);
    setSearchQuery("");
    setSearchResults([]);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setContact({ firstName: "", lastName: "", email: "", phone: "", addressLine1: "", addressLine2: "", notes: "" });
    setZipCode("");
  };

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

  useEffect(() => {
    if (bedrooms === null) return;
    const validBaths = pricingMatrix.filter(m => m.bedrooms === bedrooms).map(m => m.bathrooms);
    if (bathrooms !== null && !validBaths.includes(bathrooms)) { setBathrooms(null); setSqftKey(null); }
  }, [bedrooms, pricingMatrix]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bedrooms === null || bathrooms === null) { setSqftKey(null); return; }
    const validSqft = pricingMatrix
      .filter(m => m.bedrooms === bedrooms && m.bathrooms === bathrooms)
      .map(m => `${m.sqft_min}-${m.sqft_max}`);
    if (sqftKey !== null && !validSqft.includes(sqftKey)) setSqftKey(null);
    if (validSqft.length === 1 && sqftKey === null) setSqftKey(validSqft[0]);
  }, [bedrooms, bathrooms, pricingMatrix]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const freqLabel = (f: string) => FREQ_META[f]?.label || f;

  const isReady = price !== null && selectedDate && selectedTime && zipMatch &&
    contact.firstName && contact.lastName && contact.email && contact.phone && contact.addressLine1;

  // ═══════════════════════════════════════════════════════════════════
  // CONFIRMED STATE
  // ═══════════════════════════════════════════════════════════════════

  if (bookingConfirmed) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Booking Created</h2>
            <p className="text-sm text-slate-500 mt-1">HM-{bookingConfirmed.bookingNumber}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400 text-xs block">Customer</span><span className="font-bold text-slate-900">{contact.firstName} {contact.lastName}</span></div>
              <div><span className="text-slate-400 text-xs block">Email</span><span className="font-bold text-slate-900">{contact.email}</span></div>
              <div><span className="text-slate-400 text-xs block">Date</span><span className="font-bold text-slate-900">{selectedDate ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span></div>
              <div><span className="text-slate-400 text-xs block">Time</span><span className="font-bold text-slate-900">{timeSlots.find(s => s.time === selectedTime)?.label || selectedTime}</span></div>
              <div><span className="text-slate-400 text-xs block">Home</span><span className="font-bold text-slate-900">{bedrooms} bed / {fmtBath(bathrooms!)} bath</span></div>
              <div><span className="text-slate-400 text-xs block">Total</span><span className="font-bold text-teal-600">{price ? fmt(price.total) : ""}</span></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/admin/bookings" className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-lg text-center text-sm hover:bg-slate-800 transition-all">
                View All Bookings
              </Link>
              <button onClick={() => window.location.reload()} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-center text-sm hover:bg-slate-200 transition-all">
                Create Another
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAIN LAYOUT — Split Screen
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Create Booking
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Admin booking — create on behalf of a customer</p>
        </div>
        <Link href="/admin/bookings" className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
          <X size={14} /> Cancel
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ═══ LEFT PANEL: Booking Form (3/5) ═══ */}
        <div className="lg:col-span-3 space-y-4">

          {/* Customer Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users size={12} /> Customer
            </h3>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setCustomerMode("existing"); clearCustomer(); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  customerMode === "existing" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                }`}>
                <Search size={12} /> Existing Customer
              </button>
              <button onClick={() => { setCustomerMode("new"); clearCustomer(); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  customerMode === "new" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                }`}>
                <UserPlus size={12} /> New Customer
              </button>
            </div>

            {/* Existing Customer Search */}
            {customerMode === "existing" && !selectedCustomer && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all"
                />
                {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-600" />}

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{c.first_name} {c.last_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{c.email} {c.phone ? `· ${c.phone}` : ""}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300" />
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg p-4 text-center">
                    <p className="text-xs text-slate-400">No customers found</p>
                    <button onClick={() => { setCustomerMode("new"); setSearchQuery(""); }}
                      className="mt-2 text-xs text-teal-600 font-bold hover:underline">
                      Create new customer instead
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Selected Customer Badge */}
            {selectedCustomer && (
              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                    <p className="text-[11px] text-slate-500">{selectedCustomer.email}</p>
                  </div>
                </div>
                <button onClick={clearCustomer} className="p-1.5 hover:bg-teal-100 rounded-lg transition-colors">
                  <X size={14} className="text-slate-500" />
                </button>
              </div>
            )}

            {/* New Customer / Editable Fields */}
            {(customerMode === "new" || selectedCustomer) && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <AdminInput label="First Name *" value={contact.firstName} onChange={v => updateContact("firstName", v)} error={fieldErrors.firstName} />
                <AdminInput label="Last Name *" value={contact.lastName} onChange={v => updateContact("lastName", v)} error={fieldErrors.lastName} />
                <AdminInput label="Email *" value={contact.email} onChange={v => updateContact("email", v)} type="email" error={fieldErrors.email} />
                <AdminInput label="Phone *" value={contact.phone} onChange={v => updateContact("phone", formatPhone(v))} type="tel" error={fieldErrors.phone} />
              </div>
            )}
          </div>

          {/* Service Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin size={12} /> Service Address
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <AdminInput label="Street Address *" value={contact.addressLine1} onChange={v => updateContact("addressLine1", v)} error={fieldErrors.addressLine1} />
              </div>
              <AdminInput label="Apt / Suite" value={contact.addressLine2} onChange={v => updateContact("addressLine2", v)} />
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Zip Code *</label>
                <input type="text" maxLength={5} value={zipCode} onChange={e => setZipCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all"
                />
                {zipCode.length === 5 && (
                  <p className={`mt-1 text-[10px] flex items-center gap-1 ${zipMatch ? "text-teal-600" : "text-red-500"}`}>
                    {zipMatch ? <><CheckCircle size={10} /> {zipMatch.city}, {zipMatch.state}</> : <><AlertCircle size={10} /> Not in service area</>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Home Details + Frequency (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Home size={12} /> Home Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Bed size={10} /> Bedrooms</label>
                  <div className="flex flex-wrap gap-1">
                    {bedroomOptions.map(n => (
                      <button key={n} onClick={() => setBedrooms(n)}
                        className={`min-w-[36px] py-1.5 px-2.5 rounded text-xs font-bold transition-all ${
                          bedrooms === n ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Bath size={10} /> Bathrooms</label>
                  <div className="flex flex-wrap gap-1">
                    {bathroomOptions.map(n => (
                      <button key={n} onClick={() => setBathrooms(n)}
                        className={`min-w-[36px] py-1.5 px-2.5 rounded text-xs font-bold transition-all ${
                          bathrooms === n ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}>{fmtBath(n)}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Ruler size={10} /> Sq Ft</label>
                  <div className="flex flex-wrap gap-1">
                    {sqftOptions.map(opt => (
                      <button key={opt.key} onClick={() => setSqftKey(opt.key)}
                        className={`py-1.5 px-2.5 rounded text-[10px] font-bold transition-all ${
                          sqftKey === opt.key ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Repeat size={12} /> Frequency
              </h3>
              <div className="space-y-1.5">
                {sortedFrequencies.map(fd => {
                  const meta = FREQ_META[fd.frequency];
                  const isSelected = frequency === fd.frequency;
                  const discPct = Number(fd.discount_percentage);
                  return (
                    <button key={fd.id} onClick={() => setFrequency(fd.frequency)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                        isSelected ? "border-teal-500 bg-teal-50/50" : "border-slate-100 hover:border-slate-200"
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-teal-600 bg-teal-600" : "border-slate-300"
                        }`}>
                          {isSelected && <Check size={8} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{meta?.label || fd.frequency}</span>
                      </div>
                      {discPct > 0 && <span className="text-[10px] font-bold text-teal-600">-{discPct}%</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Extras */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus size={12} /> Add-Ons {selectedExtras.length > 0 && <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-[10px]">{selectedExtras.length}</span>}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {extras.map(extra => {
                const isSel = selectedExtras.includes(extra.id);
                const icon = EXTRA_ICONS[extra.name] || "✨";
                return (
                  <button key={extra.id} onClick={() => toggleExtra(extra.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      isSel ? "border-teal-500 bg-teal-50/50" : "border-slate-100 hover:border-slate-200"
                    }`}>
                    <span className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                      isSel ? "bg-teal-600 text-white" : "bg-slate-50"
                    }`}>
                      {isSel ? <Check size={12} /> : <span className="text-sm">{icon}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 truncate">{extra.name}</div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">+{fmt(Number(extra.price))}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar size={12} /> Schedule
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-2 block">Date</label>
                <div className="grid grid-cols-7 gap-1">
                  {availableDates.map(d => {
                    const ds = d.toISOString().split("T")[0];
                    return (
                      <button key={ds} onClick={() => setSelectedDate(ds)}
                        className={`p-1.5 rounded-lg text-center transition-all ${
                          selectedDate === ds ? "bg-slate-900 text-white" : "bg-slate-50 hover:bg-slate-100 border border-slate-100"
                        }`}>
                        <div className={`text-[8px] font-bold uppercase ${selectedDate === ds ? "text-white/70" : "text-slate-400"}`}>
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className="text-sm font-bold">{d.getDate()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedDate && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-2 block">
                    Time {loadingSlots && <Loader2 size={10} className="inline-block ml-1 animate-spin text-teal-600" />}
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {loadingSlots ? (
                      Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-8 rounded bg-slate-50 animate-pulse" />)
                    ) : (
                      timeSlots.map(slot => (
                        <button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`py-2 px-1 rounded text-[11px] font-bold transition-all ${
                            selectedTime === slot.time ? "bg-slate-900 text-white"
                              : slot.available ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100"
                              : "bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                          }`}>{slot.label}</button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Key size={12} /> Additional Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 col-span-2">
                <div className="flex items-center gap-2">
                  <PawPrint size={12} className="text-teal-600" />
                  <span className="text-xs font-bold text-slate-700">Pets?</span>
                </div>
                <button onClick={() => setHasPets(!hasPets)}
                  className={`relative w-9 h-5 rounded-full transition-all ${hasPets ? "bg-teal-600" : "bg-slate-200"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${hasPets ? "left-[16px]" : "left-0.5"}`} />
                </button>
              </div>
              {hasPets && (
                <div className="col-span-2">
                  <AdminInput label="Pet Details" value={petDetails} onChange={v => setPetDetails(v)} placeholder="e.g. 2 dogs, 1 cat" />
                </div>
              )}
              <AdminInput label="Access Instructions" value={accessInstructions} onChange={v => setAccessInstructions(v)} placeholder="Gate code, key, etc." />
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Notes</label>
                <textarea value={contact.notes} onChange={e => setContact(p => ({ ...p, notes: e.target.value }))}
                  rows={1} placeholder="Special requests..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 resize-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL: Summary (2/5) ═══ */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-4">

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-5 py-4">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={11} /> Price Breakdown
                </h3>
              </div>
              <div className="p-5">
                {price ? (
                  <div className="space-y-2.5">
                    <PriceRow label="Base Price" value={fmt(price.basePrice)} />
                    {price.discAmt > 0 && (
                      <PriceRow label={`${freqLabel(frequency)} Discount (${price.discPct}%)`} value={`-${fmt(price.discAmt)}`} accent />
                    )}
                    {price.extras.map(e => (
                      <PriceRow key={e.name} label={e.name} value={`+${fmt(e.price)}`} />
                    ))}
                    <PriceRow label={`Tax (${(price.taxRate * 100).toFixed(1)}%)`} value={fmt(price.tax)} />
                    <hr className="border-slate-100 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-black text-teal-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</span>
                    </div>
                    {price.hours > 0 && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> Est. {price.hours} hours</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Home size={20} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400">Select home details to see pricing</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Booking Summary</h3>
              <div className="space-y-2.5">
                {contact.firstName && (
                  <SummaryItem icon={User} label="Customer" value={`${contact.firstName} ${contact.lastName}`} />
                )}
                {contact.email && (
                  <SummaryItem icon={Mail} label="Email" value={contact.email} />
                )}
                {contact.addressLine1 && (
                  <SummaryItem icon={MapPin} label="Address" value={`${contact.addressLine1}${zipMatch ? `, ${zipMatch.city}` : ""}`} />
                )}
                {bedrooms !== null && (
                  <SummaryItem icon={Home} label="Home" value={`${bedrooms} bed / ${fmtBath(bathrooms!)} bath`} />
                )}
                <SummaryItem icon={Repeat} label="Frequency" value={freqLabel(frequency)} />
                {selectedDate && (
                  <SummaryItem icon={Calendar} label="Date" value={new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} />
                )}
                {selectedTime && (
                  <SummaryItem icon={Clock} label="Time" value={timeSlots.find(s => s.time === selectedTime)?.label || selectedTime} />
                )}
                {selectedExtras.length > 0 && (
                  <SummaryItem icon={Plus} label="Extras" value={`${selectedExtras.length} selected`} />
                )}
              </div>
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={!isReady || isSubmitting}
              whileHover={isReady && !isSubmitting ? { scale: 1.01 } : {}}
              whileTap={isReady && !isSubmitting ? { scale: 0.99 } : {}}
              className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                isReady && !isSubmitting
                  ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Creating Booking...</>
              ) : (
                <><CheckCircle size={16} /> Create Booking</>
              )}
            </motion.button>

            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function AdminInput({ label, value, onChange, type = "text", error, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; error?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm font-medium focus:outline-none transition-all ${
          error ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
        }`}
      />
      {error && <p className="mt-0.5 text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className={accent ? "text-teal-600 font-medium" : "text-slate-500"}>{label}</span>
      <span className={accent ? "text-teal-600 font-bold" : "text-slate-700 font-semibold"}>{value}</span>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={12} className="text-slate-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-slate-400">{label}: </span>
        <span className="text-xs font-semibold text-slate-700">{value}</span>
      </div>
    </div>
  );
}
