# DELIVERY — Full Application Logic Document

> A complete walkthrough of the delivery platform: how users authenticate, how deliveries move from creation to completion, how money flows, and how every piece connects.

---

## Table of Contents

1. [What Is This App?](#1-what-is-this-app)
2. [Tech Stack Overview](#2-tech-stack-overview)
3. [The Database (Supabase/PostgreSQL)](#3-the-database-supabasepostgresql)
4. [User Roles & Profiles](#4-user-roles--profiles)
5. [Authentication Flow](#5-authentication-flow)
   - 5.1 Sender Signup & Signin (Email/Password)
   - 5.2 Sender Signup & Signin (Google)
   - 5.3 Courier Signup & Onboarding
   - 5.4 Courier Signin (Phone OTP)
   - 5.5 Admin Signin
   - 5.6 JWT & Auth Guards
6. [Courier Onboarding Flow](#6-courier-onboarding-flow)
7. [Delivery Lifecycle (Full Step-by-Step)](#7-delivery-lifecycle-full-step-by-step)
   - Step 1: Sender Creates a Delivery (DRAFT)
   - Step 2: Auto-Broadcast to Nearby Couriers (BROADCAST)
   - Step 3: Courier Takes the Job (COURIER_ASSIGNED)
   - Step 4: Price Negotiation & Agreement (COURIER_CONFIRMED)
   - Step 5: Sender Pays (Escrow Held)
   - Step 6: Courier Starts Delivery (PICKUP_EN_ROUTE)
   - Step 7: Courier Arrives at Pickup (ARRIVED_PICKUP)
   - Step 8: Package Picked Up (PICKED_UP)
   - Step 9: In Transit (IN_TRANSIT)
   - Step 10: Courier Arrives at Drop-off (ARRIVED_DROPOFF)
   - Step 11: Delivery Completed (DELIVERED)
   - Step 12: Rating
   - Cancellation & Disputes
8. [The State Machine](#8-the-state-machine)
9. [Real-Time WebSocket System](#9-real-time-websocket-system)
10. [Wallet & Payment System](#10-wallet--payment-system)
11. [Chat System](#11-chat-system)
12. [Tracking Page (Public, No Login)](#12-tracking-page-public-no-login)
13. [Admin Dashboard](#13-admin-dashboard)
14. [File Uploads (Cloudflare R2)](#14-file-uploads-cloudflare-r2)
15. [Notifications System](#15-notifications-system)
16. [Frontend Architecture](#16-frontend-architecture)
17. [Delivery Status Summary Table](#17-delivery-status-summary-table)
18. [Complete API Endpoint Reference](#18-complete-api-endpoint-reference)

---

## 1. What Is This App?

DELIVERY is a motorcycle delivery platform for Kigali, Rwanda. It connects **senders** (people who need packages delivered) with **couriers** (vetted motorcycle riders). Every delivery is tracked in real-time, every handover is verified with a one-time password (OTP), and funds are held in escrow until the recipient confirms receipt.

**Three types of users:**
- **SENDER** — someone who needs a package delivered
- **COURIER** — a motorcycle rider who delivers packages
- **ADMIN** — platform operator who verifies couriers and monitors activity

---

## 2. Tech Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                 │
│  React / TypeScript / Tailwind CSS / Zustand (state)    │
│  Socket.io-client (WebSocket) / Supabase JS (auth)      │
├─────────────────────────────────────────────────────────┤
│                    BACKEND (NestJS 10)                    │
│  TypeScript / @supabase/supabase-js (DB + Auth)         │
│  Socket.io (WebSocket) / bcrypt (OTP hashing)           │
│  @nestjs/throttler (rate limiting)                       │
├─────────────────────────────────────────────────────────┤
│                    DATABASE (Supabase / PostgreSQL)       │
│  Raw SQL (no ORM) / Row-Level Security (RLS)            │
│  Auth Hook (custom JWT claims)                          │
│  pgcrypto extension                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. The Database (Supabase/PostgreSQL)

The database uses **raw SQL tables** (no ORM like Prisma). There are 12 tables:

| Table | Purpose |
|-------|---------|
| `users` | Core user accounts (SENDER, COURIER, ADMIN) |
| `sender_profiles` | Extra profile data for senders |
| `couriers` | Courier-specific data (verification, vehicle, location, stats) |
| `courier_locations` | GPS location history for couriers |
| `onboarding_sessions` | Temporary data collected during courier signup |
| `deliveries` | The core table — every delivery and its status |
| `delivery_events` | Audit log of every status change |
| `courier_interests` | Couriers expressing interest in available jobs |
| `chat_messages` | In-app chat messages tied to deliveries |
| `ratings` | Star ratings (1-5) after delivery completion |
| `disputes` | Disputes raised by senders or couriers |
| `wallets` | Per-user wallet balances |
| `wallet_transactions` | Ledger of all wallet movements |
| `withdrawal_requests` | Courier payout requests (mobile money) |

### How Database Access Works

The backend never talks directly to the database. Instead, all queries go through a **`DbService`** which wraps the Supabase JavaScript client (`supabase-js`). This service:

1. Uses the **`service_role` key** (admin-level access, bypasses Row-Level Security)
2. **Auto-converts** between camelCase (used in TypeScript code) and snake_case (used in PostgreSQL columns)
3. Provides helper methods: `findOne()`, `findMany()`, `create()`, `update()`, `delete()`, `findOneWithJoin()`

For complex queries, the service exposes `getClient()` which returns the raw Supabase client directly.

### Column Naming Convention

- **Database**: `snake_case` (e.g., `full_name`, `pickup_address`, `is_approved_by_admin`)
- **TypeScript code**: `camelCase` (e.g., `fullName`, `pickupAddress`, `isApprovedByAdmin`)
- **Conversion**: `DbService` automatically converts between the two via lookup tables

---

## 4. User Roles & Profiles

### The `users` Table

Every person who uses the platform has one row in the `users` table:

```
id              UUID (primary key)
supabase_id     UUID (links to Supabase Auth user)
email           Text (unique, for senders)
phone           Text (unique, for couriers)
full_name       Text
role            SENDER | COURIER | ADMIN
profile_photo_url  Text (Google avatar or uploaded)
email_verified  Boolean
phone_verified  Boolean
is_active       Boolean (admin can deactivate)
```

### Role Enforcement

- **SENDER** — Can create deliveries, pay, rate couriers
- **COURIER** — Can take jobs, deliver packages, withdraw earnings
- **ADMIN** — Can verify couriers, view dashboard, manage disputes

Roles are enforced at the **controller level** via the `RolesGuard`. Each endpoint has a `@Roles()` decorator specifying who can call it. The guard reads the `role` field from the user object (which is attached to the request by `SupabaseAuthGuard`).

### Related Profile Tables

- **`sender_profiles`** — Extra info for senders (business name, default pickup address)
- **`couriers`** — Full courier profile including vehicle info, verification tier, location, earnings stats
- **`onboarding_sessions`** — Temporary data collected while a courier is signing up (see section 6)

---

## 5. Authentication Flow

Authentication is handled by **Supabase Auth** (a built-in authentication system). The backend never stores passwords — Supabase handles all credential verification and returns JWTs.

There are three distinct authentication flows for the three user types.

### 5.1 Sender Signup & Signin (Email/Password)

**Signup** (`POST /auth/sender/signup`):
1. Frontend sends email + password + optional name
2. Backend checks if email already exists in `users` table (avoids duplicates)
3. Calls `supabase.auth.signUp()` to create the user in Supabase Auth
4. Supabase sends a **confirmation email** to the user
5. Backend creates a row in the local `users` table with `role = SENDER`
6. Returns success message telling user to check their email

**Signin** (`POST /auth/sender/signin`):
1. Frontend sends email + password
2. Backend calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials and returns a **JWT access token** + **refresh token**
4. If user doesn't exist in local `users` table yet, creates them
5. Returns tokens to frontend
6. Frontend stores tokens: `access_token` in localStorage (for API calls), both tokens as httpOnly cookies (for SSR/middleware)

### 5.2 Sender Signup & Signin (Google)

**Google Auth** (`POST /auth/google`):
1. Frontend gets a Google ID token (via Google's sign-in SDK)
2. Backend calls `supabase.auth.signInWithIdToken({ provider: 'google', token })`
3. Supabase exchanges the Google token for a Supabase session (JWT tokens)
4. Backend creates/updates the local `users` table
5. Returns tokens to frontend

**Google Callback** (`POST /auth/google/callback`):
1. Used when the frontend already has a Supabase access token from Google OAuth
2. Backend calls `supabase.auth.getUser(accessToken)` to verify it
3. Creates or updates local user record
4. Returns the user profile (not tokens — they come in cookies)

### 5.3 Courier Signup & Onboarding

Couriers sign up differently. See **[Section 6: Courier Onboarding Flow](#6-courier-onboarding-flow)** for the full walkthrough.

The auth part of courier signup works like this:
1. Courier clicks "Become a courier" → redirected to `/auth/courier/onboarding`
2. They fill in personal info, including phone number
3. If they're new (no Supabase Auth account yet), the backend:
   - Creates a Supabase Auth user with their phone and a temporary password
   - Sends an OTP to their phone for verification
4. If they already have an account, they just get an OTP to sign in
5. The OTP verification (`POST /auth/courier/verify-otp`) returns tokens like a normal signin

### 5.4 Courier Signin (Phone OTP)

**Check Phone** (`POST /auth/courier/check-phone`):
1. Courier enters their phone number
2. Backend checks if it exists in the `users` table
3. Returns `{ exists: true/false }` — frontend shows different messaging

**Request OTP** (`POST /auth/courier/request-otp`):
1. Rate-limited (3 requests per 60 seconds)
2. Backend calls `supabase.auth.signInWithOtp({ phone })`
3. Supabase sends an SMS with a 6-digit OTP

**Verify OTP** (`POST /auth/courier/verify-otp`):
1. Backend calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
2. Supabase validates the OTP and returns tokens
3. Backend creates local user if needed
4. Checks if the user has completed onboarding
5. Returns `{ access_token, refresh_token, user, needsOnboarding: true/false }`

### 5.5 Admin Signin

1. Admin enters email + password on `/admin/auth` page
2. Backend calls standard `supabase.auth.signInWithPassword()`
3. **Extra check**: validates that the user's `role` in the `users` table is `ADMIN`
4. If not ADMIN, returns 403 Forbidden

### 5.6 JWT & Auth Guards

**Token Format:**
- Access token: short-lived JWT (1 hour), used for API authentication
- Refresh token: long-lived (30 days), used to get new access tokens

**How API Authentication Works:**
1. Every protected endpoint has the `SupabaseAuthGuard`
2. The guard extracts the token from:
   - `Authorization: Bearer <token>` header (frontend API calls)
   - `access_token` cookie (SSR/middleware requests)
3. Calls `supabase.auth.getUser(token)` to verify the JWT with Supabase
4. Looks up the corresponding user in the `users` table
5. Attaches the full user object to `request.user`

**Role Authorization:**
- After authentication, the `RolesGuard` checks if the user's `role` matches the required role
- Example: `@Roles(UserRole.SENDER)` means only senders can call this endpoint

**Cookie Management:**
- Backend sets `access_token` (1 hour) and `refresh_token` (30 days) as httpOnly cookies
- Frontend also stores `access_token` in localStorage for direct API calls
- On logout, both cookies are cleared and Supabase session is invalidated

---

## 6. Courier Onboarding Flow

The onboarding flow is a **multi-step registration process** that collects all the information needed to become a courier. It happens on a single page with three sections.

### Flow Diagram

```
Signup page → Toggle to "Deliver"
  → Redirects to /auth/courier/onboarding
    → Section 1: Personal Info (name, email, phone, password)
    → Section 2: Credentials (national ID, vehicle plate, jacket serial, emergency contact)
    → Section 3: Documents (selfie, ID photo, vehicle photos, jacket photo, agree to terms)
  → Submit → Pending page (/auth/courier/pending)
    → Admin approves → Courier can sign in and start working
```

### Step-by-Step

**1. Start Onboarding** (`POST /couriers/onboarding/start`):
- Creates an `onboarding_sessions` row linked to the user
- If user provides a phone and doesn't have a Supabase Auth account yet:
  - Creates a Supabase Auth user with the phone number
  - Sends an OTP to verify the phone
- Sets `currentStep = 0`

**2. Save Section Data** (`PUT /couriers/onboarding/step`):
- Each time the user completes a section, the frontend calls this endpoint
- Updates the `onboarding_sessions` row with the new fields and increments `currentStep`
- Personal info fields also update the `users` table directly
- This allows the user to leave and come back — data is persisted

**3. Submit Onboarding** (`POST /couriers/onboarding/submit`):
- Validates that user agreed to terms
- Checks that no courier profile already exists
- Updates user's role to `COURIER`
- Creates the `couriers` row with all collected data
- Sets `isApprovedByAdmin = false` — courier cannot work yet
- Sets `verificationTier = 'BASIC'`

**4. Admin Verification:**
- Admin logs in, sees pending couriers on dashboard
- Reviews documents and information
- Approves or rejects the courier
- Sets verification tier (BASIC → IDENTITY → VEHICLE → TRUSTED)

**5. Courier Can Sign In:**
- Once approved (`isApprovedByAdmin = true`), courier can sign in via phone OTP
- Goes to `/auth/courier/onboarding` → enters phone → gets OTP → verified → dashboard

### What Data Is Collected

| Section | Fields |
|---------|--------|
| Personal Info | Full name, email, phone, password, confirm password |
| Credentials | National ID number, vehicle/motorcycle plate, jacket serial number, emergency contact name + phone |
| Documents | Selfie photo, ID photo, vehicle front photo, vehicle rear photo, license photo, jacket photo, agree to terms |

---

## 7. Delivery Lifecycle (Full Step-by-Step)

The delivery lifecycle is the heart of the app. Every delivery moves through a series of statuses, and most actions are protected by role-based guards.

### Complete Status Flow

```
DRAFT → BROADCAST → COURIER_ASSIGNED → COURIER_CONFIRMED → PICKUP_EN_ROUTE
  → ARRIVED_PICKUP → PICKED_UP → IN_TRANSIT → ARRIVED_DROPOFF → DELIVERED

Terminal statuses: CANCELLED, DISPUTED, FAILED
```

### Step 1: Sender Creates a Delivery (DRAFT)

**Who:** SENDER only  
**Endpoint:** `POST /deliveries`

The sender fills in:
- Pickup address with GPS coordinates (lat/lng)
- Drop-off address with GPS coordinates (lat/lng)
- Contact info: pickup contact name/phone, recipient name/phone
- Optional: pickup email, dropoff email (for OTP delivery)
- Item details: description, category (document/food/electronics/etc), size (small/medium/large), estimated value
- Schedule: ASAP or scheduled pickup time
- Price: quoted price if known

**What happens in the backend:**
1. Generates a `recipientTrackingToken` (random hex token) — this is used for the public tracking page
2. Creates the delivery in `DRAFT` status
3. **Immediately** calls `broadcastToNearbyCouriers()` — see Step 2

### Step 2: Auto-Broadcast to Nearby Couriers (BROADCAST)

**Triggered automatically** after delivery creation.

1. State machine transitions delivery from `DRAFT` → `BROADCAST`
2. Queries the database for all couriers who:
   - Are currently online (`is_online = true`)
   - Are approved by admin (`is_approved_by_admin = true`)
   - Have a current GPS location (`current_lat` and `current_lng` are not null)
3. For each online courier, calculates **Haversine distance** from the courier's location to the pickup location
4. If distance ≤ **300 meters** (0.3 km), the courier is notified:
   - **WebSocket**: emits `job:available` event to the courier's personal room
   - **SMS**: sends SMS notification (currently a stub — logs only)
5. The delivery is now visible in the courier's "Available Jobs" list

### Step 3: Courier Takes the Job (COURIER_ASSIGNED)

**Who:** COURIER only  
**Endpoint:** `POST /deliveries/:id/take-job`

1. The courier sees the available job (either via WebSocket push or by fetching `/deliveries/available`)
2. They click "Take Job"
3. Backend uses an **atomic conditional update**:
   ```sql
   UPDATE deliveries
   SET courier_id = ..., quoted_price_rwf = ...
   WHERE id = :id
     AND status = 'BROADCAST'
     AND courier_id IS NULL
   ```
   Only one courier can succeed because the `WHERE` clause acts as a lock. If two couriers try at the same time, only the first one succeeds.
4. State machine transitions to `COURIER_ASSIGNED`
5. Sender gets notified via SMS
6. WebSocket emits `courier:interested` with `type: 'JOB_TAKEN'` to the delivery room

### Step 4: Price Negotiation & Agreement (COURIER_CONFIRMED)

**Who:** SENDER or COURIER  
**Endpoint:** `POST /deliveries/:id/confirm-agreement`

1. Both parties can see each other's phone numbers and chat
2. They negotiate the price (via chat or phone call)
3. Either party can click the "Confirm Agreement" button
4. This sets `agreedPriceRwf`, `finalPriceRwf`, and optionally `agreedDeliveryTime` (in minutes)
5. State machine transitions to `COURIER_CONFIRMED`
6. WebSocket emits `AGREEMENT_CONFIRMED`

### Step 5: Sender Pays (Escrow Held)

**Who:** SENDER only  
**Endpoint:** `POST /deliveries/:id/pay`

1. Sender sees a payment card with the agreed amount (read-only)
2. They click "Pay" to hold funds in escrow
3. **What happens:**
   - Sets `payment_status = 'HELD'`
   - Records `paymentHeldAt` timestamp
   - Debits the sender's wallet (placeholder — real payment gateway TBD)
   - Notifies the courier that payment is secured
4. The "Start Delivery" button becomes visible to the courier **only** after payment is HELD
5. WebSocket emits `PAYMENT_HELD`

### Step 6: Courier Starts Delivery (PICKUP_EN_ROUTE)

**Who:** COURIER only  
**Endpoint:** `POST /deliveries/:id/start-delivery`

**Prerequisite:** `payment_status` must be `HELD`

1. Generates a **6-digit pickup OTP** and stores it as a bcrypt hash
2. State machine transitions to `PICKUP_EN_ROUTE`
3. Sets `deliveryStartedAt` timestamp
4. Returns the pickup OTP to the courier (they'll need it at pickup)
5. Notifies the sender "courier is on the way"

### Step 7: Courier Arrives at Pickup (ARRIVED_PICKUP)

**Who:** COURIER only  
**Endpoint:** `POST /deliveries/:id/arrived-pickup`

1. Courier arrives at the pickup location
2. Sender gives them the 6-digit pickup OTP
3. Courier enters the OTP in the app
4. Backend compares the entered OTP against the stored bcrypt hash
5. If valid, transitions to `ARRIVED_PICKUP`
6. Records `courierArrivedAt` timestamp

### Step 8: Package Picked Up (PICKED_UP)

**Who:** COURIER only  
**Endpoint:** `POST /deliveries/:id/picked-up`

1. Courier confirms they have the package
2. State machine transitions to `PICKED_UP`
3. Sets `pickedUpAt` timestamp

### Step 9: In Transit (IN_TRANSIT)

**Who:** COURIER only  
**Endpoint:** `POST /deliveries/:id/in-transit`

1. Courier is now moving toward the drop-off location
2. State machine transitions to `IN_TRANSIT`
3. Live GPS location updates are broadcast via WebSocket (the sender can see the courier moving on a map)

### Step 10: Courier Arrives at Drop-off (ARRIVED_DROPOFF)

**Who:** COURIER only  
**Endpoint:** `POST /deliveries/:id/arrived`

1. Courier arrives at the drop-off location
2. Generates a **6-digit drop-off OTP** and stores it as a bcrypt hash
3. Sends the OTP to the recipient via:
   - SMS (to `recipientPhone`)
   - Email (to `dropoffEmail`, if provided)
   - WhatsApp (stub — not implemented)
4. State machine transitions to `ARRIVED_DROPOFF`

### Step 11: Delivery Completed (DELIVERED)

This can happen in **two ways**:

**Option A: Courier enters recipient's OTP**
- **Who:** COURIER only  
- **Endpoint:** `POST /deliveries/:id/complete`
- The recipient tells the courier the 6-digit OTP
- Courier enters it in the app
- Backend verifies the OTP against the bcrypt hash

**Option B: Recipient uses the tracking link**
- **Who:** Anyone with the tracking token
- **Endpoint:** `POST /track/:token/confirm-otp`
- The recipient clicks the link in their SMS/email
- They see a simple page with the delivery details
- They enter the OTP they received
- Backend verifies the OTP

**On successful OTP verification (both options):**
1. State machine transitions to `DELIVERED`
2. Sets `deliveredAt` timestamp
3. **Releases payment from escrow** — `payment_status` → `RELEASED`
4. Records `paymentReleasedAt` and `otpVerifiedAt`
5. **Credits the courier's wallet:**
   - `courier_payout = agreed_price - 100 RWF` (service fee)
   - Creates two wallet transactions: a `credit` (net amount) and a `fee` (100 RWF)
6. **Updates courier stats:**
   - `total_deliveries + 1`
   - `total_earnings += final_price`
7. Notifies the sender that delivery is complete

### Step 12: Rating

**Who:** SENDER or COURIER  
**Endpoint:** `POST /deliveries/:id/rate`

1. Either party can rate the other (1–5 stars + optional comment)
2. Only one rating per delivery
3. Only possible after delivery is `DELIVERED`

### Cancellation

**Who:** SENDER (or ADMIN)  
**Endpoint:** `PUT /deliveries/:id/cancel`

- Only allowed when delivery is in one of these statuses:
  `DRAFT`, `BROADCAST`, `COURIER_ASSIGNED`, `COURIER_CONFIRMED`, `PICKUP_EN_ROUTE`, `ARRIVED_PICKUP`
- After package is picked up, cancellation is no longer possible — must raise a dispute instead
- State machine transitions to `CANCELLED`
- Sets `cancelledAt` timestamp

### Disputes

If something goes wrong after pickup (damaged package, disagreement, etc), the delivery goes to `DISPUTED` status. Admins review and resolve disputes in the admin dashboard.

---

## 8. The State Machine

The **`DeliveryStateMachineService`** is a dedicated service that manages all delivery status transitions. No code is allowed to change a delivery's status directly — it must go through this service.

### Transition Rules

```
DRAFT              → BROADCAST
BROADCAST          → COURIER_ASSIGNED, CANCELLED
COURIER_ASSIGNED   → COURIER_CONFIRMED, CANCELLED
COURIER_CONFIRMED  → PICKUP_EN_ROUTE, CANCELLED
PICKUP_EN_ROUTE    → ARRIVED_PICKUP, CANCELLED
ARRIVED_PICKUP     → PICKED_UP, CANCELLED
PICKED_UP          → IN_TRANSIT, DISPUTED
IN_TRANSIT         → ARRIVED_DROPOFF, DISPUTED
ARRIVED_DROPOFF    → DELIVERED, FAILED, DISPUTED
DELIVERED          → (terminal)
CANCELLED          → (terminal)
DISPUTED           → (terminal)
FAILED             → (terminal)
```

### What the State Machine Does

When `transition()` is called:

1. **Validates** the transition is allowed (checks the rules table)
2. **Updates** the delivery's `status` column
3. Sets timestamps automatically (e.g., `cancelledAt`, `pickedUpAt`, `deliveredAt`)
4. **Creates a `delivery_events` row** — this is the audit log
5. Maps the new status to an event type (e.g., `COURIER_ARRIVED_PICKUP`)

### Event Audit Log

Every status change creates a `delivery_events` row with:
- `delivery_id` — which delivery
- `user_id` — who triggered the change
- `event_type` — what event (e.g., `DELIVERY_CREATED`, `PACKAGE_PICKED_UP`, `DELIVERY_COMPLETED`)
- `metadata` — JSON blob with extra context (e.g., `{ dropoffOtp: "123456" }`)
- `occurred_at` — when it happened

This gives a complete, tamper-proof timeline of every delivery.

---

## 9. Real-Time WebSocket System

The app uses **Socket.io** for real-time communication. The WebSocket server runs on the same NestJS backend, at the `/ws` namespace.

### Connection

1. Client connects to `http://localhost:3001/ws`
2. Sends the JWT token in `auth.token` handshake parameter
3. Server verifies the token with Supabase Auth
4. If invalid, the client is disconnected immediately

### Rooms

Clients join "rooms" to receive targeted messages:

| Event | Client sends | Server sends to room |
|-------|--------------|---------------------|
| `join:delivery` | `join:delivery`, `deliveryId` | Server adds client to `delivery:<id>` room |
| `leave:delivery` | `leave:delivery`, `deliveryId` | Server removes client from room |
| `join:courier` | `join:courier`, `courierId` | Server adds client to `courier:<id>` room |
| `leave:courier` | `leave:courier`, `courierId` | Server removes client from room |

### Events Sent to Clients

| Event | Emitted when | Sent to |
|-------|-------------|---------|
| `job:available` | New delivery created near a courier | `courier:<id>` room |
| `job:cancelled` | A job is cancelled | `delivery:<id>` room |
| `courier:interested` | Job taken / payment held / agreement confirmed | `delivery:<id>` room |
| `delivery:status` | Delivery status changes | `delivery:<id>` room |
| `courier:location` | Courier sends GPS update (live tracking) | `delivery:<id>` room |
| `message:new` | New chat message sent | `delivery:<id>` room |

### Events Received from Clients

| Event | Data | Purpose |
|-------|------|---------|
| `location:update` | `{ deliveryId, lat, lng, accuracy?, heading?, speed? }` | Courier sends their GPS position |
| `status:update` | `{ deliveryId, status }` | Status change notification |

### Live Tracking

When the courier sends a `location:update`:
1. The server broadcasts `courier:location` to everyone in the `delivery:<id>` room
2. The sender sees the courier's position on a live map
3. Note: GPS updates are broadcast but not persisted to the `courier_locations` table via WebSocket (the courier's location IS saved when they explicitly call the location update API endpoint)

---

## 10. Wallet & Payment System

### Wallet Table

Every user has one wallet (created automatically on first access):

```
wallets:
  id            UUID
  user_id       UUID (unique — one wallet per user)
  balance       Double (default 0)
  created_at
  updated_at

wallet_transactions:
  id              UUID
  wallet_id       UUID
  type            credit | debit | fee | withdrawal | refund
  description     Text
  amount          Double
  reference_type  Text (e.g., 'delivery')
  reference_id    Text
  status          pending | completed | failed
  created_at
```

### Escrow Flow

The payment system uses an **escrow model** — money is held and only released when delivery is confirmed:

1. **Sender pays** → `payment_status = 'HELD'`; sender's wallet is debited by `agreedPriceRwf`
2. **Delivery completed** → `payment_status = 'RELEASED'`; courier's wallet is credited

### Service Fee

- Fixed **100 RWF** per delivery
- Deducted from the courier's payout
- Formula: `courier_payout = agreed_price_rwf - 100`
- Two transactions are created when crediting a courier:
  - `credit` transaction for the net amount
  - `fee` transaction for the service fee

### Wallet Operations

| Action | Endpoint | What happens |
|--------|----------|-------------|
| View wallet | `GET /wallet` | Returns balance + last 50 transactions |
| Top up | `POST /wallet/topup` | Adds money to wallet (for senders) |
| Withdraw | `POST /wallet/withdraw` | Deducts from wallet (for couriers — sends to MoMo) |

### Current Limitations (Placeholder)

- **Payment gateway**: The actual payment integration (MTN MoMo, card payment) is not implemented. Currently, the wallet debit just subtracts a number with no real money movement.
- **Withdrawal processing**: Withdrawal requests are recorded but not actually disbursed — requires MTN MoMo API integration.

---

## 11. Chat System

Each delivery has a **chat room** where the sender and courier can communicate.

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /deliveries/:id/chat` | GET | Get all messages for a delivery |
| `POST /deliveries/:id/chat` | POST | Send a message |
| `GET /chat/conversations` | GET | List all conversations for the current user |

### Authorization

- Only the **sender** and the **assigned courier** can read/send messages
- Messages are delivered in real-time via WebSocket (`message:new` event)

### Message Format

```
{
  id: "uuid",
  deliveryId: "uuid",
  senderId: "uuid",
  body: "text message",
  photoUrl: null (optional image),
  isTemplate: false,
  readAt: null (when recipient reads it),
  sentAt: "timestamp",
  sender: { id, fullName, role }
}
```

### Conversations List

The `GET /chat/conversations` endpoint returns a list of all deliveries the user is involved in, with:
- The other party's profile (name, photo)
- The last message in each conversation
- Unread message count

---

## 12. Tracking Page (Public, No Login)

**Anyone with a tracking token** can view a delivery's progress — no login required. This is for recipients who don't have the app.

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /track/:token` | GET | View delivery status (public) |
| `POST /track/:token/confirm-otp` | POST | Confirm delivery by entering OTP (public) |

### What the Recipient Sees

On the tracking page:
- Delivery status (e.g., "Courier is on the way", "Package picked up", "In transit")
- Pickup and drop-off addresses
- Courier details (name, phone, vehicle plate, photo)
- Live location on map (if delivery is in transit)
- ETA if available

### OTP Confirmation via Tracking Page

When the recipient opens the tracking link and the courier has arrived:
1. They see "Enter the OTP sent to your phone"
2. They enter the 6-digit code
3. Backend verifies the OTP
4. On success: same flow as courier-completed delivery
   - Status → `DELIVERED`
   - Payment released from escrow
   - Courier wallet credited
   - Stats updated
   - Sender notified

---

## 13. Admin Dashboard

### Authentication

Admin login is at `/admin/auth` — standard email/password with an extra `role = ADMIN` check.

### Dashboard (`GET /admin/dashboard`)

Shows a real-time overview:
- Active deliveries count
- Online couriers count
- Deliveries completed today
- Open disputes
- Total couriers and users
- Revenue (today, this week, this month)
- Pending courier verifications
- Top couriers by rating
- Recent activity log
- Failed/disputed deliveries

### Courier Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /admin/couriers` | GET | List all couriers (filterable by tier, approval status, zone) |
| `PUT /admin/couriers/:id/verify` | PUT | Approve/reject courier, set verification tier |
| `PUT /admin/couriers/:id/suspend` | PUT | Suspend a courier (sets isActive = false) |

### User & Delivery Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /admin/users` | GET | List all users (filterable by role, searchable) |
| `GET /admin/deliveries` | GET | List all deliveries (filterable by status) |
| `GET /admin/disputes` | GET | List all disputes |
| `PUT /admin/disputes/:id` | PUT | Update dispute status, add resolution |
| `GET /admin/live-map` | GET | Get all online courier locations for the live map view |

---

## 14. File Uploads (Cloudflare R2)

Documents (selfies, ID photos, vehicle photos) are uploaded directly from the frontend to **Cloudflare R2** (S3-compatible object storage).

### How It Works

1. Frontend requests an upload URL from the backend
2. Backend generates a **presigned upload URL** for R2
3. Frontend uploads the file directly to R2 using the presigned URL
4. Cloudflare R2 serves the file as a public URL
5. Frontend saves the URL in the onboarding session data

### Current Implementation

The storage service returns presigned URLs but the actual file upload is done client-side. Files are organized in folders by type:
- `courier-selfies/`
- `courier-ids/`
- `courier-vehicles/`
- `courier-licenses/`
- `courier-jackets/`
- `delivery-photos/`

---

## 15. Notifications System

The **`NotificationsService`** is a stub — all methods currently just log to the console. In production, these would integrate with real notification providers.

### Notification Events

| Method | When called | Channel |
|--------|-------------|---------|
| `notifyJobAvailable(phone, address)` | New delivery available near courier | SMS |
| `notifyCourierAccepted(phone, name)` | Courier takes a job | SMS |
| `notifyDeliveryStarted(phone)` | Courier starts delivery | SMS |
| `notifyMoneyReceived(phone, amount)` | Sender pays into escrow | SMS |
| `notifyDeliveryCompleted(phone, courierName)` | Delivery completed | SMS |
| `sendOtp(phone, otp, email?)` | Drop-off OTP generated | SMS + Email + WhatsApp (stub) |

### Integration Points (TBD)

- **SMS**: Twilio or Africa's Talking for real SMS delivery
- **WhatsApp**: Twilio WhatsApp / WATI / 360dialog
- **Email**: Resend / SendGrid for email OTP delivery

---

## 16. Frontend Architecture

The frontend uses **Next.js 16 App Router** with client-side state managed by **Zustand**.

### Directory Structure

```
frontend/
  app/              # Next.js App Router pages
    admin/          # Admin dashboard pages
    auth/           # Signin, signup, OTP pages
    chat/           # Chat pages
    courier/        # Courier dashboard + job pages
    deliveries/     # Delivery detail pages
    sender/         # Sender dashboard + create delivery
    track/          # Public tracking page (recipient)
    wallet/         # Wallet pages
  components/       # Shared React components
    admin/          # Admin-specific components
    courier/        # Courier-specific components
    delivery/       # Delivery card, status badge, etc.
    layout/         # AppLayout, Navbar, Sidebar
    map/            # Map components
    ui/             # Reusable UI components (buttons, inputs, etc.)
  hooks/            # React hooks (empty currently)
  lib/              # Utility modules
    api.ts          # HTTP client wrapper
    socket.ts       # WebSocket client
    supabase.ts     # Supabase client
    ors.ts          # OpenRouteService (routing)
    utils.ts        # Shared utilities
  stores/           # Zustand state stores
    auth.ts         # User auth state
    deliveries.ts   # Delivery list state
    wallet.ts       # Wallet balance/transactions state
    messages.ts     # Chat messages state
    admin.ts        # Admin dashboard state
  types/            # TypeScript type declarations
```

### Frontend State Management (Zustand)

**auth store:**
- `user` — current user object (null if not logged in)
- `fetchProfile()` — calls `GET /auth/me` to load user
- `logout()` — clears tokens and Supabase session

**deliveries store:**
- `deliveries` — list of deliveries (role-filtered)
- `fetchDeliveries()` / `fetchDeliveryById()` / `createDelivery()` / `updateStatus()`

**wallet store:**
- `balance` / `transactions` — wallet data
- `fetchWallet()` / `topUp()` / `withdraw()`

### Middleware (Route Protection)

The `middleware.ts` runs on every request and:

1. Checks for auth token (cookie or header)
2. No token → redirect to `/auth` (unless the route is public)
3. Token present on auth pages → redirect to appropriate dashboard based on role
4. Role-specific routes (`/admin/*`, `/sender/*`, `/courier/*`) — verifies the user's role and redirects if wrong

### API Client (`lib/api.ts`)

A simple fetch wrapper that:
- Prepends `/api/v1` to all paths
- Attaches `Authorization: Bearer <token>` from localStorage
- Includes cookies for SSR
- Handles errors (parses JSON error response, throws)

### WebSocket Client (`lib/socket.ts`)

- Creates a single Socket.io connection to the backend
- Reads token from localStorage for authentication
- Supports reconnection (max 10 attempts, 1s delay)
- Exported functions: `getSocket()` and `disconnectSocket()`

---

## 17. Delivery Status Summary Table

| # | Status | Description | Who Can Trigger | Next Statuses |
|---|--------|-------------|-----------------|---------------|
| 1 | `DRAFT` | Initial state when sender creates | Backend (auto) | `BROADCAST` |
| 2 | `BROADCAST` | Available for couriers to take | Backend (auto) | `COURIER_ASSIGNED`, `CANCELLED` |
| 3 | `COURIER_ASSIGNED` | A courier has claimed the job | Courier | `COURIER_CONFIRMED`, `CANCELLED` |
| 4 | `COURIER_CONFIRMED` | Price agreed between both parties | Sender/Courier | `PICKUP_EN_ROUTE`, `CANCELLED` |
| 5 | `PICKUP_EN_ROUTE` | Courier is heading to pickup | Courier | `ARRIVED_PICKUP`, `CANCELLED` |
| 6 | `ARRIVED_PICKUP` | Courier arrived at pickup location | Courier | `PICKED_UP`, `CANCELLED` |
| 7 | `PICKED_UP` | Courier has the package | Courier | `IN_TRANSIT`, `DISPUTED` |
| 8 | `IN_TRANSIT` | Courier is moving to drop-off | Courier | `ARRIVED_DROPOFF`, `DISPUTED` |
| 9 | `ARRIVED_DROPOFF` | Courier arrived at destination | Courier | `DELIVERED`, `FAILED`, `DISPUTED` |
| 10 | `DELIVERED` | Package delivered, OTP confirmed | Courier/Recipient | (terminal) |
| 11 | `CANCELLED` | Delivery cancelled | Sender/Admin | (terminal) |
| 12 | `DISPUTED` | Dispute raised | System (auto) | (terminal) |
| 13 | `FAILED` | Delivery failed | System (auto) | (terminal) |

---

## 18. Complete API Endpoint Reference

### Authentication

| Method | Endpoint | Auth | Role | Rate Limit |
|--------|----------|------|------|------------|
| POST | `/auth/sender/signup` | No | — | 5/60s |
| POST | `/auth/sender/signin` | No | — | 10/60s |
| POST | `/auth/google` | No | — | 10/60s |
| POST | `/auth/google/callback` | No | — | 10/60s |
| POST | `/auth/courier/check-phone` | No | — | 10/60s |
| POST | `/auth/courier/request-otp` | No | — | 3/60s |
| POST | `/auth/courier/verify-otp` | No | — | 10/60s |
| POST | `/auth/admin/signin` | No | — | 5/60s |
| POST | `/auth/request-otp` | No | — | 3/60s |
| POST | `/auth/verify-otp` | No | — | 10/60s |
| POST | `/auth/refresh` | No | — | 10/60s |
| POST | `/auth/password/reset` | No | — | 3/60s |
| POST | `/auth/password/update` | JWT | Any | 5/60s |
| POST | `/auth/email/resend-confirmation` | No | — | 3/60s |
| GET | `/auth/sessions` | JWT | Any | — |
| POST | `/auth/sessions/revoke-all` | JWT | Any | 3/60s |
| POST | `/auth/logout` | JWT | Any | — |
| GET | `/auth/me` | JWT | Any | — |
| PATCH | `/auth/role` | JWT | ADMIN | — |

### Courier Onboarding

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/couriers/onboarding/start` | JWT | Any |
| PUT | `/couriers/onboarding/step` | JWT | Any |
| GET | `/couriers/onboarding/status` | JWT | Any |
| POST | `/couriers/onboarding/submit` | JWT | Any |
| POST | `/couriers/register` | JWT | Any |
| GET | `/couriers/profile` | JWT | COURIER |
| PUT | `/couriers/profile` | JWT | COURIER |
| POST | `/couriers/toggle-online` | JWT | COURIER |
| PUT | `/couriers/location` | JWT | COURIER |
| GET | `/couriers/jobs` | JWT | COURIER |
| GET | `/couriers/earnings` | JWT | COURIER |
| GET | `/couriers/dashboard` | JWT | COURIER |
| GET | `/couriers/nearby` | JWT | COURIER |
| GET | `/couriers/analytics` | JWT | COURIER |

### Deliveries

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/deliveries` | JWT | SENDER |
| GET | `/deliveries` | JWT | Any (role-filtered) |
| GET | `/deliveries/available` | JWT | COURIER |
| GET | `/deliveries/:id` | JWT | Any |
| POST | `/deliveries/:id/interest` | JWT | COURIER |
| POST | `/deliveries/:id/take-job` | JWT | COURIER |
| POST | `/deliveries/:id/confirm-agreement` | JWT | SENDER/COURIER |
| POST | `/deliveries/:id/pay` | JWT | SENDER |
| POST | `/deliveries/:id/start-delivery` | JWT | COURIER |
| POST | `/deliveries/:id/arrived-pickup` | JWT | COURIER |
| POST | `/deliveries/:id/picked-up` | JWT | COURIER |
| POST | `/deliveries/:id/in-transit` | JWT | COURIER |
| POST | `/deliveries/:id/arrived` | JWT | COURIER |
| POST | `/deliveries/:id/complete` | JWT | COURIER |
| POST | `/deliveries/:id/rate` | JWT | SENDER/COURIER |
| PUT | `/deliveries/:id/cancel` | JWT | SENDER |

### Tracking (Public)

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/track/:token` | No |
| POST | `/track/:token/confirm-otp` | No (5/60s) |

### Wallet

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/wallet` | JWT |
| POST | `/wallet/topup` | JWT (5/60s) |
| POST | `/wallet/withdraw` | JWT (5/60s) |

### Chat

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/deliveries/:id/chat` | JWT |
| POST | `/deliveries/:id/chat` | JWT |
| GET | `/chat/conversations` | JWT |

### Admin

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/admin/dashboard` | JWT | ADMIN |
| GET | `/admin/couriers` | JWT | ADMIN |
| PUT | `/admin/couriers/:id/verify` | JWT | ADMIN |
| PUT | `/admin/couriers/:id/suspend` | JWT | ADMIN |
| GET | `/admin/users` | JWT | ADMIN |
| GET | `/admin/deliveries` | JWT | ADMIN |
| GET | `/admin/disputes` | JWT | ADMIN |
| PUT | `/admin/disputes/:id` | JWT | ADMIN |
| GET | `/admin/live-map` | JWT | ADMIN |

### Storage

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/storage/upload-url` | JWT |

### Sender

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/sender/dashboard` | JWT | SENDER |
| GET | `/sender/history` | JWT | SENDER |
| GET | `/sender/analytics` | JWT | SENDER |
| GET | `/sender/templates` | JWT | SENDER |
| POST | `/sender/templates` | JWT | SENDER |
| PUT | `/sender/templates/:id` | JWT | SENDER |
| DELETE | `/sender/templates/:id` | JWT | SENDER |

---

## Quick Reference: Data Flow Summary

```
SENDER creates delivery → DRAFT
  → Auto-broadcast → BROADCAST
    → Courier takes job → COURIER_ASSIGNED (atomic update, one courier only)
      → Price agreed → COURIER_CONFIRMED
        → Sender pays → HELD (escrow)
          → Courier starts → PICKUP_EN_ROUTE (pickup OTP generated)
            → Arrives at pickup → ARRIVED_PICKUP (OTP verified)
              → Picks up package → PICKED_UP
                → In transit → IN_TRANSIT (live GPS tracking)
                  → Arrives at drop-off → ARRIVED_DROPOFF (dropoff OTP sent)
                    → OTP confirmed → DELIVERED (payment released, courier paid)
                      → Rating given → complete
```

### Key Principles

1. **Statuses are linear** — you can't skip steps or go backward
2. **OTPs secure handovers** — pickup OTP proves sender handed over, dropoff OTP proves recipient received
3. **Escrow protects everyone** — sender pays upfront, courier gets paid on delivery
4. **Every action is audited** — the `delivery_events` table records every status change
5. **Role-based access** — senders, couriers, and admins each have their own permissions
6. **Real-time by design** — WebSocket events push updates so no one needs to refresh
