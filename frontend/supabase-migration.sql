-- ============================================================
-- DELIVERY GÇö Full Database Migration
-- CREATE TABLE + RLS + Auth Hook + Triggers + Indexes
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. EXTENSION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id UUID NOT NULL UNIQUE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'SENDER' CHECK (role IN ('SENDER','COURIER','ADMIN')),
  profile_photo_url TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SENDER PROFILES
CREATE TABLE IF NOT EXISTS public.sender_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_type TEXT,
  default_pickup_address TEXT,
  preferred_contact_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ONBOARDING SESSIONS
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 4,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  is_submitted BOOLEAN NOT NULL DEFAULT false,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  national_id_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  motorcycle_plate TEXT,
  association_code TEXT,
  jacket_serial_number TEXT,
  operating_zone TEXT,
  momo_number TEXT,
  momo_provider TEXT,
  selfie_url TEXT,
  id_photo_url TEXT,
  vehicle_photo_front_url TEXT,
  vehicle_photo_rear_url TEXT,
  license_photo_url TEXT,
  jacket_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. COURIERS
CREATE TABLE IF NOT EXISTS public.couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  national_id_number TEXT,
  motorcycle_plate TEXT,
  association_code TEXT,
  jacket_serial_number TEXT,
  operating_zone TEXT,
  selfie_url TEXT,
  id_photo_url TEXT,
  vehicle_photo_front_url TEXT,
  vehicle_photo_rear_url TEXT,
  license_photo_url TEXT,
  jacket_photo_url TEXT,
  verification_tier TEXT NOT NULL DEFAULT 'BASIC' CHECK (verification_tier IN ('BASIC','IDENTITY','VEHICLE','TRUSTED')),
  is_approved_by_admin BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_location_at TIMESTAMPTZ,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  completion_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
  reliability_score DOUBLE PRECISION NOT NULL DEFAULT 100,
  total_earnings DOUBLE PRECISION NOT NULL DEFAULT 0,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  momo_number TEXT,
  momo_provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. COURIER LOCATIONS
CREATE TABLE IF NOT EXISTS public.courier_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  delivery_id UUID,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DELIVERIES
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  courier_id UUID REFERENCES public.couriers(id),
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_notes TEXT,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  dropoff_notes TEXT,
  distance_km DOUBLE PRECISION,
  item_description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'OTHER' CHECK (category IN ('DOCUMENT','FOOD','ELECTRONICS','CLOTHING','PHARMACY','FRAGILE','OTHER')),
  size TEXT NOT NULL DEFAULT 'SMALL' CHECK (size IN ('SMALL','MEDIUM','LARGE')),
  estimated_value_rwf DOUBLE PRECISION,
  is_fragile BOOLEAN NOT NULL DEFAULT false,
  requires_recipient_otp BOOLEAN NOT NULL DEFAULT true,
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  scheduled_pickup_at TIMESTAMPTZ,
  prefer_asap BOOLEAN NOT NULL DEFAULT true,
  quoted_price_rwf DOUBLE PRECISION,
  final_price_rwf DOUBLE PRECISION,
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH','MOBILE_MONEY','PLATFORM_BALANCE')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','HELD','RELEASED','REFUNDED')),
  pickup_otp_hash TEXT,
  dropoff_otp_hash TEXT,
  recipient_tracking_token TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','BROADCAST','COURIER_ASSIGNED','COURIER_CONFIRMED','PICKUP_EN_ROUTE','ARRIVED_PICKUP','PICKED_UP','IN_TRANSIT','ARRIVED_DROPOFF','DELIVERED','CANCELLED','DISPUTED','FAILED')),
  broadcast_expires_at TIMESTAMPTZ,
  assignment_expires_at TIMESTAMPTZ,
  pickup_photo_url TEXT,
  dropoff_photo_url TEXT,
  recipient_signature_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 7. COURIER INTERESTS
CREATE TABLE IF NOT EXISTS public.courier_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  proposed_price_rwf DOUBLE PRECISION,
  eta_minutes INTEGER,
  expressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_selected BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(delivery_id, courier_id)
);

-- 8. DELIVERY EVENTS
CREATE TABLE IF NOT EXISTS public.delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('DELIVERY_CREATED','BROADCAST_SENT','COURIER_INTERESTED','COURIER_SELECTED','COURIER_CONFIRMED','COURIER_DEPARTED_PICKUP','COURIER_ARRIVED_PICKUP','PICKUP_OTP_SENT','PICKUP_OTP_CONFIRMED','PACKAGE_PICKED_UP','LOCATION_UPDATE','COURIER_ARRIVED_DROPOFF','DROPOFF_OTP_SENT','DROPOFF_OTP_CONFIRMED','DELIVERY_COMPLETED','DELIVERY_CANCELLED','DISPUTE_RAISED','DISPUTE_RESOLVED','CHAT_MESSAGE_SENT')),
  metadata JSONB,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  body TEXT NOT NULL,
  photo_url TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. RATINGS
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL UNIQUE REFERENCES public.deliveries(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES public.users(id),
  receiver_id UUID NOT NULL REFERENCES public.users(id),
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. DISPUTES
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL UNIQUE REFERENCES public.deliveries(id) ON DELETE CASCADE,
  raised_by_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED_SENDER','RESOLVED_COURIER','CLOSED')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courier_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courier_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disputes ENABLE ROW LEVEL SECURITY;

-- Users RLS
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = supabase_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = supabase_id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
CREATE POLICY "Admins can read all profiles"
  ON public.users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_id = auth.uid() AND role = 'ADMIN')
  );

