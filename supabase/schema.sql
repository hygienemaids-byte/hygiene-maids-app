-- ============================================================
-- HYGIENE MAIDS PLATFORM - DATABASE SCHEMA
-- Phase 1: Foundation (Core entities)
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'provider', 'customer');
CREATE TYPE booking_status AS ENUM ('draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE frequency_type AS ENUM ('one_time', 'weekly', 'biweekly', 'monthly', 'custom');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partial');
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'check', 'bank_transfer');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'dormant');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'google_ads', 'social_media', 'phone', 'chatbot', 'abandoned_booking', 'other');
CREATE TYPE lead_temperature AS ENUM ('hot', 'warm', 'cool', 'cold');
CREATE TYPE applicant_stage AS ENUM ('applied', 'screening', 'interview_scheduled', 'interviewed', 'background_check', 'offer', 'onboarding', 'hired', 'rejected');
CREATE TYPE provider_status AS ENUM ('active', 'inactive', 'on_leave', 'terminated');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. SERVICE AREAS (Zip codes / regions)
-- ============================================================

CREATE TABLE service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zip_code TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'TX',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_service_areas_zip ON service_areas(zip_code);

ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active service areas" ON service_areas
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage service areas" ON service_areas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 3. CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  -- Primary address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT DEFAULT 'TX',
  zip_code TEXT,
  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_profile ON customers(profile_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customers can view own record" ON customers
  FOR SELECT USING (profile_id = auth.uid());

-- ============================================================
-- 4. PROVIDERS (Cleaners)
-- ============================================================

CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status provider_status NOT NULL DEFAULT 'active',
  -- Work details
  employee_type TEXT DEFAULT 'employee', -- employee, contractor
  hourly_rate DECIMAL(8,2),
  payout_percentage DECIMAL(5,2) DEFAULT 40.00, -- % of booking total
  -- Address
  address_line1 TEXT,
  city TEXT,
  state TEXT DEFAULT 'TX',
  zip_code TEXT,
  -- Performance
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  performance_score DECIMAL(5,2) DEFAULT 0, -- 0-100 composite score
  -- Availability
  max_daily_bookings INTEGER DEFAULT 4,
  service_area_zips TEXT[] DEFAULT '{}',
  -- Metadata
  hire_date DATE,
  notes TEXT,
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_profile ON providers(profile_id);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage providers" ON providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Providers can view own record" ON providers
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Providers can update own record" ON providers
  FOR UPDATE USING (profile_id = auth.uid());

-- ============================================================
-- 5. PRICING CONFIGURATION
-- ============================================================

-- Base pricing matrix (bedrooms x bathrooms x sqft)
CREATE TABLE pricing_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3,1) NOT NULL, -- supports 1.5, 2.5 etc.
  sqft_min INTEGER NOT NULL,
  sqft_max INTEGER NOT NULL,
  base_price DECIMAL(8,2) NOT NULL,
  estimated_hours DECIMAL(4,1) NOT NULL DEFAULT 2.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_lookup ON pricing_matrix(bedrooms, bathrooms, sqft_min, sqft_max);

