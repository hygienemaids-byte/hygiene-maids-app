// ═══════════════════════════════════════════════════════════════════
// SHARED BOOKING UTILITIES
// Types, constants, pricing logic, and formatters used across
// public, customer, and admin booking flows.
// ═══════════════════════════════════════════════════════════════════

/* ── TYPES ── */

export interface PricingMatrix {
  id: string;
  bedrooms: number;
  bathrooms: number;
  sqft_min: number;
  sqft_max: number;
  base_price: number;
  estimated_hours: number;
}

export interface FrequencyDiscount {
  id: string;
  frequency: string;
  discount_percentage: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

export interface ServiceArea {
  id: string;
  zip_code: string;
  city: string;
  state: string;
}

export interface PricingData {
  pricingMatrix: PricingMatrix[];
  frequencyDiscounts: FrequencyDiscount[];
  extras: Extra[];
  serviceAreas: ServiceArea[];
  taxRate: number;
}

export interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
  remaining: number;
}

export interface PriceBreakdown {
  basePrice: number;
  discPct: number;
  discAmt: number;
  discounted: number;
  extras: { name: string; price: number }[];
  extrasTotal: number;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  hours: number;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  notes: string;
}

/* ── CONSTANTS ── */

export const FREQ_ORDER = ["weekly", "biweekly", "monthly", "one_time"];

export const FREQ_META: Record<string, { label: string; desc: string; badge?: string }> = {
  weekly: { label: "Weekly", desc: "Best value — always come home to a clean house", badge: "BEST VALUE" },
  biweekly: { label: "Biweekly", desc: "Most popular — great balance of clean & savings", badge: "MOST POPULAR" },
  monthly: { label: "Monthly", desc: "Light maintenance between deep cleans" },
  one_time: { label: "One-Time", desc: "Perfect for a one-time deep clean or move-in/out" },
};

export const EXTRA_ICONS: Record<string, string> = {
  "Inside Oven": "🍳", "Inside Fridge": "🧊", "Inside Cabinets": "🗄️",
  "Laundry (Wash & Fold)": "👕", "Inside Windows": "🪟", "Baseboards": "🧹",
  "Wall Cleaning": "🏠", "Garage Sweep": "🚗", "Patio/Balcony": "🌿",
  "Pet Hair Treatment": "🐾", "Green Cleaning Upgrade": "🌱", "Organizing (per room)": "📦",
  "Dishes": "🍽️", "Blinds Cleaning": "🪟",
};

/* ── FORMATTERS ── */

export function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function fmtBath(n: number): string {
  if (n % 1 === 0.5) return `${Math.floor(n)}½`;
  return String(n);
}

export function fmtSqft(min: number, max: number): string {
  if (min === 0) return `Under ${max + 1} sq ft`;
  if (max >= 9999) return `${min.toLocaleString()}+ sq ft`;
  return `${min.toLocaleString()} – ${max.toLocaleString()} sq ft`;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/* ── PRICING ENGINE ── */

export function calculatePrice(
  pricingMatrix: PricingMatrix[],
  frequencyDiscounts: FrequencyDiscount[],
  extras: Extra[],
  taxRate: number,
  bedrooms: number | null,
  bathrooms: number | null,
  sqftMin: number | null,
  sqftMax: number | null,
  frequency: string,
  selectedExtras: string[]
): PriceBreakdown | null {
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
}

/* ── AVAILABLE DATES (next 14 non-Sunday days) ── */

export function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  for (let i = 1; i <= 21 && dates.length < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0) dates.push(d);
  }
  return dates;
}

/* ── FALLBACK TIME SLOTS ── */

export function getFallbackTimeSlots(): TimeSlot[] {
  return [
    "08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"
  ].map(t => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return { time: t, label: `${hour}:${String(m).padStart(2, "0")} ${ampm}`, available: true, remaining: 3 };
  });
}

/* ── VALIDATION ── */

export function validateContact(contact: ContactInfo): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!contact.firstName.trim()) errs.firstName = "First name is required";
  if (!contact.lastName.trim()) errs.lastName = "Last name is required";
  if (!contact.email.trim()) errs.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errs.email = "Please enter a valid email";
  if (!contact.phone.trim()) errs.phone = "Phone number is required";
  else if (contact.phone.replace(/\D/g, "").length < 10) errs.phone = "Please enter a valid 10-digit phone";
  if (!contact.addressLine1.trim()) errs.addressLine1 = "Street address is required";
  return errs;
}

/* ── SUBMIT BOOKING PAYLOAD ── */

export function buildBookingPayload(
  contact: ContactInfo,
  zipMatch: ServiceArea | null,
  zipCode: string,
  bedrooms: number | null,
  bathrooms: number | null,
  sqftKey: string | null,
  frequency: string,
  selectedExtras: string[],
  selectedDate: string,
  selectedTime: string,
  hasPets: boolean,
  petDetails: string,
  accessInstructions: string,
  price: PriceBreakdown
) {
  return {
    firstName: contact.firstName.trim(),
    lastName: contact.lastName.trim(),
    email: contact.email.trim().toLowerCase(),
    phone: contact.phone.trim(),
    addressLine1: contact.addressLine1.trim(),
    addressLine2: contact.addressLine2.trim() || null,
    city: zipMatch?.city || "",
    state: zipMatch?.state || "TX",
    zipCode,
    bedrooms,
    bathrooms,
    sqftRange: sqftKey,
    frequency,
    selectedExtras,
    scheduledDate: selectedDate,
    scheduledTime: selectedTime,
    hasPets,
    petDetails: hasPets ? petDetails.trim() : null,
    accessInstructions: accessInstructions.trim() || null,
    customerNotes: contact.notes.trim() || null,
    basePrice: price.basePrice,
    discountPercentage: price.discPct,
    discountAmount: price.discAmt,
    extrasTotal: price.extrasTotal,
    subtotal: price.subtotal,
    taxRate: price.taxRate,
    taxAmount: price.tax,
    total: price.total,
    estimatedHours: price.hours,
    paymentMethod: "pay_at_service",
  };
}
