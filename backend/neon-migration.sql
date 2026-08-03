-- ============================================================
-- DELIVERY — Neon PostgreSQL Migration
-- Matches prisma/schema.prisma exactly.
--
-- Usage:
--   Option A (recommended): let Prisma manage it —
--     npx prisma migrate dev   (development)
--     npx prisma migrate deploy (production)
--
--   Option B: paste this into the Neon SQL Editor and run manually.
--
-- NOTE: Prisma uses its own migrations folder (prisma/migrations/).
-- Only use this file if you need a quick manual setup or a reference.
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('SENDER', 'COURIER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CourierVerificationTier" AS ENUM ('BASIC', 'IDENTITY', 'VEHICLE', 'TRUSTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM (
    'DRAFT', 'BROADCAST', 'COURIER_ASSIGNED', 'COURIER_CONFIRMED',
    'PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT',
    'ARRIVED_DROPOFF', 'DELIVERED', 'CANCELLED', 'DISPUTED', 'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PackageCategory" AS ENUM (
    'DOCUMENT', 'FOOD', 'ELECTRONICS', 'CLOTHING', 'PHARMACY', 'FRAGILE', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PackageSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'PLATFORM_BALANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'HELD', 'RELEASED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeStatus" AS ENUM (
    'OPEN', 'UNDER_REVIEW', 'RESOLVED_SENDER', 'RESOLVED_COURIER', 'CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EventType" AS ENUM (
    'DELIVERY_CREATED', 'BROADCAST_SENT', 'COURIER_INTERESTED', 'COURIER_SELECTED',
    'COURIER_CONFIRMED', 'COURIER_DEPARTED_PICKUP', 'COURIER_ARRIVED_PICKUP',
    'PICKUP_OTP_SENT', 'PICKUP_OTP_CONFIRMED', 'PACKAGE_PICKED_UP', 'PACKAGE_IN_TRANSIT',
    'LOCATION_UPDATE', 'COURIER_ARRIVED_DROPOFF', 'DROPOFF_OTP_SENT',
    'DROPOFF_OTP_CONFIRMED', 'DELIVERY_COMPLETED', 'DELIVERY_CANCELLED',
    'DISPUTE_RAISED', 'DISPUTE_RESOLVED', 'CHAT_MESSAGE_SENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTransactionType" AS ENUM ('credit', 'debit', 'fee', 'withdrawal', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTransactionStatus" AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WithdrawalStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email            TEXT        UNIQUE,
  phone            TEXT        UNIQUE,
  password_hash    TEXT,
  full_name        TEXT,
  role             "UserRole"  NOT NULL DEFAULT 'SENDER',
  profile_photo_url TEXT,
  email_verified   BOOLEAN     NOT NULL DEFAULT false,
  phone_verified   BOOLEAN     NOT NULL DEFAULT false,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. REFRESH TOKENS
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token      TEXT        NOT NULL UNIQUE,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SENDER PROFILES
CREATE TABLE IF NOT EXISTS sender_profiles (
  id                      TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                 TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name           TEXT,
  business_type           TEXT,
  default_pickup_address  TEXT,
  preferred_contact_method TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ONBOARDING SESSIONS
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id                     TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_step           INTEGER     NOT NULL DEFAULT 0,
  total_steps            INTEGER     NOT NULL DEFAULT 4,
  is_complete            BOOLEAN     NOT NULL DEFAULT false,
  is_submitted           BOOLEAN     NOT NULL DEFAULT false,
  full_name              TEXT,
  email                  TEXT,
  phone                  TEXT,
  national_id_number     TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  motorcycle_plate       TEXT,
  association_code       TEXT,
  jacket_serial_number   TEXT,
  operating_zone         TEXT,
  momo_number            TEXT,
  momo_provider          TEXT,
  selfie_url             TEXT,
  id_photo_url           TEXT,
  vehicle_photo_front_url TEXT,
  vehicle_photo_rear_url  TEXT,
  license_photo_url      TEXT,
  jacket_photo_url       TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. COURIERS
CREATE TABLE IF NOT EXISTS couriers (
  id                     TEXT                      PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                TEXT                      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  national_id_number     TEXT,
  motorcycle_plate       TEXT,
  association_code       TEXT,
  jacket_serial_number   TEXT,
  operating_zone         TEXT,
  selfie_url             TEXT,
  id_photo_url           TEXT,
  vehicle_photo_front_url TEXT,
  vehicle_photo_rear_url  TEXT,
  license_photo_url      TEXT,
  jacket_photo_url       TEXT,
  verification_tier      "CourierVerificationTier" NOT NULL DEFAULT 'BASIC',
  is_approved_by_admin   BOOLEAN                   NOT NULL DEFAULT false,
  admin_notes            TEXT,
  is_online              BOOLEAN                   NOT NULL DEFAULT false,
  current_lat            DOUBLE PRECISION,
  current_lng            DOUBLE PRECISION,
  last_location_at       TIMESTAMPTZ,
  total_deliveries       INTEGER                   NOT NULL DEFAULT 0,
  completion_rate        DOUBLE PRECISION          NOT NULL DEFAULT 0,
  avg_rating             DOUBLE PRECISION          NOT NULL DEFAULT 0,
  reliability_score      DOUBLE PRECISION          NOT NULL DEFAULT 100,
  total_earnings         DOUBLE PRECISION          NOT NULL DEFAULT 0,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  momo_number            TEXT,
  momo_provider          TEXT,
  created_at             TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

-- 6. COURIER LOCATIONS
CREATE TABLE IF NOT EXISTS courier_locations (
  id          TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  courier_id  TEXT             NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  delivery_id TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  accuracy    DOUBLE PRECISION,
  heading     DOUBLE PRECISION,
  speed       DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- 7. DELIVERIES
CREATE TABLE IF NOT EXISTS deliveries (
  id                     TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tracking_code          TEXT             NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  sender_id              TEXT             NOT NULL REFERENCES users(id),
  courier_id             TEXT             REFERENCES couriers(id),
  pickup_address         TEXT             NOT NULL,
  pickup_lat             DOUBLE PRECISION NOT NULL,
  pickup_lng             DOUBLE PRECISION NOT NULL,
  pickup_notes           TEXT,
  pickup_email           TEXT,
  dropoff_address        TEXT             NOT NULL,
  dropoff_lat            DOUBLE PRECISION NOT NULL,
  dropoff_lng            DOUBLE PRECISION NOT NULL,
  dropoff_notes          TEXT,
  dropoff_email          TEXT,
  distance_km            DOUBLE PRECISION,
  item_description       TEXT             NOT NULL,
  category               "PackageCategory" NOT NULL DEFAULT 'OTHER',
  size                   "PackageSize"    NOT NULL DEFAULT 'SMALL',
  estimated_value_rwf    DOUBLE PRECISION,
  is_fragile             BOOLEAN          NOT NULL DEFAULT false,
  requires_recipient_otp BOOLEAN          NOT NULL DEFAULT true,
  pickup_contact_name    TEXT             NOT NULL,
  pickup_contact_phone   TEXT             NOT NULL,
  recipient_name         TEXT             NOT NULL,
  recipient_phone        TEXT             NOT NULL,
  scheduled_pickup_at    TIMESTAMPTZ,
  prefer_asap            BOOLEAN          NOT NULL DEFAULT true,
  quoted_price_rwf       DOUBLE PRECISION,
  final_price_rwf        DOUBLE PRECISION,
  agreed_price_rwf       DOUBLE PRECISION,
  agreed_delivery_time   INTEGER,
  payment_method         "PaymentMethod"  NOT NULL DEFAULT 'CASH',
  payment_status         "PaymentStatus"  NOT NULL DEFAULT 'PENDING',
  payment_held_at        TIMESTAMPTZ,
  payment_released_at    TIMESTAMPTZ,
  pickup_otp_hash        TEXT,
  dropoff_otp_hash       TEXT,
  otp_verified_at        TIMESTAMPTZ,
  recipient_tracking_token TEXT           UNIQUE,
  status                 "DeliveryStatus" NOT NULL DEFAULT 'DRAFT',
  broadcast_expires_at   TIMESTAMPTZ,
  assignment_expires_at  TIMESTAMPTZ,
  delivery_started_at    TIMESTAMPTZ,
  courier_arrived_at     TIMESTAMPTZ,
  dropoff_otp_sent_at    TIMESTAMPTZ,
  pickup_photo_url       TEXT,
  dropoff_photo_url      TEXT,
  recipient_signature_url TEXT,
  picked_up_at           TIMESTAMPTZ,
  delivered_at           TIMESTAMPTZ,
  cancelled_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- 8. COURIER INTERESTS
CREATE TABLE IF NOT EXISTS courier_interests (
  id               TEXT             PRIMARY KEY DEFAULT gen_random_uuid()::text,
  delivery_id      TEXT             NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  courier_id       TEXT             NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  proposed_price_rwf DOUBLE PRECISION,
  eta_minutes      INTEGER,
  expressed_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  is_selected      BOOLEAN          NOT NULL DEFAULT false,
  UNIQUE (delivery_id, courier_id)
);

-- 9. DELIVERY EVENTS
CREATE TABLE IF NOT EXISTS delivery_events (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  delivery_id TEXT        NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  user_id     TEXT        REFERENCES users(id),
  event_type  "EventType" NOT NULL,
  metadata    JSONB,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  delivery_id TEXT        NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  sender_id   TEXT        NOT NULL REFERENCES users(id),
  body        TEXT        NOT NULL,
  photo_url   TEXT,
  is_template BOOLEAN     NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. RATINGS
CREATE TABLE IF NOT EXISTS ratings (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  delivery_id TEXT        NOT NULL UNIQUE REFERENCES deliveries(id) ON DELETE CASCADE,
  giver_id    TEXT        NOT NULL REFERENCES users(id),
  receiver_id TEXT        NOT NULL REFERENCES users(id),
  stars       INTEGER     NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. DISPUTES
CREATE TABLE IF NOT EXISTS disputes (
  id           TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::text,
  delivery_id  TEXT           NOT NULL UNIQUE REFERENCES deliveries(id) ON DELETE CASCADE,
  raised_by_id TEXT           NOT NULL,
  reason       TEXT           NOT NULL,
  description  TEXT,
  evidence_urls TEXT[]        NOT NULL DEFAULT '{}',
  status       "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  resolution   TEXT,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 13. WALLETS
CREATE TABLE IF NOT EXISTS wallets (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance    DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id             TEXT                     PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_id      TEXT                     NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type           "WalletTransactionType"  NOT NULL,
  description    TEXT                     NOT NULL,
  amount         DOUBLE PRECISION         NOT NULL,
  reference_type TEXT,
  reference_id   TEXT,
  status         "WalletTransactionStatus" NOT NULL DEFAULT 'completed',
  metadata       JSONB,
  created_at     TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

-- 15. WITHDRAWAL REQUESTS
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id             TEXT               PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_id      TEXT               NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id        TEXT               NOT NULL,
  amount         DOUBLE PRECISION   NOT NULL,
  method         TEXT               NOT NULL DEFAULT 'mobile_money',
  provider       TEXT,
  account_number TEXT,
  status         "WithdrawalStatus" NOT NULL DEFAULT 'pending',
  reference      TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','sender_profiles','onboarding_sessions','couriers',
    'deliveries','disputes','wallets','withdrawal_requests'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$s;
       CREATE TRIGGER trg_%1$s_updated_at
         BEFORE UPDATE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION update_timestamp();', t);
  END LOOP;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user        ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_courier_locations_courier  ON courier_locations(courier_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_status          ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_sender          ON deliveries(sender_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_courier         ON deliveries(courier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery   ON delivery_events(delivery_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_delivery     ON chat_messages(delivery_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_users_role                 ON users(role);
CREATE INDEX IF NOT EXISTS idx_couriers_online            ON couriers(is_online, is_approved_by_admin);
CREATE INDEX IF NOT EXISTS idx_couriers_user              ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_user            ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet           ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created          ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_wallet          ON withdrawal_requests(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_user            ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status          ON withdrawal_requests(status);