-- Couriers RLS
DROP POLICY IF EXISTS "Couriers can read own profile" ON public.couriers;
CREATE POLICY "Couriers can read own profile"
  ON public.couriers FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));

DROP POLICY IF EXISTS "Couriers can update own profile" ON public.couriers;
CREATE POLICY "Couriers can update own profile"
  ON public.couriers FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can read verified couriers" ON public.couriers;
CREATE POLICY "Anyone can read verified couriers"
  ON public.couriers FOR SELECT
  USING (is_approved_by_admin = true);

-- Sender Profiles RLS
DROP POLICY IF EXISTS "Users can read own sender profile" ON public.sender_profiles;
CREATE POLICY "Users can read own sender profile"
  ON public.sender_profiles FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own sender profile" ON public.sender_profiles;
CREATE POLICY "Users can update own sender profile"
  ON public.sender_profiles FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));

-- Onboarding Sessions RLS
DROP POLICY IF EXISTS "Users can read own onboarding" ON public.onboarding_sessions;
CREATE POLICY "Users can read own onboarding"
  ON public.onboarding_sessions FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own onboarding" ON public.onboarding_sessions;
CREATE POLICY "Users can update own onboarding"
  ON public.onboarding_sessions FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));

-- Deliveries RLS
DROP POLICY IF EXISTS "Senders can read own deliveries" ON public.deliveries;
CREATE POLICY "Senders can read own deliveries"
  ON public.deliveries FOR SELECT
  USING (sender_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));

DROP POLICY IF EXISTS "Assigned couriers can read deliveries" ON public.deliveries;
CREATE POLICY "Assigned couriers can read deliveries"
  ON public.deliveries FOR SELECT
  USING (courier_id IN (SELECT id FROM public.couriers WHERE user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid())));

DROP POLICY IF EXISTS "Anyone can read available deliveries" ON public.deliveries;
CREATE POLICY "Anyone can read available deliveries"
  ON public.deliveries FOR SELECT
  USING (status = 'BROADCAST');

-- ============================================================
-- AUTH HOOK: Custom JWT Claims
-- ============================================================
CREATE OR REPLACE FUNCTION public.delivery_jwt_claims()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'role', (SELECT role::text FROM public.users WHERE supabase_id = auth.uid()),
    'delivery_role', (SELECT role::text FROM public.users WHERE supabase_id = auth.uid())
  );
$$;

-- ============================================================
-- TRIGGER: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_users_timestamp ON public.users;
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_couriers_timestamp ON public.couriers;
CREATE TRIGGER update_couriers_timestamp
  BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_deliveries_timestamp ON public.deliveries;
CREATE TRIGGER update_deliveries_timestamp
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_sender_profiles_timestamp ON public.sender_profiles;
CREATE TRIGGER update_sender_profiles_timestamp
  BEFORE UPDATE ON public.sender_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_onboarding_sessions_timestamp ON public.onboarding_sessions;
CREATE TRIGGER update_onboarding_sessions_timestamp
  BEFORE UPDATE ON public.onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_disputes_timestamp ON public.disputes;
CREATE TRIGGER update_disputes_timestamp
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_courier_locations_courier_recorded ON public.courier_locations(courier_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_sender ON public.deliveries(sender_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_courier ON public.deliveries(courier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery_occurred ON public.delivery_events(delivery_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_delivery_sent ON public.chat_messages(delivery_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON public.users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_couriers_online ON public.couriers(is_online, is_approved_by_admin);
CREATE INDEX IF NOT EXISTS idx_couriers_user ON public.couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.onboarding_sessions(user_id);

-- ============================================================
-- WALLETS & WITHDRAWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'fee', 'withdrawal', 'refund')),
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  method TEXT NOT NULL DEFAULT 'mobile_money',
  provider TEXT,
  account_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delivery additional columns
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS agreed_delivery_time INTEGER;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_started_at TIMESTAMPTZ;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS courier_arrived_at TIMESTAMPTZ;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS payment_held_at TIMESTAMPTZ;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMPTZ;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS dropoff_otp_sent_at TIMESTAMPTZ;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_wallet_id ON public.withdrawal_requests(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
