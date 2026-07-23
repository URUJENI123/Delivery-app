# DELIVERY — Mobile App Integration Documentation

> **Platform**: On-demand motorcycle delivery service (Rwanda / Kigali)
> **Backend**: NestJS 10 + Supabase (PostgREST)
> **Web**: Next.js 16 App Router (reference implementation)
> **Auth**: Supabase Auth (email/password, Google OAuth, phone OTP)
> **Real-time**: Socket.IO (namespace `/ws`)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Supabase Project & Database Schema](#3-supabase-project--database-schema)
4. [Backend Architecture](#4-backend-architecture)
5. [API Reference — Full Endpoints](#5-api-reference--full-endpoints)
6. [Authentication & Authorization Flows](#6-authentication--authorization-flows)
7. [Delivery State Machine (Lifecycle)](#7-delivery-state-machine-lifecycle)
8. [Wallet & Escrow System](#8-wallet--escrow-system)
9. [WebSocket Events (Real-time)](#9-websocket-events-real-time)
10. [File Uploads (Cloudflare R2)](#10-file-uploads-cloudflare-r2)
11. [Frontend Architecture (Reference)](#11-frontend-architecture-reference)
12. [UI/UX Design System](#12-uiux-design-system)
13. [Environment Variables](#13-environment-variables)
14. [Error Handling](#14-error-handling)

---

## 1. Project Overview

DELIVERY connects **senders** who need items transported with **motorcycle couriers** in Kigali, Rwanda. The platform manages the full lifecycle:

1. Sender creates a delivery → broadcast to nearby couriers
2. Courier takes the job → negotiates price → confirms agreement
3. Sender pays (escrow) → courier picks up → delivers → OTP verification
4. Payment released to courier wallet → rating

**Key Roles:**
- **SENDER** — Creates deliveries, pays for service, tracks live
- **COURIER** — Receives job alerts, performs deliveries, earns money
- **ADMIN** — Verifies couriers, manages disputes, views analytics

---

## 2. Tech Stack

### Backend (`@delivery/api`)
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.3+ | Framework (controllers, services, guards, modules) |
| @nestjs/core | 11.x | Core framework |
| @supabase/supabase-js | 2.39+ | Database client (service_role key — bypasses RLS) |
| bcrypt | 5.x | OTP hashing |
| class-validator | 0.14 | DTO validation |
| @nestjs/throttler | 6.5 | Rate limiting |
| @nestjs/platform-socket.io | 11.x | WebSockets |
| socket.io | 4.7 | WebSocket engine |
| @aws-sdk/client-s3 | 3.500 | Cloudflare R2 (S3-compatible) storage |
| class-transformer | 0.5 | Serialization |
| dotenv | 17.x | Environment config |

### Frontend (`@delivery/web`)
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework (App Router) |
| React | 18.x | UI library |
| Zustand | 4.5 | State management |
| Tailwind CSS | 3.4 | Styling |
| framer-motion | 12.x | Animations |
| maplibre-gl | 5.x | Map rendering |
| react-map-gl | 8.x | Map React wrapper |
| openrouteservice-js | 0.4 | Geocoding + directions |
| socket.io-client | 4.7 | WebSocket client |
| recharts | 3.x | Charts (admin) |
| lucide-react | 0.303 | Icons |
| react-hook-form + zod | 7 + 3 | Form validation |
| @supabase/supabase-js | 2.39 | Google OAuth (client-side) |

### Infrastructure
| Service | Usage |
|---------|-------|
| **Supabase** | Auth + Database (Postgres) + API (PostgREST) |
| **Cloudflare R2** | File storage (S3-compatible) |
| **MapTiler** | Map tile provider |
| **OpenRouteService** | Geocoding, reverse geocoding, routing |

---

## 3. Supabase Project & Database Schema

**Supabase Project URL**: `https://bkxkrrinthmknteoqnkr.supabase.co`

### Database Connection
```
postgresql://postgres:Dieu12done%231@db.bkxkrrinthmknteoqnkr.supabase.co:5432/postgres
```

### All Tables (snake_case columns)

#### 3.1 `public.users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| supabase_id | UUID | NOT NULL, UNIQUE |
| email | TEXT | UNIQUE |
| phone | TEXT | UNIQUE |
| full_name | TEXT | |
| role | TEXT | NOT NULL, CHECK: SENDER, COURIER, ADMIN |
| profile_photo_url | TEXT | |
| email_verified | BOOLEAN | NOT NULL, DEFAULT false |
| phone_verified | BOOLEAN | NOT NULL, DEFAULT false |
| is_active | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Indexes**: `idx_users_supabase_id` (supabase_id), `idx_users_role` (role)

#### 3.2 `public.sender_profiles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | NOT NULL, UNIQUE, FK → users(id) ON DELETE CASCADE |
| business_name | TEXT | |
| business_type | TEXT | |
| default_pickup_address | TEXT | |
| preferred_contact_method | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### 3.3 `public.onboarding_sessions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | NOT NULL, UNIQUE, FK → users(id) ON DELETE CASCADE |
| current_step | INTEGER | NOT NULL, DEFAULT 0 |
| total_steps | INTEGER | NOT NULL, DEFAULT 4 |
| is_complete | BOOLEAN | DEFAULT false |
| is_submitted | BOOLEAN | DEFAULT false |
| full_name | TEXT | |
| email | TEXT | |
| phone | TEXT | |
| national_id_number | TEXT | |
| emergency_contact_name | TEXT | |
| emergency_contact_phone | TEXT | |
| motorcycle_plate | TEXT | |
| association_code | TEXT | |
| jacket_serial_number | TEXT | |
| operating_zone | TEXT | |
| momo_number | TEXT | |
| momo_provider | TEXT | |
| selfie_url | TEXT | |
| id_photo_url | TEXT | |
| vehicle_photo_front_url | TEXT | |
| vehicle_photo_rear_url | TEXT | |
| license_photo_url | TEXT | |
| jacket_photo_url | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Index**: `idx_onboarding_user` (user_id)

#### 3.4 `public.couriers`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | NOT NULL, UNIQUE, FK → users(id) ON DELETE CASCADE |
| national_id_number | TEXT | |
| motorcycle_plate | TEXT | |
| association_code | TEXT | |
| jacket_serial_number | TEXT | |
| operating_zone | TEXT | |
| selfie_url | TEXT | |
| id_photo_url | TEXT | |
| vehicle_photo_front_url | TEXT | |
| vehicle_photo_rear_url | TEXT | |
| license_photo_url | TEXT | |
| jacket_photo_url | TEXT | |
| verification_tier | TEXT | NOT NULL, DEFAULT BASIC — CHECK: BASIC, IDENTITY, VEHICLE, TRUSTED |
| is_approved_by_admin | BOOLEAN | NOT NULL, DEFAULT false |
| admin_notes | TEXT | |
| is_online | BOOLEAN | NOT NULL, DEFAULT false |
| current_lat | DOUBLE PRECISION | |
| current_lng | DOUBLE PRECISION | |
| last_location_at | TIMESTAMPTZ | |
| total_deliveries | INTEGER | NOT NULL, DEFAULT 0 |
| completion_rate | DOUBLE PRECISION | NOT NULL, DEFAULT 0 |
| avg_rating | DOUBLE PRECISION | NOT NULL, DEFAULT 0 |
| reliability_score | DOUBLE PRECISION | NOT NULL, DEFAULT 100 |
| total_earnings | DOUBLE PRECISION | NOT NULL, DEFAULT 0 |
| emergency_contact_name | TEXT | |
| emergency_contact_phone | TEXT | |
| momo_number | TEXT | |
| momo_provider | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**: `idx_couriers_online` (is_online, is_approved_by_admin), `idx_couriers_user` (user_id)

#### 3.5 `public.courier_locations`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| courier_id | UUID | NOT NULL, FK → couriers(id) ON DELETE CASCADE |
| delivery_id | UUID | |
| lat | DOUBLE PRECISION | NOT NULL |
| lng | DOUBLE PRECISION | NOT NULL |
| accuracy | DOUBLE PRECISION | |
| heading | DOUBLE PRECISION | |
| speed | DOUBLE PRECISION | |
| recorded_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Index**: `idx_courier_locations_courier_recorded` (courier_id, recorded_at)

#### 3.6 `public.deliveries` (core table)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tracking_code | TEXT | NOT NULL, UNIQUE |
| sender_id | UUID | NOT NULL, FK → users(id) |
| courier_id | UUID | FK → couriers(id) |
| pickup_address | TEXT | NOT NULL |
| pickup_lat | DOUBLE PRECISION | NOT NULL |
| pickup_lng | DOUBLE PRECISION | NOT NULL |
| pickup_notes | TEXT | |
| pickup_email | TEXT | (added via ALTER TABLE) |
| dropoff_address | TEXT | NOT NULL |
| dropoff_lat | DOUBLE PRECISION | NOT NULL |
| dropoff_lng | DOUBLE PRECISION | NOT NULL |
| dropoff_notes | TEXT | |
| dropoff_email | TEXT | (added via ALTER TABLE) |
| distance_km | DOUBLE PRECISION | |
| item_description | TEXT | NOT NULL |
| category | TEXT | NOT NULL, CHECK: DOCUMENT, FOOD, ELECTRONICS, CLOTHING, PHARMACY, FRAGILE, OTHER |
| size | TEXT | NOT NULL, CHECK: SMALL, MEDIUM, LARGE |
| estimated_value_rwf | DOUBLE PRECISION | |
| is_fragile | BOOLEAN | DEFAULT false |
| requires_recipient_otp | BOOLEAN | DEFAULT true |
| pickup_contact_name | TEXT | NOT NULL |
| pickup_contact_phone | TEXT | NOT NULL |
| recipient_name | TEXT | NOT NULL |
| recipient_phone | TEXT | NOT NULL |
| scheduled_pickup_at | TIMESTAMPTZ | |
| prefer_asap | BOOLEAN | DEFAULT true |
| quoted_price_rwf | DOUBLE PRECISION | |
| final_price_rwf | DOUBLE PRECISION | |
| agreed_price_rwf | DOUBLE PRECISION | (added via ALTER TABLE) |
| agreed_delivery_time | INTEGER | (added via ALTER TABLE) — minutes |
| payment_method | TEXT | NOT NULL, CHECK: CASH, MOBILE_MONEY, PLATFORM_BALANCE |
| payment_status | TEXT | NOT NULL, CHECK: PENDING, HELD, RELEASED, REFUNDED |
| pickup_otp_hash | TEXT | bcrypt-hashed 6-digit code |
| dropoff_otp_hash | TEXT | bcrypt-hashed 6-digit code |
| recipient_tracking_token | TEXT | UNIQUE |
| status | TEXT | NOT NULL, CHECK: 13 states (see §7) |
| broadcast_expires_at | TIMESTAMPTZ | |
| assignment_expires_at | TIMESTAMPTZ | |
| pickup_photo_url | TEXT | |
| dropoff_photo_url | TEXT | |
| recipient_signature_url | TEXT | |
| delivery_started_at | TIMESTAMPTZ | |
| courier_arrived_at | TIMESTAMPTZ | |
| payment_held_at | TIMESTAMPTZ | |
| payment_released_at | TIMESTAMPTZ | |
| dropoff_otp_sent_at | TIMESTAMPTZ | |
| otp_verified_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| picked_up_at | TIMESTAMPTZ | |
| delivered_at | TIMESTAMPTZ | |
| cancelled_at | TIMESTAMPTZ | |

**Indexes**: `idx_deliveries_status`, `idx_deliveries_sender`, `idx_deliveries_courier`

#### 3.7 `public.courier_interests`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| delivery_id | UUID | NOT NULL, FK → deliveries(id) ON DELETE CASCADE |
| courier_id | UUID | NOT NULL, FK → couriers(id) ON DELETE CASCADE |
| proposed_price_rwf | DOUBLE PRECISION | |
| eta_minutes | INTEGER | |
| expressed_at | TIMESTAMPTZ | DEFAULT NOW() |
| is_selected | BOOLEAN | DEFAULT false |
| **UNIQUE**(delivery_id, courier_id) | | |

#### 3.8 `public.delivery_events`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| delivery_id | UUID | NOT NULL, FK → deliveries(id) ON DELETE CASCADE |
| user_id | UUID | FK → users(id) |
| event_type | TEXT | NOT NULL, CHECK: 17 event types |
| metadata | JSONB | |
| lat | DOUBLE PRECISION | |
| lng | DOUBLE PRECISION | |
| occurred_at | TIMESTAMPTZ | DEFAULT NOW() |

**Index**: `idx_delivery_events_delivery_occurred` (delivery_id, occurred_at)

#### 3.9 `public.chat_messages`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| delivery_id | UUID | NOT NULL, FK → deliveries(id) ON DELETE CASCADE |
| sender_id | UUID | NOT NULL, FK → users(id) |
| body | TEXT | NOT NULL |
| photo_url | TEXT | |
| is_template | BOOLEAN | DEFAULT false |
| read_at | TIMESTAMPTZ | |
| sent_at | TIMESTAMPTZ | DEFAULT NOW() |

**Index**: `idx_chat_messages_delivery_sent` (delivery_id, sent_at)

#### 3.10 `public.ratings`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| delivery_id | UUID | NOT NULL, UNIQUE, FK → deliveries(id) ON DELETE CASCADE |
| giver_id | UUID | NOT NULL, FK → users(id) |
| receiver_id | UUID | NOT NULL, FK → users(id) |
| stars | INTEGER | NOT NULL, CHECK: 1–5 |
| comment | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

#### 3.11 `public.disputes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| delivery_id | UUID | NOT NULL, UNIQUE, FK → deliveries(id) ON DELETE CASCADE |
| raised_by_id | UUID | NOT NULL |
| reason | TEXT | NOT NULL |
| description | TEXT | |
| evidence_urls | TEXT[] | DEFAULT '{}' |
| status | TEXT | NOT NULL, CHECK: OPEN, UNDER_REVIEW, RESOLVED_SENDER, RESOLVED_COURIER, CLOSED |
| resolution | TEXT | |
| resolved_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### 3.12 `public.wallets`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | NOT NULL, UNIQUE, FK → users(id) ON DELETE CASCADE |
| balance | DOUBLE PRECISION | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### 3.13 `public.wallet_transactions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| wallet_id | UUID | NOT NULL, FK → wallets(id) ON DELETE CASCADE |
| type | TEXT | NOT NULL, CHECK: credit, debit, fee, withdrawal, refund |
| description | TEXT | NOT NULL |
| amount | DOUBLE PRECISION | NOT NULL |
| reference_type | TEXT | (e.g., 'delivery') |
| reference_id | TEXT | (e.g., delivery UUID) |
| status | TEXT | NOT NULL, CHECK: pending, completed, failed |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**: `idx_wallet_transactions_wallet_id`, `idx_wallet_transactions_created_at`

#### 3.14 `public.withdrawal_requests`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| wallet_id | UUID | NOT NULL, FK → wallets(id) ON DELETE CASCADE |
| user_id | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE |
| amount | DOUBLE PRECISION | NOT NULL |
| method | TEXT | DEFAULT 'mobile_money' |
| provider | TEXT | |
| account_number | TEXT | |
| status | TEXT | NOT NULL, CHECK: pending, processing, completed, failed |
| reference | TEXT | |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**: `idx_withdrawal_requests_wallet_id`, `idx_withdrawal_requests_user_id`, `idx_withdrawal_requests_status`

### Auth Hook (Custom JWT Claims)
```sql
CREATE OR REPLACE FUNCTION public.delivery_jwt_claims()
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'role', (SELECT role::text FROM public.users WHERE supabase_id = auth.uid()),
    'delivery_role', (SELECT role::text FROM public.users WHERE supabase_id = auth.uid())
  );
$$;
```
**Configure in Supabase Dashboard**: Authentication → Settings → Auth Hooks → JWT customization hook → `public.delivery_jwt_claims()`

### Row Level Security (RLS)
All tables have RLS enabled. Key policies:
- **users**: Users read/update own profile; admins read all
- **couriers**: Courier reads/updates own; anyone reads verified
- **deliveries**: Senders read own; assigned couriers read; anyone reads BROADCAST
- **sender_profiles, onboarding_sessions**: Owner only

> **Important for mobile**: Backend uses `SUPABASE_SERVICE_ROLE_KEY` in `DbService`, bypassing RLS entirely. Mobile clients should use the `anon key` for direct Supabase queries if needed, but all primary data access goes through NestJS REST endpoints with JWT auth.

### Extensions
- `pgcrypto` — gen_random_uuid()

### Triggers (auto-update `updated_at`)
All tables with `updated_at` have a `BEFORE UPDATE` trigger calling `public.update_timestamp()`.

---

## 4. Backend Architecture

### Module Map
```
AppModule
├── CommonModule (global) — DeliveryGateway, HttpExceptionFilter
├── DbModule (global) — DbService (Supabase client)
├── AuthModule — AuthController + AuthService
├── UsersModule — UsersController + UsersService
├── CouriersModule — CouriersController + CouriersService
├── DeliveriesModule — DeliveriesController + DeliveriesService + DeliveryStateMachineService
├── WalletModule — WalletController + WalletService
├── ChatModule — ChatController + ConversationsController + ChatService
├── TrackingModule — TrackingController + TrackingService
├── NotificationsModule — NotificationsService (stub)
├── StorageModule — StorageController + StorageService (R2)
├── AdminModule — AdminController + AdminService
├── SenderModule — SenderController + SenderService
```

### Global Prefix
All API routes are prefixed with `/api/v1`

### Global Guards
- `ThrottlerGuard` — 100 requests per 60s default

### Core File: `db.service.ts`
The `DbService` wraps the Supabase client (service_role key). Key characteristics:
- **Snake_case auto-conversion**: All DB columns use snake_case. `DbService` methods accept camelCase column names and data keys, converting internally via mapping table (103 entries).
- **Methods**: `findOne()`, `findMany()`, `create()`, `update()`, `delete()`, `findOneWithJoin()`, `getClient()`
- **`mapRow()`**: Converts snake_case rows → camelCase recursively
- **`keysToSnake()`**: Converts camelCase keys → snake_case for writes
- For complex queries, use `getClient()` to access raw Supabase client directly (but use snake_case for column names)

### TypeScript Enums (from `types.ts`)
```typescript
enum UserRole { SENDER, COURIER, ADMIN }
enum CourierVerificationTier { BASIC, IDENTITY, VEHICLE, TRUSTED }
enum DeliveryStatus { DRAFT, BROADCAST, COURIER_ASSIGNED, COURIER_CONFIRMED, PICKUP_EN_ROUTE, ARRIVED_PICKUP, PICKED_UP, IN_TRANSIT, ARRIVED_DROPOFF, DELIVERED, CANCELLED, DISPUTED, FAILED }
enum PackageCategory { DOCUMENT, FOOD, ELECTRONICS, CLOTHING, PHARMACY, FRAGILE, OTHER }
enum PackageSize { SMALL, MEDIUM, LARGE }
enum PaymentMethod { CASH, MOBILE_MONEY, PLATFORM_BALANCE }
enum PaymentStatus { PENDING, HELD, RELEASED, REFUNDED }
enum DisputeStatus { OPEN, UNDER_REVIEW, RESOLVED_SENDER, RESOLVED_COURIER, CLOSED }
enum EventType { DELIVERY_CREATED, BROADCAST_SENT, COURIER_INTERESTED, COURIER_SELECTED, COURIER_CONFIRMED, COURIER_DEPARTED_PICKUP, COURIER_ARRIVED_PICKUP, PICKUP_OTP_SENT, PICKUP_OTP_CONFIRMED, PACKAGE_PICKED_UP, LOCATION_UPDATE, COURIER_ARRIVED_DROPOFF, DROPOFF_OTP_SENT, DROPOFF_OTP_CONFIRMED, DELIVERY_COMPLETED, DELIVERY_CANCELLED, DISPUTE_RAISED, DISPUTE_RESOLVED, CHAT_MESSAGE_SENT }
```

---

## 5. API Reference — Full Endpoints

### 5.1 Authentication (`/auth`)

#### POST `/auth/sender/signup`
- **Rate limit**: 5/60s
- **Body**: `{ email: string, password: string (min 6), fullName?: string }`
- **Response**: `{ message: string, user: User }`
- **Flow**: Creates Supabase auth user + local DB user with role=SENDER
- **Note**: Email confirmation required before signin

#### POST `/auth/sender/signin`
- **Rate limit**: 10/60s
- **Body**: `{ email: string, password: string }`
- **Response**: `{ access_token: string, refresh_token: string, user: User }`
- Also sets httpOnly cookies

#### POST `/auth/courier/check-phone`
- **Rate limit**: 10/60s
- **Body**: `{ phone: string (Rwandan +250 format) }`
- **Response**: `{ exists: boolean }`

#### POST `/auth/courier/request-otp`
- **Rate limit**: 3/60s
- **Body**: `{ phone: string }`
- **Response**: `{ exists: boolean, message: string }`
- Sends SMS OTP via Supabase Auth

#### POST `/auth/courier/verify-otp`
- **Rate limit**: 10/60s
- **Body**: `{ phone: string, token: string (OTP) }`
- **Response**: `{ access_token, refresh_token, user, needsOnboarding: boolean }`
- Creates local user if first time

#### POST `/auth/admin/signin`
- **Rate limit**: 5/60s
- **Body**: `{ email: string, password: string }`
- **Response**: `{ access_token, refresh_token, user }`
- Requires role=ADMIN in local DB

#### POST `/auth/google`
- **Rate limit**: 10/60s
- **Body**: `{ idToken: string }` — Google ID token from client SDK
- **Flow**: Calls `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`

#### POST `/auth/google/callback`
- **Rate limit**: 10/60s
- **Body**: `{ accessToken: string, refreshToken?: string }` — Supabase session tokens from OAuth redirect
- **Flow**: Gets user from Supabase `getUser(accessToken)`, creates/updates local user

#### POST `/auth/request-otp` (generic)
- **Rate limit**: 3/60s
- **Body**: `{ phone: string }`

#### POST `/auth/verify-otp` (generic)
- **Rate limit**: 10/60s
- **Body**: `{ phone: string, token: string }`

#### POST `/auth/refresh`
- **Rate limit**: 10/60s
- **Body**: `{ refresh_token: string }`

#### POST `/auth/password/reset`
- **Rate limit**: 3/60s
- **Body**: `{ email: string }`

#### POST `/auth/password/update`
- **Auth**: SupabaseAuthGuard
- **Rate limit**: 5/60s
- **Body**: `{ newPassword: string }`

#### POST `/auth/email/resend-confirmation`
- **Rate limit**: 3/60s
- **Body**: `{ email: string }`

#### GET `/auth/sessions`
- **Auth**: Any authenticated user
- **Returns**: Supabase user info (last sign-in, email confirmed, etc.)

#### POST `/auth/sessions/revoke-all`
- **Auth**: Any authenticated user
- **Rate limit**: 3/60s

#### POST `/auth/logout`
- **Auth**: Any authenticated user
- Clears auth cookies

#### GET `/auth/me`
- **Auth**: SupabaseAuthGuard
- **Returns**: Full user profile with `courier_profile`, `sender_profile`, `onboarding_session` joins

#### PATCH `/auth/role`
- **Auth**: ADMIN only (SupabaseAuthGuard + RolesGuard)
- **Body**: `{ userId: string, role: UserRole }`

### 5.2 Deliveries (`/deliveries`)

#### POST `/deliveries` — Create delivery
- **Auth**: SENDER role
- **Body** (`CreateDeliveryDto`):
  ```typescript
  {
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    pickupNotes?: string;
    pickupEmail?: string;
    dropoffAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffNotes?: string;
    dropoffEmail?: string;
    itemDescription: string;
    category: PackageCategory;
    size: PackageSize;
    estimatedValueRwf?: number;
    isFragile?: boolean;
    requiresRecipientOtp?: boolean;
    pickupContactName: string;
    pickupContactPhone: string;
    recipientName: string;
    recipientPhone: string;
    scheduledPickupAt?: string;
    preferAsap?: boolean;
    paymentMethod: PaymentMethod;
    quotedPriceRwf?: number;
  }
  ```
- **Returns**: Created delivery with sender info
- **Side effects**: Auto-broadcasts to nearby couriers within 300m

#### GET `/deliveries` — List deliveries
- **Auth**: Any authenticated user
- **Role-filtered**: SENDER sees own, COURIER sees assigned, ADMIN sees all
- **Returns**: `Delivery[]` with sender and courier user info
- **Important**: Uses `order('created_at', { ascending: false })`

#### GET `/deliveries/available` — Get available jobs
- **Auth**: COURIER role
- **Returns**: All BROADCAST deliveries (no courier assigned)

#### GET `/deliveries/:id` — Get delivery detail
- **Auth**: Any authenticated user
- **Returns**: Full delivery with:
  - `sender` — `{ id, full_name, phone, email }`
  - `courier` — `{ id, verification_tier, avg_rating, total_deliveries, motorcycle_plate, momo_number, momo_provider, user }`
  - `events[]` — ordered by occurred_at ASC
  - `chatMessages[]` — ordered by sent_at ASC with sender info
  - `dispute` — if exists
  - `rating` — if exists

#### POST `/deliveries/:id/interest` — Express interest
- **Auth**: COURIER
- **Body**: `{ proposedPriceRwf?: number, etaMinutes?: number }`
- Creates or updates courier_interest

#### POST `/deliveries/:id/take-job` — Take the job
- **Auth**: COURIER
- **Body**: `{ proposedPriceRwf?: number }`
- **Concurrency-safe**: Checks status=BROADCAST AND courier_id IS NULL
- **Transitions**: BROADCAST → COURIER_ASSIGNED
- Emits `courier:interested` with `type: 'JOB_TAKEN'`

#### POST `/deliveries/:id/confirm-agreement` — Confirm price
- **Auth**: SENDER or COURIER
- **Body**: `{ agreedPriceRwf: number, agreedDeliveryTime?: number }`
- **Transitions**: COURIER_ASSIGNED → COURIER_CONFIRMED
- Emits `courier:interested` with `type: 'AGREEMENT_CONFIRMED'`

#### POST `/deliveries/:id/pay` — Pay (escrow)
- **Auth**: SENDER
- **Body**: `{ agreedDeliveryTime?: number }`
- **Guard**: Requires status=COURIER_CONFIRMED and payment_status≠HELD
- **Effect**: Sets payment_status=HELD, payment_held_at, debits sender wallet

#### POST `/deliveries/:id/start-delivery` — Start delivery
- **Auth**: COURIER
- **Guard**: Requires payment_status=HELD
- **Effect**: Generates pickup OTP (6-digit, bcrypt-hashed), sets delivery_started_at
- **Transitions**: COURIER_CONFIRMED → PICKUP_EN_ROUTE
- **Returns**: `{ ..., pickupOtp }` (plain text for courier to see)

#### POST `/deliveries/:id/arrived-pickup` — Arrive at pickup + enter OTP
- **Auth**: COURIER
- **Body**: `{ otp: string }`
- **Effect**: Validates pickup OTP via bcrypt.compare, sets courier_arrived_at
- **Transitions**: PICKUP_EN_ROUTE → ARRIVED_PICKUP

#### POST `/deliveries/:id/arrived` — Arrived at dropoff
- **Auth**: COURIER
- **Guard**: Requires status=IN_TRANSIT
- **Effect**: Generates dropoff OTP, sends to recipient via SMS+WhatsApp+Email, sets dropoff_otp_sent_at
- **Transitions**: IN_TRANSIT → ARRIVED_DROPOFF
- **Returns**: `{ ..., dropoffOtp }`

#### POST `/deliveries/:id/complete` — Complete delivery
- **Auth**: COURIER
- **Body**: `{ otp?: string, photoUrl?: string }`
- **Guard**: Requires status in [ARRIVED_PICKUP, PICKED_UP, IN_TRANSIT, ARRIVED_DROPOFF]
- **Effect**: If requires_recipient_otp and no dropoff OTP yet, generates + sends one. Validates OTP. Sets DELIVERED, RELEASED payment, credits courier wallet (amount - 100 RWF fee), updates courier stats.
- **Transitions**: → DELIVERED

#### POST `/deliveries/:id/rate` — Rate delivery
- **Auth**: SENDER or COURIER
- **Body**: `{ stars: 1-5, comment?: string }`
- **Guard**: One rating per delivery

#### PUT `/deliveries/:id/cancel` — Cancel delivery
- **Auth**: SENDER
- **Guard**: Only in cancellable states (DRAFT, BROADCAST, COURIER_ASSIGNED, COURIER_CONFIRMED, PICKUP_EN_ROUTE, ARRIVED_PICKUP)

### 5.3 Wallet (`/wallet`)

#### GET `/wallet` — Get wallet
- **Auth**: Any authenticated user
- **Returns**: `{ balance: number, transactions: Transaction[] }` (last 50)

#### POST `/wallet/topup` — Top up
- **Auth**: Any authenticated user
- **Rate limit**: 5/60s
- **Body**: `{ amount: number, method: string }`
- Creates credit transaction

#### POST `/wallet/withdraw` — Withdraw
- **Auth**: Any authenticated user
- **Rate limit**: 5/60s
- **Body**: `{ amount: number, method: string }`
- **Guard**: balance must be sufficient

### 5.4 Couriers (`/couriers`)

#### POST `/couriers/register` — Register courier
- **Auth**: Any authenticated user
- **Body**: `{ nationalIdNumber?, motorcyclePlate?, associationCode?, operatingZone?, emergencyContactName?, emergencyContactPhone?, momoNumber?, momoProvider? }`
- Creates courier profile, updates user role to COURIER

#### POST `/couriers/onboarding/start` — Start onboarding
- **Auth**: Any authenticated user
- **Body**: `{ fullName?, phone?, password? }`
- If phone and no supabaseId: creates Supabase Auth user admin-style

#### PUT `/couriers/onboarding/step` — Save step
- **Auth**: Any authenticated user
- **Body**: `{ step: number, ...all optional onboarding fields }`
- Saves to onboarding_sessions, updates current_step

#### GET `/couriers/onboarding/status` — Get status
- **Auth**: Any authenticated user
- **Returns**: `{ hasSession: boolean, session: OnboardingSession }`

#### POST `/couriers/onboarding/submit` — Submit onboarding
- **Auth**: Any authenticated user
- **Body**: `{ agreeToTerms: boolean }`
- Creates courier profile from session data, sets isApprovedByAdmin=false

#### PUT `/couriers/me` — Update profile
- **Auth**: COURIER
- **Body**: `RegisterCourierDto` fields

#### PUT `/couriers/me/online` — Toggle online
- **Auth**: COURIER
- **Body**: `{ isOnline: boolean, lat?: number, lng?: number }`

#### PUT `/couriers/me/location` — Update location
- **Auth**: COURIER
- **Body**: `{ lat: number, lng: number, accuracy?, heading?, speed? }`
- Updates courier.current_lat/lng + records courier_locations row

#### GET `/couriers/me/jobs` — Get jobs
- **Auth**: COURIER
- Returns assigned deliveries

#### GET `/couriers/me/earnings` — Earnings summary
- **Auth**: COURIER
- Returns: `{ totalEarnings, totalDeliveries, completionRate, avgRating }`

#### GET `/couriers/dashboard` — Dashboard
- **Auth**: COURIER
- **Returns**: Comprehensive dashboard with:
  - `courier` — profile
  - `activeJob` — current active delivery or null
  - `availableJobs` — count
  - `todayDeliveries`, `weekDeliveries`, `monthDeliveries` — counts
  - `todayEarnings`, `monthEarnings` — amounts
  - `avgRating`, `totalRatings`

### 5.5 Chat (`/deliveries/:id/chat` and `/chat`)

#### GET `/deliveries/:id/chat` — Get messages
- **Auth**: Participant in delivery
- Returns: `ChatMessage[]` ordered by sent_at ASC

#### POST `/deliveries/:id/chat` — Send message
- **Auth**: Participant in delivery
- **Body**: `{ body: string, photoUrl?: string }`
- Emits `message:new` via WebSocket

#### GET `/chat/conversations` — Get conversations
- **Auth**: Any authenticated user
- Returns: All deliveries for user with last message, unread count, other party info

### 5.6 Tracking (Public) (`/track`)

#### GET `/track/:token` — Get delivery by tracking token
- **No auth required** (public)
- **Params**: `token` — the `recipient_tracking_token`
- Returns: Delivery with sender, courier, events

#### POST `/track/:token/confirm-otp` — Confirm dropoff OTP
- **No auth required** (public)
- **Rate limit**: 5/60s
- **Body**: `{ otp: string }`
- Validates dropoff OTP, transitions to DELIVERED
- Alternative to courier completing via `/deliveries/:id/complete`

### 5.7 Storage (`/storage`)

#### POST `/storage/presigned-url` — Get upload URL
- **Auth**: Any authenticated user
- **Body**: `{ fileName: string, contentType: string, folder: string }`
- **Returns**: `{ uploadUrl, publicUrl, key }`
- **Expiry**: 15 minutes
- **Folders**: `profiles`, `courier-documents`, `delivery-photos`, `chat-photos`

### 5.8 Sender (`/sender`)

#### GET `/sender/dashboard` — Sender dashboard
- **Auth**: SENDER
- Returns: `{ activeDeliveries, totalDeliveries, totalSpent, recentDeliveries, savedAddresses }`

### 5.9 Admin (`/admin`) — All require ADMIN role

#### GET `/admin/dashboard` — Dashboard stats
- Returns: activeDeliveries, onlineCouriers, completedToday, disputesOpen, totalCouriers, totalUsers, revenueToday/Week/Month, pendingVerifications, topCouriers[], recentActivities[], failedDeliveries

#### GET `/admin/couriers` — List couriers
- **Query**: `?tier=BASIC&approved=true&zone=Kicukiro`

#### PUT `/admin/couriers/:id/verify` — Verify courier
- **Body**: `{ approved: boolean, tier?: CourierVerificationTier, adminNotes?: string }`

#### PUT `/admin/couriers/:id/suspend` — Suspend courier
- **Body**: `{ reason: string }`
- Also deactivates user

#### GET `/admin/users` — List users
- **Query**: `?role=SENDER&search=keyword`

#### GET `/admin/deliveries` — List deliveries
- **Query**: `?status=DELIVERED`

#### GET `/admin/disputes` — List disputes

#### PUT `/admin/disputes/:id` — Update dispute
- **Body**: `{ status?: string, resolution?: string }`

#### GET `/admin/live-map` — Live map data
- Returns: activeDeliveries[] + onlineCouriers[] with locations

### 5.10 Users (`/users`)

#### PUT `/users/me` — Update profile
- **Auth**: Any authenticated user
- **Body**: `{ fullName?: string, profilePhotoUrl?: string }`

#### POST `/users/me/photo` — Upload profile photo
- **Auth**: Any authenticated user

---

## 6. Authentication & Authorization Flows

### 6.1 Auth Guard Chain
```
Request → SupabaseAuthGuard (JWT verification) → RolesGuard (optional role check)
```

**`SupabaseAuthGuard`** (`auth/guards/supabase-auth.guard.ts`):
1. Extracts token from: `Authorization: Bearer <token>` header → `cookies.access_token`
2. Calls `supabase.auth.getUser(token)` for verification
3. Looks up local DB user by `supabase_id`
4. Checks `isActive` flag
5. Attaches full DB user to `request.user`

**`RolesGuard`** (`auth/guards/roles.guard.ts`):
- Checks `@Roles(SENDER)` / `@Roles(ADMIN)` etc. decorator
- Compares `request.user.role`

### 6.2 Token Storage (Web Reference)
- JWT stored in `localStorage` as `access_token` and `refresh_token`
- Protected API calls use `Authorization: Bearer <token>` header
- httpOnly cookies also set by backend for server-side rendering (Next.js middleware)

### 6.3 Sender Signup Flow
```
1. User submits email + password + optional fullName
2. POST /auth/sender/signup
3. Backend: supabase.auth.signUp({ email, password })
4. Backend: Create local user (role=SENDER)
5. Response: "Check your email to confirm"
6. User confirms email → can sign in
```

### 6.4 Sender Signin Flow
```
1. User submits email + password
2. POST /auth/sender/signin
3. Backend: supabase.auth.signInWithPassword({ email, password })
4. Backend: Find/create local user
5. Response: { access_token, refresh_token, user }
6. Store tokens → fetch profile from GET /auth/me
```

### 6.5 Google OAuth Flow (Web Reference)
```
Option A (Google One Tap / ID Token):
1. Client: supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
2. Client: Gets session → calls POST /auth/google { idToken }
3. Backend: Creates/updates local user
4. Backend: Returns { access_token, refresh_token, user }

Option B (Redirect flow):
1. User clicks Google button → redirects to supabase OAuth URL
2. User authorizes → callback to /auth/callback page
3. Callback page extracts hash tokens → POST /auth/google/callback { accessToken, refreshToken }
4. Backend: getUser(accessToken) → creates/updates local user
```

### 6.6 Courier Phone OTP Flow
```
1. Courier enters phone (+250XXXXXXXXX)
2. POST /auth/courier/check-phone → { exists: boolean }
3. POST /auth/courier/request-otp → sends SMS via Supabase Auth
4. Courier enters 6-digit OTP
5. POST /auth/courier/verify-otp { phone, token }
6. Backend: supabase.auth.verifyOtp({ phone, token, type: 'sms' })
7. Backend: Creates local user if first time (role=COURIER)
8. Response: { access_token, refresh_token, user, needsOnboarding }
9. If needsOnboarding → redirect to onboarding flow
```

### 6.7 Admin Signin
```
1. POST /auth/admin/signin { email, password }
2. Backend: supabase.auth.signInWithPassword
3. Backend: Checks dbUser.role === 'ADMIN'
4. If not ADMIN → 403 Forbidden
```

### 6.8 Courier Onboarding Flow
```
1. POST /couriers/onboarding/start { fullName?, phone?, password? }
   - If phone and no supabaseId: creates Supabase auth user via admin API
2. Client shows 3-step form:
   - Step 1: Personal info (fullName, email, phone, password)
   - Step 2: Credentials (nationalIdNumber, motorcyclePlate, jacketSerialNumber, emergencyContact, operatingZone, momoNumber/provider)
   - Step 3: Documents (selfieUrl, idPhotoUrl, vehicleFront, vehicleRear, jacketPhoto, licensePhoto) + terms checkbox
3. PUT /couriers/onboarding/step { step: 1, ...fields } — save each step
4. POST /couriers/onboarding/submit { agreeToTerms: true }
   - Creates courier profile (isApprovedByAdmin: false, verificationTier: BASIC)
   - Sets isSubmitted: true
5. Courier sees "Pending approval" screen
6. Admin approves via PUT /admin/couriers/:id/verify
7. Courier can now sign in → dashboard
```

### 6.9 Token Refresh
```
POST /auth/refresh { refresh_token }
→ { access_token, refresh_token }
```
- access_token TTL: 1 hour (cookie), likely 1 hour from Supabase
- refresh_token TTL: 30 days (cookie)
- Supabase auto-refresh: The frontend's supabase client handles auto-refresh

### 6.10 Logout
```
1. POST /auth/logout — clears cookies
2. supabase.auth.signOut() — clears Supabase session
3. Clear localStorage tokens
```

---

## 7. Delivery State Machine (Lifecycle)

### State Transition Diagram
```
DRAFT ─────────────────────────────────► BROADCAST ──► COURIER_ASSIGNED ──► COURIER_CONFIRMED
                                          │                 │                      │
                                          ├──► CANCELLED ◄──┤                      │
                                          │                                       │
                                          │                                  PICKUP_EN_ROUTE
                                          │                                       │
                                          │                                 ARRIVED_PICKUP
                                          │                                       │
                                          │                                   PICKED_UP
                                          │                                       │
                                          │                                   IN_TRANSIT
                                          │                                       │
                                          │                                ARRIVED_DROPOFF
                                          │                                      │
                                          │                              ┌── DELIVERED
                                          │                              ├── FAILED
                                          │                              └── DISPUTED
```

### Valid Transitions (from `delivery-state-machine.service.ts`)
| Current Status | Can Transition To |
|----------------|------------------|
| DRAFT | BROADCAST |
| BROADCAST | COURIER_ASSIGNED, CANCELLED |
| COURIER_ASSIGNED | COURIER_CONFIRMED, BROADCAST, CANCELLED |
| COURIER_CONFIRMED | PICKUP_EN_ROUTE, CANCELLED |
| PICKUP_EN_ROUTE | ARRIVED_PICKUP, CANCELLED |
| ARRIVED_PICKUP | PICKED_UP, CANCELLED |
| PICKED_UP | IN_TRANSIT, DISPUTED |
| IN_TRANSIT | ARRIVED_DROPOFF, DISPUTED |
| ARRIVED_DROPOFF | DELIVERED, FAILED, DISPUTED |
| DELIVERED | (terminal) |
| CANCELLED | (terminal) |
| DISPUTED | (terminal) |
| FAILED | (terminal) |

### Cancellable Statuses
DRAFT, BROADCAST, COURIER_ASSIGNED, COURIER_CONFIRMED, PICKUP_EN_ROUTE, ARRIVED_PICKUP

### Delivery Events (1:1 mapped from status transitions)
When a status transition occurs, a `delivery_events` row is automatically created with the mapped EventType.

### Status-Event Mapping
| DeliveryStatus | EventType |
|----------------|-----------|
| DRAFT | DELIVERY_CREATED |
| BROADCAST | BROADCAST_SENT |
| COURIER_ASSIGNED | COURIER_SELECTED |
| COURIER_CONFIRMED | COURIER_CONFIRMED |
| PICKUP_EN_ROUTE | COURIER_DEPARTED_PICKUP |
| ARRIVED_PICKUP | COURIER_ARRIVED_PICKUP |
| PICKED_UP | PACKAGE_PICKED_UP |
| IN_TRANSIT | LOCATION_UPDATE |
| ARRIVED_DROPOFF | COURIER_ARRIVED_DROPOFF |
| DELIVERED | DELIVERY_COMPLETED |
| CANCELLED | DELIVERY_CANCELLED |
| DISPUTED | DISPUTE_RAISED |
| FAILED | DELIVERY_CANCELLED |

### Delivery Business Rules Summary (from `deliveries.service.ts`)

| Step | Endpoint | Who | Precondition | Effect |
|------|----------|-----|-------------|--------|
| Create | POST /deliveries | SENDER | — | Creates DRAFT, auto-broadcasts to couriers within 300m |
| Take job | POST /deliveries/:id/take-job | COURIER | Status=BROADCAST, no courier assigned | Assigns courier → COURIER_ASSIGNED |
| Confirm agreement | POST /deliveries/:id/confirm-agreement | SENDER or COURIER | Status=COURIER_ASSIGNED | Sets agreedPrice → COURIER_CONFIRMED |
| Pay | POST /deliveries/:id/pay | SENDER | Status=COURIER_CONFIRMED, payment≠HELD | Sets HELD, debits sender wallet |
| Start delivery | POST /deliveries/:id/start-delivery | COURIER | Status=COURIER_CONFIRMED, payment=HELD | Generates pickup OTP → PICKUP_EN_ROUTE |
| Arrive pickup | POST /deliveries/:id/arrived-pickup | COURIER | Status=PICKUP_EN_ROUTE | Validates OTP → ARRIVED_PICKUP |
| Arrive dropoff | POST /deliveries/:id/arrived | COURIER | Status=IN_TRANSIT | Generates dropoff OTP → ARRIVED_DROPOFF |
| Complete | POST /deliveries/:id/complete | COURIER | Various statuses | Validates OTP → DELIVERED + payment released |
| Rate | POST /deliveries/:id/rate | SENDER or COURIER | Status=DELIVERED | Creates one-time rating |

### Broadcasting Logic (auto-triggered on create)
1. Transition status: DRAFT → BROADCAST
2. Query all online, admin-approved couriers with `current_lat`/`current_lng` not null
3. Filter by Haversine distance <= 300m (`BROADCAST_RADIUS_KM = 0.3`)
4. Emit `job:available` via WebSocket to each matching courier's room
5. Send SMS notification (if phone available)

---

## 8. Wallet & Escrow System

### Wallet Tables
- `wallets` — one wallet per user (auto-created on first access)
- `wallet_transactions` — ledger of all transactions
- `withdrawal_requests` — pending payout requests

### Transaction Types
| Type | Description |
|------|-------------|
| credit | Money in (top-up, delivery payout) |
| debit | Money out (escrow hold) |
| fee | Service fee (100 RWF per delivery) |
| withdrawal | Withdrawal to MoMo |
| refund | Refund to sender |

### Service Fee
- Fixed: **100 RWF** per completed delivery
- Formula: `courier_payout = agreed_price_rwf - 100 RWF`

### Escrow Flow
1. **Sender pays** → `payment_status = 'HELD'`, `payment_held_at` set
2. Debit transaction recorded on sender wallet (placeholder — real payment gateway TBD)
3. **OTP verified** → `payment_status = 'RELEASED'`, `payment_released_at` set
4. `walletService.creditCourier()` called with `(agreedPriceRwf - 100 RWF)`
5. Two transactions created: CREDIT (net) + FEE (100 RWF)
6. Courier stats updated: `total_deliveries +1`, `total_earnings += final_price`

### Wallet Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wallet` | GET | Get balance + last 50 transactions |
| `/wallet/topup` | POST | Top up wallet |
| `/wallet/withdraw` | POST | Withdraw to MoMo |

> **Note**: Top-up and real payment gateway integration are placeholders. The debitSender() method does NOT require sufficient balance — it's a placeholder for escrow accounting.

---

## 9. WebSocket Events (Real-time)

**Connection**: Socket.IO to `{API_URL}/ws`
**Auth**: Token in `auth.token` handshake, or `auth: { token }`

### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join:delivery` | `deliveryId: string` | Join delivery room (receives updates for this delivery) |
| `leave:delivery` | `deliveryId: string` | Leave delivery room |
| `join:courier` | `courierId: string` | Join courier room (receives job broadcasts) |
| `leave:courier` | `courierId: string` | Leave courier room |
| `location:update` | `{ deliveryId, lat, lng, accuracy?, heading?, speed? }` | Courier sends GPS location |
| `status:update` | `{ deliveryId, status }` | Status change notification |

### Server → Client Events
| Event | Target Room | Payload | Purpose |
|-------|-------------|---------|---------|
| `job:available` | Courier room | `{ delivery }` (full delivery object) | New job available nearby |
| `job:cancelled` | Delivery room | `{ deliveryId }` | Job was cancelled |
| `courier:interested` | Delivery room | `{ type: 'JOB_TAKEN' \| 'PAYMENT_HELD' \| 'AGREEMENT_CONFIRMED', ... }` | Various status updates |
| `delivery:status` | Delivery room | `{ deliveryId, status, timestamp }` | Real-time status change |
| `courier:location` | Delivery room | `{ lat, lng, accuracy?, heading?, speed? }` | Live courier location |
| `message:new` | Delivery room | Message object | New chat message |

### Important: Courier Room ID
When the backend emits `job:available`, it targets `courier:${courierId}` where `courierId` is the **user_id** (not the courier profile id). The client should join with `join:courier` using their user_id.

### Room Naming Convention
- Delivery room: `delivery:${deliveryId}` (UUID)
- Courier room: `courier:${userId}` (user UUID, not courier profile UUID)

---

## 10. File Uploads (Cloudflare R2)

### Upload Flow
1. **Client**: Request presigned URL
   ```
   POST /storage/presigned-url
   { fileName: 'selfie.jpg', contentType: 'image/jpeg', folder: 'courier-documents' }
   ```
2. **Response**: `{ uploadUrl (PUT URL), publicUrl (read URL), key }`
3. **Client**: Direct PUT to `uploadUrl` with file binary
4. **Client**: Store `publicUrl` in the relevant field (e.g., `selfieUrl`)

### Allowed Folders
| Constant | Value | Usage |
|----------|-------|-------|
| PROFILE_PHOTOS | `profiles` | User profile photos |
| COURIER_DOCUMENTS | `courier-documents` | ID, license, vehicle photos |
| DELIVERY_PHOTOS | `delivery-photos` | Proof of delivery photos |
| CHAT_PHOTOS | `chat-photos` | Chat image attachments |

### Presigned URL Expiry
15 minutes (S3 presigned PUT)

---

## 11. Frontend Architecture (Reference)

### Key Pages and Their Routes

#### Public Pages
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing page | Hero, features, CTA buttons, floating particles, animated counters |
| `/auth/signin` | Sign In | Role toggle (sender/courier). Sender: Google + email/password. Courier: phone → OTP |
| `/auth/signup` | Sign Up | Role toggle. Sender: Google + email/password. Courier: → redirects to onboarding |
| `/auth/sender/signin` | Sender Sign In | Google + email/password |
| `/auth/sender/signup` | Sender Sign Up | Google + email+password+fullName |
| `/auth/sender/forgot-password` | Forgot Password | Email input → send reset |
| `/auth/sender/reset-password` | Reset Password | Extract hash → new password |
| `/auth/courier` | Courier Login | +250 phone entry (9 digits) → check exists → send OTP |
| `/auth/courier/verify` | Courier OTP | 6-digit OTP, 60s countdown, resend |
| `/auth/courier/onboarding` | Courier Onboarding | 3-step: Personal → Credentials → Documents + Terms |
| `/auth/courier/pending` | Pending Approval | Waiting for admin verification |
| `/track` | Public Tracking | Enter tracking code → view status |
| `/tracking/[id]` | Tracking Detail | Step progress, courier info, map, OTP input |
| `/support` | Support | FAQ accordion, contact form |

#### Sender Pages (require SENDER role)
| Route | Page | Description |
|-------|------|-------------|
| `/sender/dashboard` | Sender Dashboard | Stats (total/active/completed), active deliveries slider, recent deliveries |
| `/send` | Create Delivery | 4-step: pickup → dropoff → details → confirm, map picker, geocoding |
| `/deliveries` | My Deliveries | Role-filtered list, status filters |
| `/deliveries/[id]` | Delivery Detail | Progress dots, map, actions (pay, cancel, rate), chat |
| `/wallet` | Wallet | Balance card, top-up/withdraw, transactions |
| `/sender/payments` | Payments | Full transaction history |
| `/sender/reports` | Reports | Delivery analytics with charts |
| `/sender/address-book` | Address Book | Saved addresses (placeholder) |
| `/chat/[id]` | Chat | Socket-based chat with quick replies |
| `/messages` | Messages | Conversation list with unread badges |
| `/profile` | Profile | Avatar upload, name/email/phone, logout |
| `/settings` | Settings | Account, notifications, privacy, preferences |

#### Courier Pages (require COURIER role)
| Route | Page | Description |
|-------|------|-------------|
| `/courier/dashboard` | Courier Dashboard | Availability toggle, stats, active delivery card, nearby jobs |
| `/courier/jobs` | Available Jobs | Filtered by distance from current location |
| `/courier/jobs/[id]` | Job Detail | Full delivery flow: accept → confirm → arrive → pickup → dropoff → complete |
| `/courier/profile` | Courier Profile | Stats, ratings, documents, edit |
| `/courier/messages` | Messages | Conversation list |
| `/courier/earnings` | Earnings | Balance, stats by period, delivery history |

#### Admin Pages (require ADMIN role)
| Route | Page | Description |
|-------|------|-------------|
| `/admin/auth` | Admin Login | Email + password, role check |
| `/admin/dashboard` | Admin Dashboard | KPI cards, courier table, revenue charts |
| `/admin/couriers` | Courier Management | Verify/unverify, document view |
| `/admin/deliveries` | All Deliveries | Filterable by status/date |
| `/admin/users` | Users | User list with role badges |
| `/admin/reports` | Reports | Analytics |
| `/admin/disputes` | Disputes | Dispute management |

### Component Architecture

#### UI Components (`/components/ui/`)
| Component | Description |
|-----------|-------------|
| `Button` | Variants: primary, secondary, outline-red, danger, ghost, icon. Sizes: sm/md/lg |
| `Input` | Styled input with label, error state, icons, optional textarea |
| `Card` / `StatCard` | Content card + stat card with icon, label, value, trend |
| `StatusBadge` | Color-coded delivery status badge |
| `VerificationBadge` | Courier verification tier badge |
| `Avatar` | User avatar with fallback initials |
| `Skeleton` | Loading skeleton with shimmer animation |
| `Toast` (ToastProvider) | Success/error/warning toast notifications via context |
| `Toggle` | Radix toggle component (on/off switch) |
| `Logo` | SVG logo (sm/md/lg, white/crimson variants) |
| `OTPInput` | 6-digit OTP input with paste support, auto-focus, error shake |
| `BottomSheet` | Slide-up modal with drag handle and backdrop |
| `AnimatedHero` | Gradient hero banner |
| `GroupedFormSection` | Form section with icon + title |
| `GreetingBlock` | Personalized time-based greeting |
| `DoubleDeckHeader` | Two-line page header (title + subtitle) |

#### Layout Components (`/components/layout/`)
| Component | Description |
|-----------|-------------|
| `AppLayout` | Root layout wrapper: checks public vs. authenticated routes, renders sidebar + bottom nav |
| `Sidebar` (Sender/Courier/Admin) | Desktop sidebar with role-specific navigation links, user profile at bottom |
| `BottomNav` (Sender/Courier/Admin) | Mobile bottom navigation with role-specific tabs and center CTA |
| `TopBar` | Mobile top bar with variants (default, back, create, chat, admin) |

#### Delivery Components (`/components/delivery/`)
| Component | Description |
|-----------|-------------|
| `DeliverySliderCard` | Active delivery highlight card with progress bar |
| `DeliveryRow` | Delivery list row with tracking code, pickup→dropoff, status dot |
| `AvailableJobCard` | Courier job listing card with distance, price, addresses |
| `CourierInterestCard` | Courier card for sender's review (rating, verified, price, ETA, select) |
| `OTPConfirmCard` | OTP handover card with countdown |
| `StepProgress` | Horizontal step progress with labels |
| `ProgressDotTrack` | Thin progress dots tracking delivery status |
| `StatusTimeline` | Vertical timeline with completed/active/upcoming steps |

#### Map Components (`/components/map/`)
| Component | Description |
|-----------|-------------|
| `MapWidget` | MapLibre display map with pickup/dropoff/courier markers, route lines |
| `MapPicker` | MapLibre picker: click to select, reverse geocode, confirm address |
| `CourierMapMarker` | Animated courier marker with pulsing dot |

#### Chat Components (`/components/chat/`)
| Component | Description |
|-----------|-------------|
| `ChatBubble` | Message bubble (sender/courier side, timestamp, read status) |
| `ChatInput` | Input bar with send and attachment |
| `QuickReplies` | Quick reply chips |

### State Management (Zustand Stores)

#### `useAuthStore` (`/stores/auth.ts`)
```typescript
interface AuthState {
  user: User | null;       // { id, supabaseId, phone, email, fullName, role, profilePhotoUrl, courierProfile?, onboardingSession? }
  loading: boolean;
  setUser: (user) => void;
  fetchProfile: () => Promise<void>;  // GET /auth/me
  logout: () => Promise<void>;        // supabase signOut + POST /auth/logout + clear localStorage
}
```
- Init: `loading: true`, fetchProfile on mount
- Token stored in `localStorage` as `access_token`

#### `useDeliveriesStore` (`/stores/deliveries.ts`)
```typescript
interface Delivery {
  id, trackingCode, pickupAddress, dropoffAddress, status, category, createdAt, quotedPriceRwf,
  courier?: { id, fullName, phone, profilePhotoUrl, motorcyclePlate },
  sender?: { id, fullName, phone }
}
interface DeliveriesState {
  deliveries: Delivery[]; loading; error;
  fetchDeliveries: (role?) => void;       // GET /deliveries or /admin/deliveries
  fetchDeliveryById: (id) => Delivery;    // GET /deliveries/:id
  createDelivery: (data) => Delivery;     // POST /deliveries
  updateStatus: (id, status) => void;     // POST /deliveries/:id/status
}
```

#### `useWalletStore` (`/stores/wallet.ts`)
```typescript
interface WalletState {
  balance: number;
  transactions: Transaction[];
  fetchWallet: () => void;            // GET /wallet
  topUp: (amount, method) => bool;    // POST /wallet/topup
  withdraw: (amount, method) => bool; // POST /wallet/withdraw
}
```

#### `useMessagesStore` (`/stores/messages.ts`)
```typescript
interface MessagesState {
  conversations: Conversation[];     // { id, deliveryId, participantName, lastMessage, timestamp, unread }
  messages: Message[];
  fetchConversations: (role?) => void;  // GET /deliveries + GET /deliveries/:id/chat
  fetchMessages: (deliveryId) => void;  // GET /deliveries/:id/chat
  sendMessage: (deliveryId, text) => void; // POST /deliveries/:id/chat
}
```

#### `useAdminStore` (`/stores/admin.ts`)
```typescript
interface AdminState {
  couriers: AdminCourier[];    // { id, fullName, phone, verificationTier, isApprovedByAdmin, isOnline, totalDeliveries, rating }
  stats: AdminStats | null;    // { totalUsers, totalCouriers, totalDeliveries, totalRevenue }
  fetchCouriers: () => void;   // GET /admin/couriers
  fetchStats: () => void;      // GET /admin/dashboard
  verifyCourier: (id, approved, tier) => void; // PUT /admin/couriers/:id/verify
}
```

### API Client (`/lib/api.ts`)
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
api.get<T>(path)        → fetch GET with Bearer token
api.post<T>(path, body) → fetch POST with Bearer token + JSON body
api.put<T>(path, body)  → fetch PUT
api.delete<T>(path)     → fetch DELETE
```
- Token from `localStorage.getItem('access_token')`
- Credentials: 'include' for cookies
- Error: throws `new Error(error.message)`
- Returns parsed JSON directly

### Socket Client (`/lib/socket.ts`)
```typescript
getSocket(): Socket  — lazy singleton Socket instance, connects to {API_URL}/ws
disconnectSocket()   — disconnect and nullify
```
- Auth: `{ auth: { token } }`
- Transports: `['websocket', 'polling']`
- Reconnection: 10 attempts, 1s delay

---

## 12. UI/UX Design System

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary (red) | `#5A1515` → `#FDF5F5` | Brand color, sidebar, CTAs |
| Background page | Light gray | Page background |
| Gray scale | `#0A0A0A` → `#FAFAFA` | Text, borders, surfaces |

### Typography
- **Display font**: Poppins (headings, display text)
- **Body font**: Inter (body, paragraphs)
- **Font sizes**: 22 custom sizes (micro, tiny, btn-sm, body-sm, body, base, h6 → h1)

### Status Badge Colors
| Status | Style |
|--------|-------|
| BROADCAST | amber-100 / amber-800 |
| COURIER_ASSIGNED | blue-100 / blue-800 |
| PICKED_UP | red-50 / red-700 |
| IN_TRANSIT | red-700 / white |
| DELIVERED | green-100 / green-800 |
| CANCELLED | gray-100 / gray-600 |
| DISPUTED | red-100 / red-700 |

### Key UV Animations (from `globals.css`)
- `fade-in`, `slide-up`, `slide-down`, `slide-in-left` — page transitions
- `shimmer` — skeleton loading
- `pulse-dot` — courier map marker pulse
- `count-up` — animated counter numbers
- `float` — floating decorative particles
- `shake` — OTP input error
- `prefers-reduced-motion` respected

### Navigation Structure

#### Sender Nav
1. Dashboard (LayoutDashboard)
2. Send (Plus) — center CTA
3. Deliveries (Package)
4. Messages (MessageSquare)
5. Wallet (Wallet)
6. Profile (User)
7. Settings (Settings)
8. Support (HelpCircle)

#### Courier Nav
1. Dashboard (LayoutDashboard)
2. Available Jobs (Navigation)
3. My Jobs (ClipboardList)
4. Messages (MessageSquare)
5. Earnings (DollarSign)
6. Profile (User)
7. Settings (Settings)
8. Support (HelpCircle)

#### Admin Nav
1. Dashboard (LayoutDashboard)
2. Couriers (Users)
3. Deliveries (Package)
4. Users (UserCheck)
5. Reports (BarChart)
6. Disputes (AlertTriangle)

### Layout Structure
| Viewport | Layout |
|----------|--------|
| Desktop (≥1024px) | Sidebar (240px, bg-red-600) + Main content (lg:ml-[240px], lg:pt-20) |
| Mobile (<1024px) | TopBar (h-14) + BottomNav (fixed bottom, h-20) + Main (pt-14, pb-28) |
| Public pages | Full-width, no sidebar/nav |

### Mobile Drawer
- Slides in from left (`slide-in-left` animation)
- Same content as desktop sidebar
- Overlay backdrop (bg-gray-950/50)
- Closes on route change

---

## 13. Environment Variables

### Backend (`.env`)
```
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://bkxkrrinthmknteoqnkr.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
FRONTEND_URL=http://localhost:3000
R2_ACCESS_KEY_ID=<cloudflare_r2_key>
R2_SECRET_ACCESS_KEY=<cloudflare_r2_secret>
R2_BUCKET_NAME=<bucket_name>
R2_ENDPOINT=<r2_endpoint>
R2_PUBLIC_URL=<r2_public_base_url>
OTP_EXPIRY_MINUTES=30
BROADCAST_RADIUS_KM=5
BROADCAST_WINDOW_SECONDS=90
COURIER_CONFIRM_TIMEOUT_SECONDS=30
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://bkxkrrinthmknteoqnkr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_MAPTILER_STYLE_URL=<maptiler_style_url>
NEXT_PUBLIC_ORS_KEY=<openrouteservice_key>
NEXT_PUBLIC_R2_PUBLIC_URL=<r2_public_base_url>
```

---

## 14. Error Handling

### Global Exception Filter (`http-exception.filter.ts`)
All API errors follow this format:
```json
{
  "success": false,
  "error": "Error message string",
  "details": {}
}
```

### HTTP Status Codes Used
| Code | Usage |
|------|-------|
| 400 | BadRequestException (invalid status, missing fields, OTP invalid) |
| 401 | UnauthorizedException (no token, invalid token, inactive user) |
| 403 | ForbiddenException (wrong role, not your delivery) |
| 404 | NotFoundException (delivery/courier/user not found) |
| 409 | ConflictException (duplicate signup) |
| 500 | InternalServerErrorException (DB query failure) |

### Validation Errors
class-validator DTO validation returns 400 with field-level errors.

### Rate Limiting
- Default: 100 requests / 60 seconds
- Auth endpoints: 3–10 / 60s (per endpoint)
- ThrottleGuard returns 429 when exceeded

---

## Key Integration Notes for Mobile App

1. **Auth**: Store JWT in secure storage. Prefer `Authorization: Bearer` header. Use `/auth/refresh` for token refresh.

2. **API Calls**: All endpoints under `/api/v1`. For signin/signup endpoints that set httpOnly cookies, the mobile app should use the `access_token` from the response body instead.

3. **WebSocket**: Connect to `{BASE_URL}/ws` with auth token. Join rooms on login: `join:courier` (with user_id) and relevant `join:delivery` rooms.

4. **Maps**: Use coordinates from delivery data (pickupLat/Lng, dropoffLat/Lng). For geocoding, use a service like OpenRouteService or Mapbox. The frontend uses MapLibre + OpenRouteService.

5. **Broadcast Radius**: Default 300m from pickup location. Configurable via env var.

6. **OTP**: Always 6-digit numeric. Hashed with bcrypt before storage. Never returned in API responses (except immediately after generation for the courier to see).

7. **Snake_case**: Database uses snake_case for all columns. API responses are converted to camelCase via `DbService.mapRow()`. When writing queries directly via `getClient()`, use snake_case.

8. **External Dependencies** (still stubs):
   - SMS provider — needs Twilio / Africa's Talking integration
   - WhatsApp provider — needs WATI / Twilio integration
   - Email provider — needs Resend / SendGrid
   - Payment gateway — needs MTN MoMo / Stripe integration
   - MoMo disbursement — needs MTN MoMo API

9. **Delivery Email Fields**: `pickupEmail` and `dropoffEmail` are optional fields on the deliveries table. They were added via ALTER TABLE (not in the initial CREATE TABLE migration). Used for OTP delivery alongside SMS.

10. **Complete Delivery Via Public Tracking**: The `/track/:token/confirm-otp` endpoint allows recipients to complete the delivery by entering their dropoff OTP through the public tracking page, without needing a courier app. This is an alternative to the courier completing via `/deliveries/:id/complete`.
