// ============================================================
// Database entity types for Hygiene Maids Platform
// ============================================================

export type UserRole = "admin" | "provider" | "customer";
export type BookingStatus = "draft" | "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
export type FrequencyType = "one_time" | "weekly" | "biweekly" | "monthly" | "custom";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partial";
export type PaymentMethod = "card" | "cash" | "check" | "bank_transfer";
export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost" | "dormant";
export type LeadSource = "website" | "referral" | "google_ads" | "social_media" | "phone" | "chatbot" | "abandoned_booking" | "other";
export type LeadTemperature = "hot" | "warm" | "cool" | "cold";
export type ApplicantStage = "applied" | "screening" | "interview_scheduled" | "interviewed" | "background_check" | "offer" | "onboarding" | "hired" | "rejected";
export type ProviderStatus = "active" | "inactive" | "on_leave" | "terminated";

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;
  notes: string | null;
  tags: string[];
  lifetime_value: number;
  total_bookings: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: ProviderStatus;
  employee_type: string;
  hourly_rate: number | null;
  payout_percentage: number;
  address_line1: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;
  avg_rating: number;
  total_reviews: number;
  total_jobs_completed: number;
  performance_score: number;
  max_daily_bookings: number;
  service_area_zips: string[];
  hire_date: string | null;
  notes: string | null;
  stripe_connect_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_number: number;
  customer_id: string;
  provider_id: string | null;
  frequency: FrequencyType;
  bedrooms: number;
  bathrooms: number;
  sqft_range: string | null;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration: number;
  actual_start_time: string | null;
  actual_end_time: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  access_instructions: string | null;
  has_pets: boolean;
  pet_details: string | null;
  base_price: number;
  extras_total: number;
  discount_percentage: number;
  discount_amount: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  tip_amount: number;
  provider_payout_percentage: number;
  provider_payout_amount: number;
  status: BookingStatus;
  customer_notes: string | null;
  admin_notes: string | null;
  provider_notes: string | null;
  recurring_parent_id: string | null;
  is_recurring_parent: boolean;
  created_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: Customer;
  provider?: Provider;
}

export interface PricingMatrix {
  id: string;
  bedrooms: number;
  bathrooms: number;
  sqft_min: number;
  sqft_max: number;
  base_price: number;
  estimated_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FrequencyDiscount {
  id: string;
  frequency: FrequencyType;
  discount_percentage: number;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Extra {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon: string | null;
  category: string;
  is_per_unit: boolean;
  max_quantity: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  temperature: LeadTemperature;
  score: number;
  zip_code: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  frequency_interest: FrequencyType | null;
  estimated_value: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referral_code: string | null;
  assigned_to: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  converted_customer_id: string | null;
  converted_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  stage: ApplicantStage;
  source: string | null;
  resume_url: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;
  years_experience: number;
  has_own_transport: boolean;
  availability: string | null;
  desired_hourly_rate: number | null;
  background_check_status: string;
  background_check_date: string | null;
  interview_date: string | null;
  interview_notes: string | null;
  offer_date: string | null;
  start_date: string | null;
  rejection_reason: string | null;
  notes: string | null;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  notes: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  is_public: boolean;
  admin_response: string | null;
  created_at: string;
}