ALTER TABLE pricing_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing" ON pricing_matrix
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing" ON pricing_matrix
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Frequency discounts
CREATE TABLE frequency_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frequency frequency_type NOT NULL UNIQUE,
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE frequency_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discounts" ON frequency_discounts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage discounts" ON frequency_discounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Extras / Add-ons
CREATE TABLE extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(8,2) NOT NULL,
  icon TEXT, -- icon name or URL
  category TEXT DEFAULT 'general',
  is_per_unit BOOLEAN DEFAULT false, -- if true, price is per unit
  max_quantity INTEGER DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active extras" ON extras
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage extras" ON extras
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Tax rates
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Sales Tax',
  rate DECIMAL(5,4) NOT NULL DEFAULT 0.0750, -- 7.5%
  zip_codes TEXT[] DEFAULT '{}', -- empty = applies to all
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tax rates" ON tax_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tax rates" ON tax_rates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 6. BOOKINGS
-- ============================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number SERIAL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  -- Service details
  frequency frequency_type NOT NULL DEFAULT 'one_time',
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms DECIMAL(3,1) NOT NULL DEFAULT 1,
  sqft_range TEXT, -- e.g., "1000-1499"
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  estimated_duration DECIMAL(4,1) NOT NULL DEFAULT 2.0, -- hours
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  -- Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'TX',
  zip_code TEXT NOT NULL,
  -- Access
  access_instructions TEXT,
  has_pets BOOLEAN DEFAULT false,
  pet_details TEXT,
  -- Pricing
  base_price DECIMAL(8,2) NOT NULL,
  extras_total DECIMAL(8,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(8,2) NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0750,
  tax_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  total DECIMAL(8,2) NOT NULL,
  tip_amount DECIMAL(8,2) DEFAULT 0,
  -- Provider payout
  provider_payout_percentage DECIMAL(5,2) DEFAULT 40.00,
  provider_payout_amount DECIMAL(8,2) DEFAULT 0,
  -- Status
  status booking_status NOT NULL DEFAULT 'pending',
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT, -- private, not visible to customer
  provider_notes TEXT,
  -- Recurring
  recurring_parent_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  is_recurring_parent BOOLEAN DEFAULT false,
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_number ON bookings(booking_number);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customers can view own bookings" ON bookings
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Providers can view assigned bookings" ON bookings
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

-- Booking extras (many-to-many)
CREATE TABLE booking_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES extras(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(8,2) NOT NULL,
  total_price DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_extras_booking ON booking_extras(booking_id);

ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage booking extras" ON booking_extras
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 7. PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount DECIMAL(8,2) NOT NULL,
  method payment_method NOT NULL DEFAULT 'card',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Provider payouts
CREATE TABLE provider_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount DECIMAL(8,2) NOT NULL,
  method payment_method NOT NULL DEFAULT 'bank_transfer',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_transfer_id TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_provider ON provider_payouts(provider_id);

ALTER TABLE provider_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payouts" ON provider_payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Providers can view own payouts" ON provider_payouts
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

-- ============================================================
-- 8. REVIEWS
-- ============================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public reviews" ON reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 9. CRM / LEADS
-- ============================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  -- Lead details
  source lead_source NOT NULL DEFAULT 'website',
  status lead_status NOT NULL DEFAULT 'new',
  temperature lead_temperature NOT NULL DEFAULT 'warm',
  score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  -- Service interest
  zip_code TEXT,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  frequency_interest frequency_type,
  estimated_value DECIMAL(8,2),
  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referral_code TEXT,
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  -- Notes
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  converted_customer_id UUID REFERENCES customers(id),
  converted_at TIMESTAMPTZ,
  lost_reason TEXT,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_score ON leads(score DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leads" ON leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Lead activity log
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'note', 'call', 'email', 'status_change', 'score_change'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);

ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lead activities" ON lead_activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 10. HIRING PIPELINE
-- ============================================================

CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  -- Application details
  stage applicant_stage NOT NULL DEFAULT 'applied',
  source TEXT, -- 'indeed', 'website', 'referral', etc.
  resume_url TEXT,
  -- Location
  city TEXT,
  state TEXT DEFAULT 'TX',
  zip_code TEXT,
  -- Experience
  years_experience INTEGER DEFAULT 0,
  has_own_transport BOOLEAN DEFAULT false,
  availability TEXT, -- 'full_time', 'part_time', 'weekends'
  desired_hourly_rate DECIMAL(8,2),
  -- Screening
  background_check_status TEXT DEFAULT 'pending',
  background_check_date DATE,
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  -- Decision
  offer_date DATE,
  start_date DATE,
  rejection_reason TEXT,
  -- Metadata
  notes TEXT,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applicants_stage ON applicants(stage);
CREATE INDEX idx_applicants_email ON applicants(email);

ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage applicants" ON applicants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 11. PROVIDER AVAILABILITY / SCHEDULE
-- ============================================================

CREATE TABLE provider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_availability_provider ON provider_availability(provider_id);

ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage availability" ON provider_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Providers can manage own availability" ON provider_availability
  FOR ALL USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

-- Provider time-off requests
CREATE TABLE provider_time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE provider_time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage time off" ON provider_time_off
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Providers can manage own time off" ON provider_time_off
  FOR ALL USING (
    provider_id IN (SELECT id FROM providers WHERE profile_id = auth.uid())
  );

-- ============================================================
-- 12. NOTIFICATIONS LOG
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email TEXT,
  recipient_phone TEXT,
  channel notification_channel NOT NULL DEFAULT 'email',
  subject TEXT,
  body TEXT NOT NULL,
  template_name TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Admins can manage notifications" ON notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 13. SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 14. AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pricing_matrix FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON applicants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA: Pricing based on BookingKoala analysis
-- ============================================================

-- Frequency discounts (from BookingKoala data)
INSERT INTO frequency_discounts (frequency, discount_percentage, label, description, sort_order) VALUES
  ('one_time', 0, 'One-Time', 'Single cleaning session', 1),
  ('weekly', 20, 'Weekly', 'Save 20% with weekly cleaning', 2),
  ('biweekly', 10, 'Bi-Weekly', 'Save 10% with bi-weekly cleaning', 3),
  ('monthly', 5, 'Monthly', 'Save 5% with monthly cleaning', 4);

-- Base pricing matrix (from BookingKoala analysis)
-- Studio/1BR
INSERT INTO pricing_matrix (bedrooms, bathrooms, sqft_min, sqft_max, base_price, estimated_hours) VALUES
  (0, 1, 0, 499, 99.00, 1.5),
  (0, 1, 500, 999, 109.00, 1.5),
  (1, 1, 0, 499, 109.00, 2.0),
  (1, 1, 500, 999, 119.00, 2.0),
  (1, 1, 1000, 1499, 129.00, 2.5);

-- 2BR
INSERT INTO pricing_matrix (bedrooms, bathrooms, sqft_min, sqft_max, base_price, estimated_hours) VALUES
  (2, 1, 500, 999, 129.00, 2.5),
  (2, 1, 1000, 1499, 139.00, 2.5),
  (2, 2, 1000, 1499, 149.00, 3.0),
  (2, 2, 1500, 1999, 159.00, 3.0),
  (2, 2, 2000, 2499, 169.00, 3.5);

-- 3BR
INSERT INTO pricing_matrix (bedrooms, bathrooms, sqft_min, sqft_max, base_price, estimated_hours) VALUES
  (3, 2, 1000, 1499, 169.00, 3.0),
  (3, 2, 1500, 1999, 179.00, 3.5),
  (3, 2, 2000, 2499, 189.00, 3.5),
  (3, 2.5, 2000, 2499, 199.00, 4.0),
  (3, 3, 2500, 2999, 219.00, 4.0);

-- 4BR
INSERT INTO pricing_matrix (bedrooms, bathrooms, sqft_min, sqft_max, base_price, estimated_hours) VALUES
  (4, 2, 1500, 1999, 199.00, 3.5),
  (4, 2.5, 2000, 2499, 219.00, 4.0),
  (4, 3, 2500, 2999, 239.00, 4.5),
  (4, 3, 3000, 3499, 259.00, 5.0),
  (4, 3.5, 3500, 3999, 279.00, 5.0);

-- 5BR+
INSERT INTO pricing_matrix (bedrooms, bathrooms, sqft_min, sqft_max, base_price, estimated_hours) VALUES
  (5, 3, 2500, 2999, 269.00, 5.0),
  (5, 3.5, 3000, 3499, 289.00, 5.5),
  (5, 4, 3500, 3999, 319.00, 6.0),
  (5, 4, 4000, 4999, 349.00, 6.5),
  (5, 4.5, 5000, 9999, 399.00, 7.0);

-- Extras (from BookingKoala data)
INSERT INTO extras (name, description, price, category, is_per_unit, max_quantity, sort_order) VALUES
  ('Inside Fridge', 'Deep clean inside refrigerator', 35.00, 'kitchen', false, 1, 1),
  ('Inside Oven', 'Deep clean inside oven', 35.00, 'kitchen', false, 1, 2),
  ('Inside Cabinets', 'Clean inside kitchen cabinets', 40.00, 'kitchen', false, 1, 3),
  ('Laundry (wash & fold)', 'Wash, dry, and fold laundry', 30.00, 'laundry', true, 3, 4),
  ('Interior Windows', 'Clean all interior windows', 45.00, 'windows', false, 1, 5),
  ('Baseboards (detailed)', 'Detailed baseboard cleaning', 30.00, 'detail', false, 1, 6),
  ('Blinds Cleaning', 'Dust and clean all blinds', 35.00, 'windows', false, 1, 7),
  ('Wall Spot Cleaning', 'Spot clean walls and scuff marks', 25.00, 'detail', false, 1, 8),
  ('Garage Sweep', 'Sweep and tidy garage floor', 40.00, 'exterior', false, 1, 9),
  ('Patio/Balcony', 'Clean patio or balcony area', 30.00, 'exterior', false, 1, 10),
  ('Deep Clean Add-on', 'Extra deep cleaning for all rooms', 75.00, 'deep', false, 1, 11),
  ('Move-In/Move-Out', 'Comprehensive move cleaning', 100.00, 'deep', false, 1, 12),
  ('Pet Hair Treatment', 'Extra pet hair removal treatment', 25.00, 'specialty', false, 1, 13),
  ('Green/Eco Products', 'Use eco-friendly cleaning products', 15.00, 'specialty', false, 1, 14);

-- Default tax rate
INSERT INTO tax_rates (name, rate, zip_codes) VALUES
  ('Texas Sales Tax', 0.0750, '{}');

-- Service areas (from BookingKoala data - DFW + Houston)
INSERT INTO service_areas (zip_code, city, state) VALUES
  ('75001', 'Addison', 'TX'),
  ('75002', 'Allen', 'TX'),
  ('75006', 'Carrollton', 'TX'),
  ('75007', 'Carrollton', 'TX'),
  ('75010', 'Carrollton', 'TX'),
  ('75019', 'Coppell', 'TX'),
  ('75023', 'Plano', 'TX'),
  ('75024', 'Plano', 'TX'),
  ('75025', 'Plano', 'TX'),
  ('75034', 'Frisco', 'TX'),
  ('75035', 'Frisco', 'TX'),
  ('75039', 'Irving', 'TX'),
  ('75056', 'The Colony', 'TX'),
  ('75062', 'Irving', 'TX'),
  ('75063', 'Irving', 'TX'),
  ('75070', 'McKinney', 'TX'),
  ('75071', 'McKinney', 'TX'),
  ('75075', 'Plano', 'TX'),
  ('75080', 'Richardson', 'TX'),
  ('75081', 'Richardson', 'TX'),
  ('75082', 'Richardson', 'TX'),
  ('75093', 'Plano', 'TX'),
  ('75201', 'Dallas', 'TX'),
  ('75204', 'Dallas', 'TX'),
  ('75205', 'Dallas', 'TX'),
  ('75206', 'Dallas', 'TX'),
  ('75209', 'Dallas', 'TX'),
  ('75214', 'Dallas', 'TX'),
  ('75219', 'Dallas', 'TX'),
  ('75225', 'Dallas', 'TX'),
  ('75230', 'Dallas', 'TX'),
  ('75240', 'Dallas', 'TX'),
  ('75248', 'Dallas', 'TX'),
  ('75252', 'Dallas', 'TX'),
  ('75254', 'Dallas', 'TX'),
  ('77002', 'Houston', 'TX'),
  ('77003', 'Houston', 'TX'),
  ('77004', 'Houston', 'TX'),
  ('77005', 'Houston', 'TX'),
  ('77006', 'Houston', 'TX'),
  ('77007', 'Houston', 'TX'),
  ('77008', 'Houston', 'TX'),
  ('77019', 'Houston', 'TX'),
  ('77024', 'Houston', 'TX'),
  ('77025', 'Houston', 'TX'),
  ('77027', 'Houston', 'TX'),
  ('77030', 'Houston', 'TX'),
  ('77035', 'Houston', 'TX'),
  ('77042', 'Houston', 'TX'),
  ('77056', 'Houston', 'TX');

-- System settings
INSERT INTO system_settings (key, value, description) VALUES
  ('company_name', '"Hygiene Maids"', 'Company display name'),
  ('company_email', '"hygienemaids@gmail.com"', 'Primary contact email'),
  ('company_phone', '""', 'Primary contact phone'),
  ('booking_lead_time_hours', '24', 'Minimum hours before a booking can be scheduled'),
  ('booking_cancellation_hours', '24', 'Minimum hours before booking to allow free cancellation'),
  ('default_provider_payout_pct', '40', 'Default provider payout percentage'),
  ('max_bookings_per_day_per_provider', '4', 'Maximum bookings per provider per day'),
  ('business_hours_start', '"08:00"', 'Business start time'),
  ('business_hours_end', '"18:00"', 'Business end time'),
  ('time_slot_interval_minutes', '30', 'Time slot interval in minutes');
