"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND, IMAGES } from "@/lib/constants";
import Breadcrumbs from "@/components/website/Breadcrumbs";
import {
  Phone, Shield, Star, Clock, CheckCircle, Sparkles,
  ArrowRight, ArrowLeft, Calendar, MapPin, Home, Bed,
  Bath, Ruler, Repeat, Plus, CreditCard, User,
  Check, AlertCircle, ChevronDown, Info, Zap, Award,
  Heart, Lock, Leaf, Loader2, PartyPopper, Mail,
  PawPrint, Key, Building, Hash,
  // Extra icons for add-ons
  Flame, Refrigerator, DoorOpen, Shirt, AppWindow,
  PaintBucket, Warehouse, Car, TreePine, Dog, Recycle,
  Package, UtensilsCrossed, Blinds,
  // Calendar
  ChevronLeft, ChevronRight, X,
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

interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
  remaining: number;
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

const FREQ_ORDER = ["weekly", "biweekly", "monthly", "one_time"];

const FREQ_META: Record<string, { label: string; desc: string; badge?: string }> = {
  weekly: { label: "Weekly", desc: "Best value — always come home to a clean house", badge: "BEST VALUE" },
  biweekly: { label: "Biweekly", desc: "Most popular — great balance of clean & savings", badge: "MOST POPULAR" },
  monthly: { label: "Monthly", desc: "Light maintenance between deep cleans" },
  one_time: { label: "One-Time", desc: "Perfect for a one-time deep clean or move-in/out" },
};

const EXTRA_ICON_MAP: Record<string, React.ElementType> = {
  "Inside Oven": Flame,
  "Inside Fridge": Refrigerator,
  "Inside Cabinets": DoorOpen,
  "Laundry (Wash & Fold)": Shirt,
  "Inside Windows": AppWindow,
  "Baseboards": PaintBucket,
  "Wall Cleaning": PaintBucket,
  "Garage Sweep": Car,
  "Patio/Balcony": TreePine,
  "Pet Hair Treatment": Dog,
  "Green Cleaning Upgrade": Recycle,
  "Organizing (per room)": Package,
  "Dishes": UtensilsCrossed,
  "Blinds Cleaning": Blinds,
};

// Keep emoji fallback for confirmation summary
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

/** Format phone number as (xxx) xxx-xxxx */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function BookingWizard({ data, embedded = false }: { data: PricingData; embedded?: boolean }) {
  const { pricingMatrix, frequencyDiscounts, extras, serviceAreas, taxRate } = data;
  const router = useRouter();
  const searchParams = useSearchParams();
  const rebookId = searchParams.get("rebook");

  // ── Auth & Prefill State ──
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [prefillLoaded, setPrefillLoaded] = useState(false);

  // ── Core State ──
  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [sqftKey, setSqftKey] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("biweekly");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // ── Structured Contact ──
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    notes: "",
  });

  // ── Pets & Access ──
  const [hasPets, setHasPets] = useState(false);
  const [petDetails, setPetDetails] = useState("");
  const [accessInstructions, setAccessInstructions] = useState("");

  // ── Availability ──
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // ── Submission ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<{
    bookingNumber: number;
    bookingId: string;
    status: string;
    providerAssigned: boolean;
    message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Account creation after booking ──
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // ═══════════════════════════════════════════════════════════════════
  // PREFILL: Logged-in user + Rebook
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function prefill() {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email || "");

        // Fetch customer profile for prefill
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
          .single();

        if (customer && !cancelled) {
          setContact(prev => ({
            ...prev,
            firstName: customer.first_name || prev.firstName,
            lastName: customer.last_name || prev.lastName,
            email: customer.email || user.email || prev.email,
            phone: customer.phone ? formatPhone(customer.phone) : prev.phone,
            addressLine1: customer.address_line1 || prev.addressLine1,
            addressLine2: customer.address_line2 || prev.addressLine2,
          }));
          if (customer.zip_code) setZipCode(customer.zip_code);
        } else if (user.email && !cancelled) {
          setContact(prev => ({ ...prev, email: user.email || prev.email }));
        }
      }

      // Rebook: fetch old booking and prefill
      if (rebookId) {
        const { data: oldBooking } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", rebookId)
          .single();

        if (oldBooking && !cancelled) {
          if (oldBooking.zip_code) setZipCode(oldBooking.zip_code);
          if (oldBooking.bedrooms) setBedrooms(oldBooking.bedrooms);
          if (oldBooking.bathrooms) setBathrooms(oldBooking.bathrooms);
          if (oldBooking.sqft_range) setSqftKey(oldBooking.sqft_range);
          if (oldBooking.frequency) setFrequency(oldBooking.frequency);
          if (oldBooking.has_pets) { setHasPets(true); setPetDetails(oldBooking.pet_details || ""); }
          if (oldBooking.access_instructions) setAccessInstructions(oldBooking.access_instructions);
          if (oldBooking.customer_notes) setContact(prev => ({ ...prev, notes: oldBooking.customer_notes }));

          // Prefill contact from booking if not already set by logged-in user
          if (!user) {
            const { data: cust } = await supabase
              .from("customers")
              .select("*")
              .eq("id", oldBooking.customer_id)
              .single();
            if (cust && !cancelled) {
              setContact(prev => ({
                ...prev,
                firstName: cust.first_name || prev.firstName,
                lastName: cust.last_name || prev.lastName,
                email: cust.email || prev.email,
                phone: cust.phone ? formatPhone(cust.phone) : prev.phone,
                addressLine1: oldBooking.address_line1 || cust.address_line1 || prev.addressLine1,
                addressLine2: oldBooking.address_line2 || cust.address_line2 || prev.addressLine2,
              }));
            }
          } else {
            setContact(prev => ({
              ...prev,
              addressLine1: oldBooking.address_line1 || prev.addressLine1,
              addressLine2: oldBooking.address_line2 || prev.addressLine2,
            }));
          }
        }
      }

      if (!cancelled) setPrefillLoaded(true);
    }

    prefill();
    return () => { cancelled = true; };
  }, [rebookId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════════════
  // ACCOUNT CREATION (after booking, for new customers)
  // ═══════════════════════════════════════════════════════════════════

  const handleCreateAccount = async () => {
    if (!createPassword || createPassword.length < 6) return;
    setCreatingAccount(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: contact.email.trim().toLowerCase(),
        password: createPassword,
        options: {
          data: {
            first_name: contact.firstName,
            last_name: contact.lastName,
            role: "customer",
          },
        },
      });
      if (error) throw error;
      setAccountCreated(true);
    } catch (err: any) {
      if (err.message?.includes("already registered")) {
        setAccountCreated(true); // They already have an account
      }
    } finally {
      setCreatingAccount(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // DYNAMIC CASCADING FILTERS
  // ═══════════════════════════════════════════════════════════════════

  // Fixed 1-6 options for both bedrooms and bathrooms (independent)
  const bedroomOptions = [1, 2, 3, 4, 5, 6];
  const bathroomOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];

  const sqftOptions = useMemo(() => {
    if (bedrooms === null || bathrooms === null) return [];
    return pricingMatrix
      .filter(m => m.bedrooms === bedrooms && m.bathrooms === bathrooms)
      .sort((a, b) => a.sqft_min - b.sqft_min)
      .map(m => ({ key: `${m.sqft_min}-${m.sqft_max}`, min: m.sqft_min, max: m.sqft_max, label: fmtSqft(m.sqft_min, m.sqft_max) }));
  }, [pricingMatrix, bedrooms, bathrooms]);

  // Auto-reset sqft when bed/bath changes
  useEffect(() => {
    if (bedrooms === null || bathrooms === null) { setSqftKey(null); return; }
    const validSqft = pricingMatrix
      .filter(m => m.bedrooms === bedrooms && m.bathrooms === bathrooms)
      .map(m => `${m.sqft_min}-${m.sqft_max}`);
    if (sqftKey !== null && !validSqft.includes(sqftKey)) setSqftKey(null);
    if (validSqft.length === 1 && sqftKey === null) setSqftKey(validSqft[0]);
  }, [bedrooms, bathrooms, pricingMatrix]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select defaults: 2bed / 2bath / first sqft
  useEffect(() => {
    if (bedrooms === null) {
      setBedrooms(2);
      setBathrooms(2);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse sqftKey
  const sqftMin = sqftKey ? Number(sqftKey.split("-")[0]) : null;
  const sqftMax = sqftKey ? Number(sqftKey.split("-")[1]) : null;

  // Zip validation
  const zipMatch = useMemo(() => {
    if (zipCode.length < 5) return null;
    return serviceAreas.find(a => a.zip_code === zipCode) || null;
  }, [zipCode, serviceAreas]);

  // ═══════════════════════════════════════════════════════════════════
  // PRICE CALCULATION
  // ═══════════════════════════════════════════════════════════════════

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

  const sortedFrequencies = useMemo(() => {
    return [...frequencyDiscounts].sort((a, b) => {
      const ai = FREQ_ORDER.indexOf(a.frequency);
      const bi = FREQ_ORDER.indexOf(b.frequency);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [frequencyDiscounts]);

  // Available dates set (next 60 days, no Sundays)
  const availableDateSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 1; i <= 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (d.getDay() !== 0) set.add(d.toISOString().split("T")[0]);
    }
    return set;
  }, []);

  // Calendar grid helper
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarMonth]);

  // ═══════════════════════════════════════════════════════════════════
  // REAL-TIME AVAILABILITY
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!selectedDate) { setTimeSlots([]); return; }
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedTime("");

    fetch(`/api/bookings?mode=availability&date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.slots) {
          setTimeSlots(data.slots);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback: show all slots as available
          setTimeSlots([
            "08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"
          ].map(t => {
            const [h, m] = t.split(":").map(Number);
            const ampm = h >= 12 ? "PM" : "AM";
            const hour = h % 12 || 12;
            return { time: t, label: `${hour}:${String(m).padStart(2, "0")} ${ampm}`, available: true, remaining: 3 };
          }));
        }
      })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });

    return () => { cancelled = true; };
  }, [selectedDate]);

  // ═══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateContact = (field: string, value: string) => {
    setContact(p => ({ ...p, [field]: value }));
    setFieldErrors(p => ({ ...p, [field]: "" }));
  };

  const validateContact = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!contact.firstName.trim()) errs.firstName = "First name is required";
    if (!contact.lastName.trim()) errs.lastName = "Last name is required";
    if (!contact.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errs.email = "Please enter a valid email";
    if (!contact.phone.trim()) errs.phone = "Phone number is required";
    else if (contact.phone.replace(/\D/g, "").length < 10) errs.phone = "Please enter a valid 10-digit phone";
    if (!contact.addressLine1.trim()) errs.addressLine1 = "Street address is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [contact]);

  const canProceed = () => {
    switch (step) {
      case 1: return zipMatch !== null;
      case 2: return price !== null;
      case 3: return frequency !== "";
      case 4: return true;
      case 5: return selectedDate !== "" && selectedTime !== "";
      case 6: return !!(contact.firstName && contact.lastName && contact.email && contact.phone && contact.addressLine1);
      default: return true;
    }
  };

  const next = () => {
    if (step === 6 && !validateContact()) return;
    if (canProceed() && step < 7) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prev = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SUBMIT BOOKING
  // ═══════════════════════════════════════════════════════════════════

  const handleSubmit = async () => {
    if (!price || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Contact
          firstName: contact.firstName.trim(),
          lastName: contact.lastName.trim(),
          email: contact.email.trim().toLowerCase(),
          phone: contact.phone.trim(),
          // Structured address
          addressLine1: contact.addressLine1.trim(),
          addressLine2: contact.addressLine2.trim() || null,
          city: zipMatch?.city || "",
          state: zipMatch?.state || "TX",
          zipCode,
          // Home details
          bedrooms,
          bathrooms,
          sqftRange: sqftKey,
          // Service
          frequency,
          selectedExtras,
          // Schedule (time is already in "HH:00" format from API)
          scheduledDate: selectedDate,
          scheduledTime: selectedTime,
          // Pets & access
          hasPets,
          petDetails: hasPets ? petDetails.trim() : null,
          accessInstructions: accessInstructions.trim() || null,
          // Notes
          customerNotes: contact.notes.trim() || null,
          // Pricing (server will re-verify)
          basePrice: price.basePrice,
          discountPercentage: price.discPct,
          discountAmount: price.discAmt,
          extrasTotal: price.extrasTotal,
          subtotal: price.subtotal,
          taxRate: price.taxRate,
          taxAmount: price.tax,
          total: price.total,
          estimatedHours: price.hours,
          // Payment
          paymentMethod: "pay_at_service",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details?.join(", ") || "Failed to create booking");
      }

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

  /* ═══════════════════════════════════════════════════════════════════
     RENDER — BOOKING CONFIRMED
     ═══════════════════════════════════════════════════════════════════ */

  if (bookingConfirmed) {
    return (
      <div className={embedded ? "bg-slate-50 p-6" : "min-h-screen bg-gradient-to-b from-[#F8FAFB] to-[#F0F4F3]"}>
        {!embedded && (
          <section className="relative overflow-hidden bg-[#0C1829]">
            <div className="absolute inset-0 opacity-10">
              <img src={IMAGES.luxuryHero} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0C1829]/80 via-[#0C1829]/95 to-[#0C1829]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18 text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#0D9488]/20 flex items-center justify-center">
                  <CheckCircle size={40} className="text-[#0D9488]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Booking <span className="text-[#0D9488]">Confirmed!</span>
                </h1>
                <p className="mt-3 text-lg text-white/50 max-w-md mx-auto">
                  {bookingConfirmed.message}
                </p>
              </motion.div>
            </div>
          </section>
        )}
        {embedded && (
          <div className="text-center mb-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0D9488]/15 flex items-center justify-center">
                <CheckCircle size={32} className="text-[#0D9488]" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Booking <span className="text-[#0D9488]">Confirmed!</span>
              </h1>
              <p className="mt-2 text-sm text-slate-500">{bookingConfirmed.message}</p>
            </motion.div>
          </div>
        )}

        <div className={`max-w-2xl mx-auto px-4 sm:px-6 pb-20 ${embedded ? "mt-0" : "-mt-8"}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0B7C72] p-6 text-center">
              <p className="text-sm text-white/70 font-medium mb-1">Booking Number</p>
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

            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <SummaryCard icon={MapPin} label="Location" value={`${contact.addressLine1}, ${zipMatch?.city}, ${zipMatch?.state} ${zipCode}`} />
                <SummaryCard icon={Home} label="Home Size" value={`${bedrooms} bed / ${fmtBath(bathrooms!)} bath`} />
                <SummaryCard icon={Calendar} label="Date & Time" value={`${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${timeSlots.find(s => s.time === selectedTime)?.label || selectedTime}`} />
                <SummaryCard icon={Repeat} label="Frequency" value={freqLabel(frequency)} />
              </div>

              {price && (
                <div className="bg-[#FAFAF8] rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#0C1829]">Total</span>
                    <span className="text-2xl font-black text-[#0D9488]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Payment due at time of service</p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-[#0C1829] uppercase tracking-wider">What Happens Next</h3>
                <div className="space-y-2.5">
                  <NextStep icon={Mail} text={<>A confirmation email has been sent to <strong className="text-[#0C1829]">{contact.email}</strong></>} />
                  <NextStep icon={User} text={<>{bookingConfirmed.providerAssigned ? "A cleaner has been assigned to your booking!" : "We'll assign your dedicated cleaning professional within 24 hours"}</>} />
                  <NextStep icon={Phone} text={<>Questions? Call us at <strong className="text-[#0C1829]">{BRAND.phone}</strong></>} />
                </div>
              </div>

              {/* Account Creation for New Customers */}
              {!isLoggedIn && !accountCreated && (
                <div className="bg-gradient-to-r from-[#0D9488]/5 to-[#0B7C72]/5 rounded-xl p-4 border border-[#0D9488]/20">
                  {!showCreateAccount ? (
                    <div className="text-center">
                      <Lock size={20} className="mx-auto text-[#0D9488] mb-2" />
                      <p className="text-sm font-bold text-[#0C1829]">Create an account to manage your bookings</p>
                      <p className="text-xs text-gray-500 mt-1">Track bookings, reschedule, view history, and more</p>
                      <button
                        onClick={() => setShowCreateAccount(true)}
                        className="mt-3 px-6 py-2 bg-[#0D9488] text-white text-sm font-bold rounded-lg hover:bg-[#0B7C72] transition-colors"
                      >
                        Create Account
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-[#0C1829]">Set a password for your account</p>
                      <p className="text-xs text-gray-500">Email: <strong>{contact.email}</strong></p>
                      <input
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        value={createPassword}
                        onChange={e => setCreatePassword(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none"
                      />
                      <button
                        onClick={handleCreateAccount}
                        disabled={creatingAccount || createPassword.length < 6}
                        className="w-full py-2.5 bg-[#0D9488] text-white text-sm font-bold rounded-lg hover:bg-[#0B7C72] transition-colors disabled:opacity-50"
                      >
                        {creatingAccount ? "Creating..." : "Create Account"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {accountCreated && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                  <CheckCircle size={20} className="mx-auto text-green-600 mb-2" />
                  <p className="text-sm font-bold text-green-800">Account created! Check your email to verify.</p>
                  <Link href="/auth/login" className="text-xs text-[#0D9488] font-semibold hover:underline mt-1 inline-block">Sign in to manage your bookings</Link>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {isLoggedIn ? (
                  <>
                    <Link href="/customer/bookings" className="flex-1 py-3.5 bg-gradient-to-r from-[#0D9488] to-[#0B7C72] text-white font-bold rounded-xl text-center text-sm hover:shadow-lg hover:shadow-[#0D9488]/25 transition-all">
                      Manage My Bookings
                    </Link>
                    <button onClick={() => window.location.reload()} className="flex-1 py-3.5 bg-gray-50 text-[#0C1829] font-bold rounded-xl text-center text-sm hover:bg-gray-100 transition-all border border-gray-100">
                      Book Another Cleaning
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/" className="flex-1 py-3.5 bg-gradient-to-r from-[#0D9488] to-[#0B7C72] text-white font-bold rounded-xl text-center text-sm hover:shadow-lg hover:shadow-[#0D9488]/25 transition-all">
                      Back to Home
                    </Link>
                    <button onClick={() => window.location.reload()} className="flex-1 py-3.5 bg-gray-50 text-[#0C1829] font-bold rounded-xl text-center text-sm hover:bg-gray-100 transition-all border border-gray-100">
                      Book Another Cleaning
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
     RENDER — BOOKING WIZARD
     ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className={embedded ? "bg-slate-50" : "min-h-screen bg-gradient-to-b from-[#F8FAFB] to-[#F0F4F3]"}>
      {/* ═══ HERO (public only, step 1 only) ═══ */}
      {!embedded && step === 1 && (
        <section className="relative overflow-hidden bg-[#0C1829]">
          <div className="absolute inset-0 opacity-10">
            <img src={IMAGES.luxuryHero} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C1829]/80 via-[#0C1829]/95 to-[#0C1829]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
      )}

      {/* ═══ COMPACT PROGRESS BAR (public only, steps 2-7) ═══ */}
      {!embedded && step > 1 && (
        <section className="bg-[#0C1829] border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0D9488]/15 flex items-center justify-center">
                  <Sparkles size={16} className="text-[#0D9488]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {STEPS[step - 1]?.label || "Booking"}
                  </h2>
                  <p className="text-[11px] text-white/40">Step {step} of {STEPS.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1">
                  {STEPS.map((s, i) => (
                    <div key={s.id} className={`w-8 h-1 rounded-full transition-all duration-300 ${
                      i + 1 < step ? "bg-[#0D9488]" : i + 1 === step ? "bg-[#0D9488]/60" : "bg-white/10"
                    }`} />
                  ))}
                </div>
                {price && (
                  <div className="text-right ml-4">
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Total</p>
                    <p className="text-lg font-black text-[#0D9488]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Breadcrumbs (public only, step 1 only) */}
      {!embedded && step === 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs items={[{ label: "Book Now" }]} />
        </div>
      )}

      {/* ═══ EMBEDDED HEADER ═══ */}
      {embedded && (
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Book a Cleaning</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Step {step} of {STEPS.length}</span>
              <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#0D9488] to-[#0D9488]/70 rounded-full"
                  initial={false}
                  animate={{ width: `${(step / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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

                    {/* ── STEP 2: Home Details ── */}
                    {step === 2 && (
                      <div>
                        <StepHeader icon={Home} title="Tell us about your home" subtitle="Select your home size — options update automatically based on available pricing" step={2} />
                        <div className="space-y-6">
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

                          <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-[#0C1829] mb-3">
                              <Bath size={15} className="text-[#0D9488]" /> Bathrooms
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {bathroomOptions.map(n => (
                                <button key={n} onClick={() => setBathrooms(n)}
                                  className={`min-w-[52px] py-3 px-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    bathrooms === n
                                      ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25 scale-105"
                                      : "bg-gray-50 text-[#0C1829] hover:bg-gray-100 border border-gray-100"
                                  }`}>
                                  {fmtBath(n)}
                                </button>
                              ))}
                            </div>
                          </div>

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
                        <div className="space-y-3">
                          {sortedFrequencies.map(fd => {
                            const meta = FREQ_META[fd.frequency];
                            const isSelected = frequency === fd.frequency;
                            const discPct = Number(fd.discount_percentage);
                            return (
                              <button key={fd.id} onClick={() => setFrequency(fd.frequency)}
                                className={`relative w-full p-5 rounded-xl border-2 text-left transition-all duration-200 group ${
                                  isSelected
                                    ? "border-[#0D9488] bg-gradient-to-br from-[#0D9488]/5 to-[#0D9488]/0 shadow-lg shadow-[#0D9488]/10"
                                    : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                }`}>
                                {meta?.badge && (
                                  <span className={`absolute -top-2.5 right-4 px-3 py-0.5 text-xs font-bold rounded-full shadow-sm ${
                                    meta.badge === "MOST POPULAR" ? "bg-[#C9A84C] text-white" : "bg-[#0D9488] text-white"
                                  }`}>{meta.badge}</span>
                                )}
                                <div className="flex items-center gap-4">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    isSelected ? "border-[#0D9488] bg-[#0D9488]" : "border-gray-200"
                                  }`}>
                                    {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="text-base font-bold text-[#0C1829]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                        {meta?.label || fd.frequency}
                                      </span>
                                      {discPct > 0 && (
                                        <span className="px-2.5 py-1 bg-[#0D9488]/10 text-[#0D9488] text-xs font-bold rounded-md">
                                          Save {discPct}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{meta?.desc || ""}</p>
                                  </div>
                                  {price && (
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-base font-bold text-[#0D9488]">
                                        {discPct > 0
                                          ? fmt(round2(price.basePrice - price.basePrice * discPct / 100))
                                          : fmt(price.basePrice)
                                        }
                                      </div>
                                      <div className="text-xs text-gray-400">per visit</div>
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
                            const IconComp = EXTRA_ICON_MAP[extra.name] || Sparkles;
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
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSel ? "bg-[#0D9488] shadow-lg shadow-[#0D9488]/25" : "bg-gray-50"
                                }`}>
                                  {isSel
                                    ? <Check size={18} className="text-white" />
                                    : <IconComp size={20} className="text-[#0D9488]" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold text-[#0C1829]">{extra.name}</div>
                                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{extra.description}</div>
                                </div>
                                <span className={`text-sm font-bold flex-shrink-0 ${
                                  isSel ? "text-[#0D9488]" : "text-gray-400"
                                }`}>
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

                    {/* ── STEP 5: Date & Time with Full Calendar Modal ── */}
                    {step === 5 && (
                      <div>
                        <StepHeader icon={Calendar} title="Pick your preferred date & time" subtitle="Choose when you'd like us to arrive — availability updates in real time" step={5} />
                        <div className="space-y-6">
                          {/* Date Picker Button */}
                          <div>
                            <label className="block text-sm font-bold text-[#0C1829] mb-3">Select Date</label>
                            <button
                              onClick={() => setShowCalendar(true)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                                selectedDate
                                  ? "border-[#0D9488] bg-[#0D9488]/5"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              }`}
                            >
                              <Calendar size={20} className={selectedDate ? "text-[#0D9488]" : "text-gray-400"} />
                              <div className="flex-1">
                                {selectedDate ? (
                                  <span className="text-base font-bold text-[#0C1829]">
                                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                                  </span>
                                ) : (
                                  <span className="text-base text-gray-400">Choose a date...</span>
                                )}
                              </div>
                              <ChevronRight size={18} className="text-gray-400" />
                            </button>
                          </div>

                          {/* Calendar Modal */}
                          <AnimatePresence>
                            {showCalendar && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={() => setShowCalendar(false)}
                              >
                                <motion.div
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.95, opacity: 0 }}
                                  onClick={e => e.stopPropagation()}
                                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                                >
                                  {/* Calendar Header */}
                                  <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                    <button
                                      onClick={() => setCalendarMonth(prev => {
                                        const d = new Date(prev.year, prev.month - 1, 1);
                                        return { year: d.getFullYear(), month: d.getMonth() };
                                      })}
                                      className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                      <ChevronLeft size={20} className="text-gray-600" />
                                    </button>
                                    <h3 className="text-lg font-bold text-[#0C1829]">
                                      {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </h3>
                                    <button
                                      onClick={() => setCalendarMonth(prev => {
                                        const d = new Date(prev.year, prev.month + 1, 1);
                                        return { year: d.getFullYear(), month: d.getMonth() };
                                      })}
                                      className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                      <ChevronRight size={20} className="text-gray-600" />
                                    </button>
                                  </div>

                                  {/* Day headers */}
                                  <div className="grid grid-cols-7 px-5 pt-3">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                      <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
                                    ))}
                                  </div>

                                  {/* Calendar Grid */}
                                  <div className="grid grid-cols-7 px-5 pb-5 gap-1">
                                    {calendarDays.map((day, i) => {
                                      if (day === null) return <div key={`empty-${i}`} />;
                                      const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                      const isAvailable = availableDateSet.has(dateStr);
                                      const isSelected = selectedDate === dateStr;
                                      const today = new Date();
                                      const isToday = today.getFullYear() === calendarMonth.year && today.getMonth() === calendarMonth.month && today.getDate() === day;
                                      return (
                                        <button
                                          key={dateStr}
                                          disabled={!isAvailable}
                                          onClick={() => {
                                            setSelectedDate(dateStr);
                                            setShowCalendar(false);
                                          }}
                                          className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${
                                            isSelected
                                              ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25"
                                              : isAvailable
                                                ? "hover:bg-[#0D9488]/10 text-[#0C1829] cursor-pointer"
                                                : "text-gray-200 cursor-not-allowed"
                                          } ${isToday && !isSelected ? "ring-2 ring-[#0D9488]/30" : ""}`}
                                        >
                                          {day}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Close button */}
                                  <div className="px-5 pb-5">
                                    <button
                                      onClick={() => setShowCalendar(false)}
                                      className="w-full py-3 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                                    >
                                      Close
                                    </button>
                                  </div>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Time Slots */}
                          <AnimatePresence>
                            {selectedDate && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <label className="block text-sm font-bold text-[#0C1829] mb-3">
                                  Select Time
                                  {loadingSlots && <Loader2 size={14} className="inline-block ml-2 animate-spin text-[#0D9488]" />}
                                </label>

                                {loadingSlots ? (
                                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                      <div key={i} className="h-14 rounded-xl bg-gray-50 animate-pulse" />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {timeSlots.map(slot => (
                                      <button
                                        key={slot.time}
                                        onClick={() => slot.available && setSelectedTime(slot.time)}
                                        disabled={!slot.available}
                                        className={`py-3.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 relative ${
                                          selectedTime === slot.time
                                            ? "bg-gradient-to-br from-[#0D9488] to-[#0B7C72] text-white shadow-lg shadow-[#0D9488]/25"
                                            : slot.available
                                              ? "bg-gray-50 hover:bg-gray-100 text-[#0C1829] border border-gray-100"
                                              : "bg-red-50/50 text-gray-300 border border-red-100/50 cursor-not-allowed line-through"
                                        }`}
                                      >
                                        {slot.label}
                                        {slot.available && slot.remaining <= 2 && selectedTime !== slot.time && (
                                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                            {slot.remaining}
                                          </span>
                                        )}
                                        {!slot.available && (
                                          <span className="block text-xs font-normal mt-0.5">Full</span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {!loadingSlots && timeSlots.some(s => s.remaining <= 2 && s.available) && (
                                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    <AlertCircle size={15} />
                                    <span>Slots with low availability are marked with remaining count</span>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 6: Contact Details (Structured) ── */}
                    {step === 6 && (
                      <div>
                        <StepHeader icon={User} title="Your contact & service details" subtitle="We'll send your booking confirmation here" step={6} />

                        {/* Contact Info */}
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-xs font-bold text-[#0C1829]/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <User size={12} /> Contact Information
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <FormInput label="First Name" value={contact.firstName} onChange={v => updateContact("firstName", v)} placeholder="John" required error={fieldErrors.firstName} />
                              <FormInput label="Last Name" value={contact.lastName} onChange={v => updateContact("lastName", v)} placeholder="Doe" required error={fieldErrors.lastName} />
                              <FormInput label="Email" value={contact.email} onChange={v => updateContact("email", v)} placeholder="john@example.com" type="email" required error={fieldErrors.email} />
                              <FormInput
                                label="Phone"
                                value={contact.phone}
                                onChange={v => updateContact("phone", formatPhone(v))}
                                placeholder="(469) 555-0123"
                                type="tel"
                                required
                                error={fieldErrors.phone}
                              />
                            </div>
                          </div>

                          {/* Service Address */}
                          <div>
                            <h3 className="text-xs font-bold text-[#0C1829]/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Building size={12} /> Service Address
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="sm:col-span-2">
                                <FormInput
                                  label="Street Address"
                                  value={contact.addressLine1}
                                  onChange={v => updateContact("addressLine1", v)}
                                  placeholder="123 Main Street"
                                  required
                                  error={fieldErrors.addressLine1}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <FormInput
                                  label="Apt / Suite / Unit"
                                  value={contact.addressLine2}
                                  onChange={v => updateContact("addressLine2", v)}
                                  placeholder="Apt 4B (optional)"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-[#0C1829] mb-2">City</label>
                                <div className="px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-medium bg-gray-50 text-[#0C1829]">
                                  {zipMatch?.city || "—"}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Auto-filled from zip code</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-bold text-[#0C1829] mb-2">State</label>
                                  <div className="px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-medium bg-gray-50 text-[#0C1829]">
                                    {zipMatch?.state || "TX"}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-[#0C1829] mb-2">Zip Code</label>
                                  <div className="px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-medium bg-gray-50 text-[#0C1829]">
                                    {zipCode}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Pets & Access */}
                          <div>
                            <h3 className="text-xs font-bold text-[#0C1829]/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Key size={12} /> Pets & Access
                            </h3>
                            <div className="space-y-4">
                              {/* Pets toggle */}
                              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                  <PawPrint size={18} className="text-[#0D9488]" />
                                  <div>
                                    <p className="text-sm font-bold text-[#0C1829]">Do you have pets?</p>
                                    <p className="text-[11px] text-gray-400">So our team can prepare accordingly</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setHasPets(!hasPets)}
                                  className={`relative w-12 h-7 rounded-full transition-all duration-200 ${
                                    hasPets ? "bg-[#0D9488]" : "bg-gray-200"
                                  }`}
                                >
                                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                                    hasPets ? "left-6" : "left-1"
                                  }`} />
                                </button>
                              </div>

                              <AnimatePresence>
                                {hasPets && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                  >
                                    <label className="block text-sm font-bold text-[#0C1829] mb-2">Pet Details</label>
                                    <input
                                      type="text"
                                      value={petDetails}
                                      onChange={e => setPetDetails(e.target.value)}
                                      placeholder="e.g. 2 dogs (friendly), 1 cat"
                                      className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-medium focus:outline-none focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 transition-all placeholder:text-gray-300"
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Access instructions */}
                              <div>
                                <label className="block text-sm font-bold text-[#0C1829] mb-2">
                                  Access Instructions <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <input
                                  type="text"
                                  value={accessInstructions}
                                  onChange={e => setAccessInstructions(e.target.value)}
                                  placeholder="e.g. Gate code #1234, key under mat, ring doorbell"
                                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-medium focus:outline-none focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 transition-all placeholder:text-gray-300"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Special Instructions */}
                          <div>
                            <label className="block text-sm font-bold text-[#0C1829] mb-2">
                              Special Instructions <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <textarea
                              value={contact.notes}
                              onChange={e => setContact(p => ({ ...p, notes: e.target.value }))}
                              rows={3}
                              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 resize-none transition-all placeholder:text-gray-300"
                              placeholder="Focus areas, allergies, specific requests..."
                            />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Lock size={12} /> Your information is encrypted and never shared with third parties.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 7: Confirm & Book ── */}
                    {step === 7 && price && (
                      <div>
                        <StepHeader icon={Check} title="Review & Confirm Your Booking" subtitle="Double-check everything before we lock in your appointment" step={7} />
                        <div className="space-y-5">
                          {/* Summary cards */}
                          <div className="grid sm:grid-cols-2 gap-3">
                            <SummaryCard icon={MapPin} label="Address" value={`${contact.addressLine1}${contact.addressLine2 ? `, ${contact.addressLine2}` : ""}`} />
                            <SummaryCard icon={Building} label="City" value={`${zipMatch?.city}, ${zipMatch?.state} ${zipCode}`} />
                            <SummaryCard icon={Home} label="Home Size" value={`${bedrooms} bed / ${fmtBath(bathrooms!)} bath`} />
                            <SummaryCard icon={Ruler} label="Square Feet" value={sqftKey ? fmtSqft(sqftMin!, sqftMax!) : ""} />
                            <SummaryCard icon={Repeat} label="Frequency" value={freqLabel(frequency)} />
                            <SummaryCard icon={Calendar} label="Date & Time" value={`${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${timeSlots.find(s => s.time === selectedTime)?.label || selectedTime}`} />
                            <SummaryCard icon={User} label="Customer" value={`${contact.firstName} ${contact.lastName}`} />
                            <SummaryCard icon={Mail} label="Email" value={contact.email} />
                            {hasPets && <SummaryCard icon={PawPrint} label="Pets" value={petDetails || "Yes"} />}
                            {accessInstructions && <SummaryCard icon={Key} label="Access" value={accessInstructions} />}
                          </div>

                          {/* Extras summary */}
                          {price.extras.length > 0 && (
                            <div className="bg-[#FAFAF8] rounded-xl p-4 border border-gray-100">
                              <h4 className="text-xs font-bold text-[#0C1829]/50 uppercase tracking-wider mb-2">Selected Extras</h4>
                              <div className="space-y-1.5">
                                {price.extras.map(e => (
                                  <div key={e.name} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{EXTRA_ICONS[e.name] || "✨"} {e.name}</span>
                                    <span className="font-semibold text-[#0C1829]">+{fmt(e.price)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Price breakdown */}
                          <div className="bg-gradient-to-br from-[#0C1829] to-[#162A45] rounded-2xl p-6 space-y-3">
                            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Price Breakdown</h3>
                            <PriceRow label="Base Price" value={fmt(price.basePrice)} />
                            {price.discAmt > 0 && (
                              <PriceRow label={`${freqLabel(frequency)} Discount (${price.discPct}%)`} value={`-${fmt(price.discAmt)}`} accent />
                            )}
                            {price.extrasTotal > 0 && (
                              <PriceRow label={`Extras (${price.extras.length})`} value={`+${fmt(price.extrasTotal)}`} />
                            )}
                            <PriceRow label={`Tax (${(price.taxRate * 100).toFixed(1)}%)`} value={fmt(price.tax)} />
                            <hr className="border-white/10 my-2" />
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-white font-bold text-lg">Total Due</span>
                              <span className="text-3xl font-black text-[#0D9488]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{fmt(price.total)}</span>
                            </div>
                            {price.hours > 0 && (
                              <p className="text-white/30 text-xs mt-1">Estimated cleaning time: {price.hours} hours</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                              <CreditCard size={13} className="text-white/30" />
                              <p className="text-white/30 text-xs">Payment collected at time of service</p>
                            </div>
                          </div>

                          {/* Error message */}
                          {submitError && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2.5 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium"
                            >
                              <AlertCircle size={18} className="flex-shrink-0" />
                              <span>{submitError}</span>
                            </motion.div>
                          )}

                          {/* CTA */}
                          <motion.button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                            whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                            className={`w-full py-4.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 text-lg ${
                              isSubmitting
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#0D9488] to-[#0B7C72] text-white hover:shadow-xl hover:shadow-[#0D9488]/25"
                            }`}
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {isSubmitting ? (
                              <><Loader2 size={20} className="animate-spin" /> Processing Your Booking...</>
                            ) : (
                              <><CheckCircle size={20} /> Confirm & Book Now</>
                            )}
                          </motion.button>
                          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Lock size={11} /> Secure Booking</span>
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
                          <span className="text-gray-500 truncate mr-2">{e.name}</span>
                          <span className="font-semibold flex-shrink-0">+{fmt(e.price)}</span>
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

      {/* ═══ HOW IT WORKS (public only) ═══ */}
      {!embedded && <section className="py-20 bg-white">
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
      </section>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function StepHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string; step: number }) {
  return (
    <div className="flex items-start gap-3.5 mb-7">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0D9488]/15 to-[#0D9488]/5 flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-[#0D9488]" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#0C1829] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, type = "text", required, error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; required?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-[#0C1829] mb-2">
        {label} {required && <span className="text-[#0D9488]">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all placeholder:text-gray-300 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            : "border-gray-100 focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10"
        }`}
        placeholder={placeholder} />
      {error && <p className="mt-1.5 text-sm text-red-500 font-medium">{error}</p>}
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
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</div>
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

function NextStep({ icon: Icon, text }: { icon: React.ElementType; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={12} className="text-[#0D9488]" />
      </div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}
