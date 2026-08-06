# BACKEND LOGIC — Kigali Motorcycle Delivery App

> Complete reference for all backend logic, flows, and design decisions.
> Stack: Express + TypeScript · Prisma ORM · Neon PostgreSQL · Socket.IO · Zod · JWT · Cloudinary · Africa's Talking (stub)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication System](#2-authentication-system)
3. [Courier Onboarding (3-Step Mobile Flow)](#3-courier-onboarding-3-step-mobile-flow)
4. [Geocoding & Location System](#4-geocoding--location-system)
5. [Delivery Lifecycle (Full Flow)](#5-delivery-lifecycle-full-flow)
6. [Wallet & Payment System](#6-wallet--payment-system)
7. [Courier Efficiency Scoring System](#7-courier-efficiency-scoring-system)
8. [Real-Time WebSocket System](#8-real-time-websocket-system)
9. [Chat System](#9-chat-system)
10. [Recipient Tracking (Public)](#10-recipient-tracking-public)
11. [Admin System](#11-admin-system)
12. [File Storage (Cloudinary)](#12-file-storage-cloudinary)
13. [State Machine & Event Log](#13-state-machine--event-log)
14. [Error Handling](#14-error-handling)
15. [Environment Configuration](#15-environment-configuration)

---

## 1. Overview

### What the System Does

This is a motorcycle delivery platform serving **3 districts in Kigali, Rwanda**:
- **Nyarugenge** — city centre
- **Kicukiro** — southern district
- **Gasabo** — northern/eastern district

Senders create delivery jobs. Approved couriers (motorcycle riders) receive nearby job
notifications in real time, pick up packages, and deliver them. Payments are held in
escrow and released only after OTP-verified delivery.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + Express 5 |
| Language | TypeScript |
| ORM | Prisma |
| Database | Neon PostgreSQL (serverless) |
| Real-time | Socket.IO (path `/ws`) |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Storage | Cloudinary (signed uploads) |
| SMS | Africa's Talking (stub — console only) |
| Geocoding | Nominatim (OpenStreetMap) |

### Architecture Layers

```
HTTP Request
     │
     ▼
 routes/          ← Zod schema validation, middleware wiring
     │
     ▼
 controllers/     ← Parse req/res, call service, return JSON
     │
     ▼
 services/        ← All business logic, orchestration
     │
     ▼
 repositories/    ← Prisma queries (no raw SQL except efficiency scoring)
     │
     ▼
 Prisma Client → Neon PostgreSQL
```

- All routes mount under `/api/v1`
- Health check: `GET /health` (no auth, returns `{ status: "ok" }`)
- Rate limit: 100 requests per minute per IP

---

## 2. Authentication System

### Roles

| Role | How they sign up | How they sign in |
|------|-----------------|-----------------|
| `SENDER` | Email + password | Email + password |
| `COURIER` | Phone OTP (3-step onboarding) | Phone OTP |
| `ADMIN` | Pre-seeded in DB | Email + password (role check) |

---

### 2.1 Sender Signup & Signin

**Signup** — `POST /auth/sender/signup`

1. Accepts `{ email, password (≥6 chars), fullName? }`
2. Checks email is not already in use → `ConflictError` if taken
3. Hashes password with `bcrypt` (salt rounds = 10)
4. Creates `User` row with `role = SENDER`
5. Generates access token + refresh token (see Token System below)
6. Returns `{ accessToken, refreshToken, user }` and sets httpOnly cookies

**Signin** — `POST /auth/sender/signin`

1. Accepts `{ email, password }`
2. Looks up user by email → `UnauthorizedError` if not found
3. `bcrypt.compare(password, user.passwordHash)` → `UnauthorizedError` if wrong
4. Generates and returns new token pair

---

### 2.2 Admin Signin

**`POST /auth/admin/signin`**

Identical to sender signin, but after bcrypt verification it checks:

```typescript
if (user.role !== 'ADMIN') throw new ForbiddenError('Not an admin');
```

Returns the same token structure. Admin tokens carry `{ sub: userId, role: 'ADMIN' }`.

---

### 2.3 Courier Signup (Step 1 of Onboarding)

**`POST /auth/courier/signup`**

1. Accepts `{ email, password, phone }`
2. Creates `User` with `role = COURIER`
3. Seeds an `OnboardingSession` row: `{ fullName, phone, email, currentStep: 1 }`
4. Returns `{ accessToken, refreshToken, needsOnboarding: true }`

The mobile app uses this `accessToken` immediately to continue onboarding steps 2 and 3.

---

### 2.4 Courier OTP Login (Phone-Based)

Three endpoints work together for OTP login:

**Step A — `POST /auth/courier/check-phone`**
- Body: `{ phone }`
- Returns `{ exists: boolean }` — tells the app whether to show "Sign Up" or "Sign In"

**Step B — `POST /auth/courier/request-otp`**
- Body: `{ phone }`
- Auto-creates a `COURIER` user if the phone doesn't exist yet
- Generates a 6-digit numeric OTP
- Bcrypt-hashes the OTP and stores the hash in the `refresh_tokens` table with a 10-minute expiry
- Logs the OTP to console (SMS stub — no real SMS yet)

**Step C — `POST /auth/courier/verify-otp`**
- Body: `{ phone, token }` where `token` is the 6-digit OTP
- Looks up the stored hash for that phone → `UnauthorizedError` if expired or not found
- `bcrypt.compare(token, hash)` → `UnauthorizedError` if wrong
- Deletes the used OTP record (single-use)
- Returns `{ accessToken, refreshToken, needsOnboarding, pendingApproval, approved }`

The three flags guide the mobile app's navigation:
- `needsOnboarding: true` → go to onboarding flow
- `pendingApproval: true` → go to PendingApproval screen
- `approved: true` → go to CourierDashboard

---

### 2.5 Google Auth

**`POST /auth/google`**

- Body: `{ email, fullName?, googleId?, avatarUrl? }`
- Upserts a `SENDER` user by email (creates if new, returns existing if found)
- Returns the standard token pair
- Only creates `SENDER` accounts — couriers cannot use Google auth

---

### 2.6 Token System

**Access Token**
- Signed JWT, payload: `{ sub: userId, role }`
- Expiry: `JWT_EXPIRES_IN` (default `1h`)
- Algorithm: HS256, secret from `JWT_SECRET`

**Refresh Token**
- Random UUID stored in `refresh_tokens` table
- Expiry: `REFRESH_TOKEN_EXPIRES_IN` (default `30d`)
- Rotated on every use: old token is deleted, new one issued
- `POST /auth/refresh` — reads token from body OR `refresh_token` cookie

**Cookie behaviour**
Every auth response (signup, signin, verify-otp) does two things:
1. Returns `{ accessToken, refreshToken, user }` in the JSON body
2. Sets two httpOnly cookies:
   - `access_token` — 1h expiry
   - `refresh_token` — 30d expiry

```typescript
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 1000, // 1 hour
});
```

---

### 2.7 Auth Middleware

`authenticate` middleware in `backend/src/middleware/auth.ts`:

1. Reads `Authorization: Bearer <token>` header, OR
2. Falls back to `access_token` httpOnly cookie
3. Verifies JWT signature and expiry
4. Attaches `{ id, role }` to `req.user`
5. Throws `UnauthorizedError` if token is missing or invalid

`requireRole(...roles)` middleware:
- Checks `req.user.role` is in the allowed list
- Throws `ForbiddenError` if not

```typescript
router.post('/deliveries', authenticate, requireRole('SENDER'), createDelivery);
```

---

### 2.8 Session Management

- `GET /auth/sessions` — returns all active refresh tokens for the current user
- `POST /auth/sessions/revoke-all` — deletes all refresh tokens for the user, effectively signing out all devices
- `POST /auth/logout` — clears httpOnly cookies + deletes the current refresh token

---

### 2.9 Password Reset (Stub)

`POST /auth/password/reset` — logs the reset token to console. No email is sent yet.
`POST /auth/password/update` — accepts `{ newPassword }`, bcrypt-hashes, updates DB.

---

### 2.10 Other Auth Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /auth/me` | Returns current user profile (protected) |
| `PATCH /auth/role` | Change a user's role (protected, admin use) |

---

## 3. Courier Onboarding (3-Step Mobile Flow)

Courier registration is a 3-step form spread across multiple API calls. An `OnboardingSession`
table tracks partial progress so the courier can resume if they close the app.

```
Step 1: POST /auth/courier/signup     ← creates User + OnboardingSession
Step 2: PUT  /couriers/onboarding/step  ← personal + vehicle details
Step 3: PUT  /couriers/onboarding/step  ← document photo URLs
Submit: POST /couriers/onboarding/submit ← terms acceptance + final copy to Courier record
```

---

### 3.1 Step 1 — Create Account

**`POST /auth/courier/signup`**

What happens:
1. Validates `{ email, password, phone }` (Zod)
2. Bcrypt-hashes the password
3. Creates a `User` row: `role = COURIER`, `isActive = true`
4. Creates an `OnboardingSession` row:
   ```json
   { "userId": "...", "fullName": null, "phone": "...", "email": "...", "currentStep": 1 }
   ```
5. Generates access + refresh tokens
6. Returns `{ accessToken, refreshToken, needsOnboarding: true }`

The mobile app stores the `accessToken` and immediately navigates to Step 2.

---

### 3.2 Step 2 — Personal & Vehicle Details

**`PUT /couriers/onboarding/step`** (authenticated, body `{ step: 2, ...fields }`)

Fields saved to `OnboardingSession`:
- `nationalIdNumber` — Rwandan national ID
- `motorcyclePlate` — vehicle plate number
- `momoNumber` — MoMo phone number for payouts
- `momoProvider` — e.g. `"MTN"` or `"Airtel"`
- `jacketSerialNumber` — company jacket identifier
- `operatingZone` — **must be one of**: `"Nyarugenge"`, `"Kicukiro"`, `"Gasabo"`

The zone is validated with Zod enum:
```typescript
z.enum(['Nyarugenge', 'Kicukiro', 'Gasabo'])
```

Updates `OnboardingSession.currentStep = 2`.

---

### 3.3 Step 3 — Document Photos

**`PUT /couriers/onboarding/step`** (body `{ step: 3, ...fields }`)

Fields saved (all are Cloudinary public URLs from the signed upload flow):
- `selfieUrl` — selfie photo
- `idPhotoUrl` — national ID photo
- `licensePhotoUrl` — motorcycle driving licence photo

Updates `OnboardingSession.currentStep = 3`.

> The client uploads files directly to Cloudinary first (see Section 12), then sends
> the resulting `publicUrl` values in this request.

---

### 3.4 Submit — Terms & Final Copy

**`POST /couriers/onboarding/submit`**

Body: `{ agreeToTerms: true }` (Zod validates this must be `true`)

What happens:
1. Loads the `OnboardingSession` for the current user
2. Validates all required fields are present (throws `BadRequestError` if incomplete)
3. Copies all fields from `OnboardingSession` into the `Courier` record:
   - Personal: nationalIdNumber, operatingZone, momoNumber, momoProvider
   - Vehicle: motorcyclePlate, jacketSerialNumber
   - Photos: selfieUrl, idPhotoUrl, licensePhotoUrl
4. Sets `OnboardingSession.isSubmitted = true`
5. Sets `Courier.isApprovedByAdmin = false` (enters PENDING state)
6. Returns `{ pendingApproval: true }`

The mobile app navigates to the `PendingApproval` screen.

---

### 3.5 Admin Approval

**`PUT /admin/couriers/:id/verify`** (ADMIN role)

Body: `{ approved: boolean, reason?: string }`

What happens:
1. Sets `Courier.isApprovedByAdmin = approved`
2. Optionally records rejection reason
3. **Emits WebSocket event** `courier:approval` to room `courier:{userId}`:
   ```json
   { "type": "courier:approval", "approved": true }
   ```
4. The mobile app receives this event and transitions:
   - `approved: true` → navigate to `CourierDashboard`
   - `approved: false` → show rejection reason

---

### 3.6 Supporting Onboarding Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /couriers/onboarding/start` | Manually start/restart a session |
| `GET /couriers/onboarding/status` | Get current step + completion status |
| `POST /couriers/register` | Alternative registration entry point |

---

## 4. Geocoding & Location System

All geocoding logic lives in `backend/src/lib/geocoding.ts` and is exposed via
`backend/src/controllers/geocoding.controller.ts`.

### Kigali Bounding Box

```
Latitude:  -2.08  to  -1.82
Longitude: 29.92  to  30.20
```

Any coordinate outside this box is considered outside Kigali.

### District Centre Points

Used for detecting which district a coordinate belongs to (nearest-centre rule):

| District | Latitude | Longitude |
|----------|----------|-----------|
| Nyarugenge | -1.9494 | 30.0605 |
| Gasabo | -1.9217 | 30.0930 |
| Kicukiro | -1.9864 | 30.0897 |

---

### 4.1 GET /geocode/bounds (Public — No Auth)

Returns the Kigali bounding box and district centres for map initialisation.
Called by the frontend/mobile on startup to configure the map view.

```json
{
  "bounds": { "minLat": -2.08, "maxLat": -1.82, "minLng": 29.92, "maxLng": 30.20 },
  "districts": [
    { "name": "Nyarugenge", "lat": -1.9494, "lng": 30.0605 },
    { "name": "Gasabo",     "lat": -1.9217, "lng": 30.0930 },
    { "name": "Kicukiro",   "lat": -1.9864, "lng": 30.0897 }
  ]
}
```

---

### 4.2 POST /geocode/resolve (Auth Required)

Converts a text address string to `{ lat, lng }`.

Request: `{ address: "KG 7 Ave, Kigali" }`

Steps:
1. Calls Nominatim (OpenStreetMap) with `viewbox` bias set to Kigali bounds
2. Takes the first result
3. Checks coordinates are within bounding box
4. Returns `422 Unprocessable Entity` if outside Kigali
5. Also returns the detected district name

Response:
```json
{ "lat": -1.9494, "lng": 30.0605, "district": "Nyarugenge", "displayName": "KG 7 Ave, Nyarugenge, Kigali" }
```

---

### 4.3 POST /geocode/reverse (Auth Required)

Converts a pin-drop `{ lat, lng }` to a human-readable address.

Steps:
1. Validates coordinates are within Kigali bounding box → `422` if outside
2. Calls Nominatim reverse geocoding
3. Determines district by finding the nearest district centre
4. Returns address string + district name

Response:
```json
{ "address": "KG 11 Ave, Nyarugenge, Kigali", "district": "Nyarugenge" }
```

---

### 4.4 Delivery Coordinate Validation

When a sender creates a delivery (`POST /deliveries`), both coordinates are validated:

```typescript
if (!isWithinKigali(pickupLat, pickupLng))
  throw new BadRequestError('Pickup location is outside Kigali');

if (!isWithinKigali(dropoffLat, dropoffLng))
  throw new BadRequestError('Dropoff location is outside Kigali');
```

The `isWithinKigali()` helper checks the bounding box. This prevents deliveries
being created with GPS coordinates outside the service area.

---

## 5. Delivery Lifecycle (Full Flow)

### Status Progression

```
DRAFT
  └─▶ BROADCAST
        └─▶ COURIER_ASSIGNED
              └─▶ COURIER_CONFIRMED
                    └─▶ PICKUP_EN_ROUTE
                          └─▶ ARRIVED_PICKUP
                                └─▶ PICKED_UP
                                      └─▶ IN_TRANSIT
                                            └─▶ ARRIVED_DROPOFF
                                                  └─▶ DELIVERED ✓

Terminal states: CANCELLED ✗  |  DISPUTED ⚠  |  FAILED ✗
```

### Payment Status (parallel track)

```
PENDING  →  HELD  →  RELEASED
```

- `PENDING` — no payment yet (default)
- `HELD` — sender paid; funds locked in escrow
- `RELEASED` — OTP verified; funds sent to courier wallet

---

### Step 1 — Create Delivery

**`POST /deliveries`** (SENDER only)

Request body includes:
- Pickup: `{ address, lat, lng, contactName, contactPhone, pickupEmail? }`
- Dropoff: `{ address, lat, lng, contactName, contactPhone, dropoffEmail? }`
- Item: `{ description, weight?, category? }`
- `quotedPriceRwf` — sender's price quote (minimum 200 RWF)

What happens:
1. Validates both coordinates are within Kigali bounding box → `400` if not
2. Validates `quotedPriceRwf >= 200` (MIN_DELIVERY_PRICE_RWF)
3. Generates `recipientTrackingToken` — 40-character cryptographic hex string
4. Creates `Delivery` row with `status = DRAFT`, `paymentStatus = PENDING`
5. **Immediately fires** `broadcastToNearbyCouriers(deliveryId)` — async, non-blocking
6. Returns the created delivery object (including the tracking token)

---

### Step 2 — Auto-Broadcast to Couriers (Internal)

`broadcastToNearbyCouriers()` runs in the background:

1. Transitions delivery to `BROADCAST` via state machine
2. Calls `efficiency.getRankedOnlineCouriers()`:
   - Queries all online couriers (`isOnline = true`) with non-null `currentLat`/`currentLng`
   - Sorts by `reliabilityScore DESC` — best-scored couriers are prioritised
3. Filters by **Haversine distance ≤ BROADCAST_RADIUS_KM** (5 km, from env) from pickup
4. For each qualifying courier, emits `job:available` WebSocket event to room `courier:{userId}`:
   ```json
   {
     "type": "job:available",
     "delivery": { "id": "...", "pickup": {...}, "dropoff": {...}, "quotedPriceRwf": 2500 },
     "courierScore": 82.4
   }
   ```
5. Sends SMS notification (stub — console log only)

The Haversine formula calculates straight-line distance in km:
```typescript
const R = 6371;
const dLat = toRad(lat2 - lat1);
const dLng = toRad(lng2 - lng1);
const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
```

---

### Step 3 — Courier Takes the Job

**`POST /deliveries/:id/take-job`** (COURIER only)

This is **concurrency-safe**. Two couriers pressing "Accept" at the same time will not
both get the job.

```typescript
const result = await prisma.delivery.updateMany({
  where: { id, status: 'BROADCAST', courierId: null },
  data:  { status: 'COURIER_ASSIGNED', courierId: courier.id },
});
if (result.count === 0) throw new ConflictError('Job is no longer available');
```

If `count === 0`, another courier already took it → returns `409 Conflict`.

On success:
1. Transitions to `COURIER_ASSIGNED`
2. Creates `DeliveryEvent` audit record
3. Notifies sender via SMS (stub)
4. Emits `courier:interested { type: 'JOB_TAKEN' }` to `delivery:{id}` room

---

### Step 4 — Confirm Agreement

**`POST /deliveries/:id/confirm-agreement`** (SENDER or COURIER)

Either party can submit the final terms:

Request:
```json
{ "agreedPriceRwf": 3000, "agreedDeliveryTime": 45 }
```

Validation:
- `agreedPriceRwf >= MIN_DELIVERY_PRICE_RWF` (200 RWF)
- `agreedDeliveryTime <= MAX_DELIVERY_TIME_MINUTES` (120 min)

What happens:
1. Sets `agreedPriceRwf`, `finalPriceRwf`, `agreedDeliveryTime` on the delivery
2. Transitions `COURIER_ASSIGNED` → `COURIER_CONFIRMED`
3. Emits `courier:interested { type: 'AGREEMENT_CONFIRMED' }` to delivery room

---

### Step 5 — Sender Pays (Escrow)

**`POST /deliveries/:id/pay`** (SENDER only)

What happens:
1. Loads the delivery and checks `status === COURIER_CONFIRMED`
2. Loads sender's wallet → throws `400 Bad Request` if `balance < agreedPriceRwf`
3. Debits `agreedPriceRwf` from sender wallet in a Prisma transaction:
   ```typescript
   await prisma.$transaction([
     prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } }),
     prisma.walletTransaction.create({ data: { type: 'debit', amount, description: `Escrow hold — delivery #${shortId}` } }),
   ]);
   ```
4. Sets `paymentStatus = 'HELD'`, `paymentHeldAt = now()`
5. Emits `courier:interested { type: 'PAYMENT_HELD' }` to delivery room

> **Key rule**: A courier cannot start the delivery until `paymentStatus === 'HELD'`.

---

### Step 6 — Courier Starts Delivery (Pickup OTP)

**`POST /deliveries/:id/start-delivery`** (COURIER only)

Guard check first:
```typescript
if (delivery.paymentStatus !== 'HELD')
  throw new BadRequestError('Payment must be confirmed before starting');
```

What happens:
1. Generates a 6-digit numeric OTP: `Math.floor(100000 + Math.random() * 900000).toString()`
2. Bcrypt-hashes it: `await bcrypt.hash(otp, 10)`
3. Stores hash in `delivery.pickupOtpHash`
4. Sets `deliveryStartedAt = now()`
5. Transitions `COURIER_CONFIRMED` → `PICKUP_EN_ROUTE`
6. Returns plaintext OTP to the courier app: `{ pickupOtp: "482931" }`
7. Notifies sender via SMS (stub): "Your courier is on the way"

---

### Step 7 — Arrived at Pickup (OTP Verification)

**`POST /deliveries/:id/arrived-pickup`** (COURIER only)

Body: `{ otp: "482931" }` — sender shows this OTP to the courier

What happens:
1. `bcrypt.compare(body.otp, delivery.pickupOtpHash)`
2. Throws `400 Bad Request` if OTP is invalid: `"Invalid pickup OTP"`
3. Sets `courierArrivedAt = now()`
4. Transitions `PICKUP_EN_ROUTE` → `ARRIVED_PICKUP`

This OTP handshake proves the courier physically met the sender before picking up.

---

### Step 8 — Package Picked Up

**`POST /deliveries/:id/picked-up`** (COURIER only)

1. Sets `pickedUpAt = now()`
2. Transitions `ARRIVED_PICKUP` → `PICKED_UP`

No OTP needed — this is just a status tap by the courier.

---

### Step 9 — In Transit

**`POST /deliveries/:id/in-transit`** (COURIER only)

1. Transitions `PICKED_UP` → `IN_TRANSIT`
2. From this point, the courier continuously sends GPS updates via:
   **`PUT /couriers/me/location`** — `{ lat, lng, accuracy?, heading?, speed? }`
   - Saves to `CourierLocation` history table
   - Updates `courier.currentLat/currentLng`
   - Finds the courier's active delivery and emits `delivery:status { type: 'LOCATION_UPDATE' }` to the delivery room

---

### Step 10 — Arrived at Dropoff (Dropoff OTP)

**`POST /deliveries/:id/arrived`** (COURIER only)

What happens:
1. Generates a 6-digit dropoff OTP
2. Bcrypt-hashes it, stores in `delivery.dropoffOtpHash`
3. Sets `dropoffOtpSentAt = now()`
4. Calls `notifications.sendOtp()`:
   - SMS to recipient phone (stub)
   - WhatsApp to recipient phone (stub)
   - Email if `delivery.dropoffEmail` is set (stub)
5. Transitions `IN_TRANSIT` → `ARRIVED_DROPOFF`
6. Returns `{ updated: true, dropoffOtp: "654321" }` — plaintext OTP visible for testing/admin

---

### Step 11 — Complete Delivery

**`POST /deliveries/:id/complete`** (COURIER only)

Body: `{ otp: "654321" }` — recipient reads OTP from SMS/WhatsApp and tells the courier

OTP check logic:
```typescript
if (delivery.otpVerifiedAt) {
  // Recipient already pre-confirmed via the tracking page — skip OTP check
} else {
  const valid = await bcrypt.compare(body.otp, delivery.dropoffOtpHash);
  if (!valid) throw new BadRequestError('Invalid delivery OTP');
}
```

On success:
1. Sets `paymentStatus = 'RELEASED'`, `paymentReleasedAt = now()`, `otpVerifiedAt = now()`
2. Transitions → `DELIVERED`, sets `deliveredAt = now()`
3. **`await walletSvc.creditCourier()`** — this is AWAITED (not fire-and-forget):
   - `netAmount = agreedPriceRwf - SERVICE_FEE_RWF` (e.g. 3000 - 100 = 2900 RWF)
   - Creates credit transaction for courier
   - Creates fee transaction for platform
4. **`efficiency.recalculate(courierId)`** — async, non-blocking (does not delay response)
5. Notifies sender via SMS (stub)

---

### Cancellation

**`PUT /deliveries/:id/cancel`** (SENDER only)

**Allowed cancellation windows** (status must be one of):
- `DRAFT`
- `BROADCAST`
- `COURIER_ASSIGNED`
- `COURIER_CONFIRMED`
- `PICKUP_EN_ROUTE`
- `ARRIVED_PICKUP`

**Cannot cancel** once the package has been picked up (`PICKED_UP` or later).
Throws `400 Bad Request`: `"Cannot cancel after package has been picked up"`.

Cancellation logic:
1. Transitions delivery to `CANCELLED`, sets `cancelledAt = now()`
2. **If `paymentStatus === 'HELD'`**: automatically refunds full `agreedPriceRwf` to sender wallet:
   ```typescript
   await walletSvc.refundSender(delivery, userId);
   // Creates "refund" transaction: "Refund — cancelled delivery #XXXXXXXX"
   ```
3. **If a courier was assigned**: calls `efficiency.recalculate(courierId)` to penalise their completion rate
4. Emits `job:cancelled` WebSocket event to `delivery:{id}` room

---

### Rating

**`POST /deliveries/:id/rate`** (SENDER or COURIER)

Body: `{ stars: 1-5, comment?: string }`

- One rating per delivery per user (upsert — updating is allowed)
- After save, recomputes `courier.avgRating` from all their ratings
- Triggers `efficiency.recalculate(courierId)` since rating affects the score formula

---

### Delivery Summary Table

| Step | Endpoint | Who | Status After | Key Side Effect |
|------|----------|-----|-------------|----------------|
| 1 | POST /deliveries | SENDER | DRAFT → BROADCAST | broadcastToNearbyCouriers() |
| 2 | (internal) | system | BROADCAST | job:available WebSocket |
| 3 | POST /take-job | COURIER | COURIER_ASSIGNED | atomic update, SMS to sender |
| 4 | POST /confirm-agreement | SENDER/COURIER | COURIER_CONFIRMED | sets agreedPrice |
| 5 | POST /pay | SENDER | (paymentStatus=HELD) | debits wallet |
| 6 | POST /start-delivery | COURIER | PICKUP_EN_ROUTE | generates pickup OTP |
| 7 | POST /arrived-pickup | COURIER | ARRIVED_PICKUP | verifies pickup OTP |
| 8 | POST /picked-up | COURIER | PICKED_UP | sets pickedUpAt |
| 9 | POST /in-transit | COURIER | IN_TRANSIT | GPS tracking begins |
| 10 | POST /arrived | COURIER | ARRIVED_DROPOFF | generates dropoff OTP |
| 11 | POST /complete | COURIER | DELIVERED | credits courier, releases payment |

---

## 6. Wallet & Payment System

### Constants (from `.env`)

| Variable | Default | Meaning |
|----------|---------|---------|
| `SERVICE_FEE_RWF` | `100` | Platform fee deducted from every courier payout |
| `MIN_DELIVERY_PRICE_RWF` | `200` | Minimum agreed delivery price |

---

### Database Tables

- **`wallets`** — one row per user, single `balance` field (in RWF, integer)
- **`wallet_transactions`** — immutable ledger; types: `credit`, `debit`, `fee`, `withdrawal`, `refund`
- **`withdrawal_requests`** — records MoMo payout requests; status: `pending`, `completed`, `failed`

---

### Wallet Auto-Creation

The first time a user calls `GET /wallet`, if no wallet exists, one is created:

```typescript
let wallet = await walletRepo.findByUserId(userId);
if (!wallet) wallet = await walletRepo.create({ userId, balance: 0 });
```

---

### Payment Flow (The Money Trail)

**Step 1 — Top Up**

`POST /wallet/topup` — body: `{ amount, method? }`

- Creates a `credit` transaction
- Increments wallet balance
- Actual payment gateway (card/MoMo) is a stub — the credit is applied directly for now

---

**Step 2 — Escrow Hold (Pay for Delivery)**

`POST /deliveries/:id/pay` — body: none (amount comes from `delivery.agreedPriceRwf`)

```typescript
// Guard
if (wallet.balance < delivery.agreedPriceRwf)
  throw new BadRequestError('Insufficient wallet balance');

// Debit in a transaction
await prisma.$transaction([
  prisma.wallet.update({ data: { balance: { decrement: agreedPriceRwf } } }),
  prisma.walletTransaction.create({
    data: { type: 'debit', amount: agreedPriceRwf,
            description: `Escrow hold — delivery #${shortId}` }
  }),
]);
```

Sets `delivery.paymentStatus = 'HELD'`.

---

**Step 3 — Courier Payout (On Delivery)**

`walletSvc.creditCourier(delivery)` — called and **awaited** inside `completeDelivery()`.

```typescript
const netAmount = delivery.agreedPriceRwf - SERVICE_FEE_RWF; // e.g. 2900 RWF

await prisma.$transaction([
  // Credit courier net amount
  prisma.wallet.update({
    where: { userId: courier.userId },
    data: { balance: { increment: netAmount } }
  }),
  prisma.walletTransaction.create({
    data: { type: 'credit', amount: netAmount,
            description: `Delivery earnings — #${shortId} (RWF ${agreedPrice} − RWF ${fee} fee)` }
  }),
  // Record the platform fee separately
  prisma.walletTransaction.create({
    data: { type: 'fee', amount: SERVICE_FEE_RWF,
            description: `Platform service fee — delivery #${shortId}` }
  }),
]);
```

---

**Step 4 — Cancellation Refund**

`walletSvc.refundSender(delivery, senderId)` — called from `cancelDelivery()` when `paymentStatus === 'HELD'`.

```typescript
await prisma.$transaction([
  prisma.wallet.update({
    where: { userId: senderId },
    data: { balance: { increment: delivery.agreedPriceRwf } }
  }),
  prisma.walletTransaction.create({
    data: { type: 'refund', amount: delivery.agreedPriceRwf,
            description: `Refund — cancelled delivery #${shortId}` }
  }),
]);
```

Full amount is refunded — no fee is charged on cancellations.

---

### Withdrawal

**`POST /wallet/withdraw`** — body: `{ amount, momoNumber?, momoProvider? }`

1. Validates `wallet.balance >= amount` → `400` if insufficient
2. Decrements wallet balance
3. Creates `withdrawal` transaction
4. Creates `WithdrawalRequest` row with `status = 'pending'`

The actual MTN MoMo disbursement API call is **not yet implemented** — the
`withdrawal_requests` table holds pending requests until the integration is wired.

---

## 7. Courier Efficiency Scoring System

Lives in `backend/src/services/efficiency.ts`.

### Purpose

Every courier gets a score between 0 and 100. This score determines:
1. **Job priority** — higher-scored couriers receive `job:available` events first
2. **Admin visibility** — couriers sorted by score in the admin panel
3. **Courier self-view** — couriers can see their own score and tier

---

### Score Formula (4 Weighted Signals)

```
reliabilityScore =
  (avgRating / 5.0)                              × 40   // rating component
  + (delivered / (delivered+cancelled+failed))   × 30   // completion rate component
  + (onTimeDeliveries / totalDeliveries)         × 20   // punctuality component
  + (min(totalDeliveries, 500) / 500)            × 10   // volume component
```

**Signal breakdown:**

| Signal | Weight | What it measures |
|--------|--------|-----------------|
| Rating score | 40% | Average star rating from senders (1–5) |
| Completion rate | 30% | Ratio of completed deliveries vs cancelled/failed |
| On-time rate | 20% | % of deliveries completed within 125% of agreed time |
| Volume bonus | 10% | Experience proxy — capped at 500 deliveries |

---

### On-Time Calculation (Raw SQL)

Because this requires a time interval calculation, it uses raw SQL:

```sql
SELECT COUNT(*) as on_time_count
FROM deliveries
WHERE courier_id = $1
  AND status = 'DELIVERED'
  AND EXTRACT(EPOCH FROM (delivered_at - delivery_started_at)) / 60
      <= agreed_delivery_time * 1.25
```

A delivery is "on time" if it was completed within **125% of the agreed time window**.
For example, if `agreedDeliveryTime = 40 min`, the threshold is 50 minutes.

---

### Score → Tier Labels

| Score Range | Tier |
|------------|------|
| 85 – 100 | **Premier** |
| 70 – 84 | **Trusted** |
| 50 – 69 | **Active** |
| 30 – 49 | **Learning** |
| 0 – 29 | **New** |

---

### When `recalculate()` Is Triggered

- After every delivery reaches `DELIVERED`
- After every cancellation where a courier was assigned
- After a new rating is submitted for a delivery

`recalculate(courierId)` runs asynchronously — it does not block the HTTP response.

---

### Ranked Couriers for Broadcasting

`efficiency.getRankedOnlineCouriers()`:

```typescript
const couriers = await prisma.courier.findMany({
  where: { user: { isActive: true }, isOnline: true,
           currentLat: { not: null }, currentLng: { not: null } },
  orderBy: { reliabilityScore: 'desc' }, // best couriers first
});
```

After fetching, the delivery service filters by Haversine distance
(`<= BROADCAST_RADIUS_KM`). The sorted order is preserved so top-tier
couriers receive the `job:available` WebSocket event first.

---

### Courier Score Endpoint

**`GET /couriers/me/score`** (COURIER only)

Returns:
```json
{
  "score": 82.4,
  "tier": "Trusted",
  "completionRate": 0.94,
  "cancelledCount": 3,
  "totalDeliveries": 51,
  "avgRating": 4.7,
  "onTimeRate": 0.88
}
```

---

## 8. Real-Time WebSocket System

### Server Setup

- Socket.IO server at path `/ws`
- Wired to the same `http.Server` instance as Express in `backend/src/index.ts`
- Class: `DeliveryGateway` in `backend/src/lib/socket.ts`
- Singleton exposed via `getGateway()` / `setGateway()`

---

### Authentication

Every WebSocket connection must provide a valid JWT in the handshake:

```javascript
// Client side
const socket = io('http://localhost:3001', {
  path: '/ws',
  auth: { token: accessToken }
});
```

On the server, the `connection` handler verifies the token:
```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.data.userId = payload.sub;
    socket.data.role   = payload.role;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
});
```

Unauthenticated connections are rejected immediately.

---

### Rooms

| Room | Members | Purpose |
|------|---------|---------|
| `courier:{userId}` | That courier only | Receive job notifications |
| `delivery:{id}` | Sender + courier + admin | All updates for one delivery |

---

### Client-Emitted Events

| Event | Payload | Effect |
|-------|---------|--------|
| `join:delivery` | `{ deliveryId }` | Join `delivery:{id}` room |
| `leave:delivery` | `{ deliveryId }` | Leave `delivery:{id}` room |
| `join:courier` | `{ userId }` | Join `courier:{userId}` room |
| `leave:courier` | `{ userId }` | Leave `courier:{userId}` room |
| `location:update` | `{ lat, lng }` | Relayed to delivery room |
| `status:update` | `{ status }` | Relayed to delivery room |

---

### Server-Emitted Events

| Event | Target Room | Trigger |
|-------|------------|---------|
| `job:available` | `courier:{userId}` | New nearby delivery broadcast |
| `job:cancelled` | `delivery:{id}` | Delivery cancelled |
| `courier:interested` | `delivery:{id}` | Job taken / agreement / payment held |
| `delivery:status` | `delivery:{id}` | Any status transition |
| `courier:location` | `delivery:{id}` | GPS update from courier |
| `message:new` | `delivery:{id}` | New chat message posted |
| `courier:approval` | `courier:{userId}` | Admin approved/rejected onboarding |
| `courier:suspended` | `courier:{userId}` | Admin suspended the courier |

---

### GPS Relay Flow

When a courier calls `PUT /couriers/me/location` (HTTP):

```
1. Saves CourierLocation row { lat, lng, accuracy, heading, speed, timestamp }
2. Updates courier.currentLat, courier.currentLng
3. Queries: find delivery WHERE courierId = me AND status IN
   [PICKUP_EN_ROUTE, ARRIVED_PICKUP, PICKED_UP, IN_TRANSIT, ARRIVED_DROPOFF]
4. If found: getGateway().emitToDelivery(deliveryId, 'delivery:status', {
     type: 'LOCATION_UPDATE',
     lat, lng, heading, speed
   })
```

This means the sender's tracking map updates in real time without polling.

---

### `job:available` Payload Example

```json
{
  "type": "job:available",
  "delivery": {
    "id": "clx9...",
    "pickup": { "address": "KG 7 Ave", "lat": -1.9494, "lng": 30.0605 },
    "dropoff": { "address": "KN 3 Rd",  "lat": -1.9864, "lng": 30.0897 },
    "quotedPriceRwf": 2500,
    "distanceKm": 3.2
  },
  "courierScore": 82.4
}
```

---

## 9. Chat System

Chat is **per-delivery** — a private direct message thread between the sender and the
assigned courier. Admins can also read all chats.

---

### Endpoints

**`GET /deliveries/:id/chat`** (SENDER, COURIER, or ADMIN)

- Returns full message history for the delivery
- Access control: sender of the delivery, assigned courier, or any admin
- Throws `403 Forbidden` if caller is not one of the above

**`POST /deliveries/:id/chat`** (SENDER or COURIER)

- Body: `{ body: "message text" }` (web client) OR `{ content: "message text" }` (mobile client)
- Both `body` and `content` fields are accepted — the service normalises to `body` for storage
- Creates a `ChatMessage` row: `{ deliveryId, senderId, body, createdAt }`
- Emits `message:new` to `delivery:{id}` WebSocket room:
  ```json
  { "type": "message:new", "message": { "id": "...", "body": "On my way!", "senderId": "..." } }
  ```
- Response includes both field names for cross-client compatibility:
  ```json
  { "id": "...", "body": "On my way!", "content": "On my way!", "senderId": "...", "createdAt": "..." }
  ```

---

### Conversations List

**`GET /chat/conversations`** (any authenticated user)

Returns all delivery threads the user is part of, with the last message previewed.
Role-aware:
- `SENDER` → threads for their deliveries
- `COURIER` → threads for their assigned deliveries
- `ADMIN` → all threads

---

### ChatMessage Table

```
chat_messages
  id           UUID PK
  delivery_id  FK → deliveries.id
  sender_id    FK → users.id
  body         TEXT
  created_at   TIMESTAMP
```

---

## 10. Recipient Tracking (Public — No Auth)

Every delivery gets a `recipientTrackingToken` on creation:
```typescript
const token = crypto.randomBytes(20).toString('hex'); // 40-char hex
```

This token is shared with the recipient (e.g. included in SMS or a link) and lets
them track the delivery without logging in.

---

### GET /track/:token

Public endpoint — no JWT required.

Returns:
- Full delivery details (pickup/dropoff address, status, item description)
- Latest courier position (lat/lng) if status is between `PICKUP_EN_ROUTE` and `ARRIVED_DROPOFF`
- Delivery event history (full audit trail of status changes with timestamps)

If the token is invalid → `404 Not Found`.

---

### POST /track/:token/confirm-otp

Public endpoint — recipient can pre-confirm the dropoff OTP from the tracking page.

Body: `{ otp: "654321" }`

What happens:
1. Finds delivery by `recipientTrackingToken`
2. Checks `delivery.status === 'ARRIVED_DROPOFF'` → `400` if not arrived yet
3. `bcrypt.compare(body.otp, delivery.dropoffOtpHash)` → `400` if invalid
4. Sets `delivery.otpVerifiedAt = now()`
5. Returns `{ verified: true }`

When the courier later calls `POST /deliveries/:id/complete`:
```typescript
if (delivery.otpVerifiedAt) {
  // OTP already verified by recipient — skip the courier OTP entry
}
```

This flow allows the recipient to confirm delivery on their phone at the door,
so the courier doesn't need to wait for them to read out the OTP.

---

## 11. Admin System

All admin endpoints require `authenticate` + `requireRole('ADMIN')` middleware.
Admin users are pre-seeded in the database via `backend/prisma/seed.ts`.

---

### Dashboard Stats

**`GET /admin/dashboard`**

Returns aggregated platform stats in one call:

```json
{
  "activeDeliveries": 14,
  "onlineCouriers": 9,
  "completedToday": 47,
  "openDisputes": 2,
  "revenue": {
    "today": 142000,
    "week": 891000,
    "month": 3240000
  },
  "pendingVerifications": 5,
  "topCouriers": [ ... ],
  "recentEvents": [ ... ]
}
```

`revenue` is the sum of platform service fees collected (100 RWF × completed deliveries).

---

### Live Map

**`GET /admin/live-map`**

Returns:
- All active deliveries (any status between `BROADCAST` and `ARRIVED_DROPOFF`)
  with their current courier positions
- All online couriers with their current lat/lng

Used to render the admin map view showing real-time courier positions.

---

### Courier Management

**`GET /admin/couriers`**

Query params:
- `tier` — filter by tier (`Premier`, `Trusted`, etc.)
- `approved` — `true`/`false`
- `zone` — `Nyarugenge`, `Kicukiro`, or `Gasabo`

Results sorted by `reliabilityScore DESC`.

**`PUT /admin/couriers/:id/verify`**

Body: `{ approved: true/false, reason?: string }`

- Sets `Courier.isApprovedByAdmin`
- Emits `courier:approval` WebSocket event to `courier:{userId}`
- Mobile app receives this and transitions to CourierDashboard or rejection screen

**`PUT /admin/couriers/:id/suspend`**

- Sets `User.isActive = false` and `Courier.isActive = false`
- Emits `courier:suspended` WebSocket event to `courier:{userId}`
- Suspended couriers cannot accept jobs or log in

---

### User & Delivery Management

| Endpoint | Purpose |
|----------|---------|
| `GET /admin/users` | List users with `role` filter + `search` by name/email |
| `GET /admin/deliveries` | All deliveries with optional `status` filter |
| `GET /admin/disputes` | All deliveries with status `DISPUTED` |
| `PUT /admin/disputes/:id` | Resolve dispute: `{ status: 'DELIVERED'/'CANCELLED', resolution: string }` |

---

### Nearby Couriers

**`GET /couriers/nearby`** (ADMIN only)

Query: `{ lat, lng, radius? (km) }`

Returns all online couriers within `radius` km of the given point, sorted by distance.
Used to check coverage in a specific area.

---

## 12. File Storage (Cloudinary)

### Why Signed Uploads?

The backend never handles raw file bytes. Sending large files through Node.js is slow
and wastes server memory. Instead, the client uploads directly to Cloudinary using a
time-limited signed URL.

---

### Upload Flow

```
Client                     Backend                    Cloudinary
  │                            │                           │
  │ POST /storage/signed-upload│                           │
  │ { folder: "selfies" }      │                           │
  │ ─────────────────────────▶ │                           │
  │                            │ generate signature        │
  │                            │ compute publicUrl         │
  │ { uploadUrl, publicUrl }   │                           │
  │ ◀───────────────────────── │                           │
  │                            │                           │
  │ PUT uploadUrl (binary)                                 │
  │ ─────────────────────────────────────────────────────▶ │
  │                                                        │
  │ save publicUrl to onboarding step (PUT /couriers/onboarding/step)
  │ ─────────────────────────▶ │
```

---

### Backend: `POST /storage/signed-upload`

Auth required. Body: `{ folder: string }`

Allowed folders (validated by Zod enum):
```
selfies · id-photos · vehicle-photos · jacket-photos · license-photos
delivery-photos · avatars · courier-selfies · courier-documents
```

What the backend does:
1. Validates the folder name
2. Generates a timestamp + random suffix for a unique public ID:
   ```typescript
   const publicId = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}`;
   ```
3. Creates a signed upload URL using Cloudinary SDK:
   ```typescript
   const { signature, timestamp } = cloudinary.utils.sign_request(
     { public_id: publicId, timestamp }, apiSecret
   );
   ```
4. Constructs `publicUrl` deterministically (known before upload):
   ```
   https://res.cloudinary.com/{cloudName}/image/upload/{publicId}
   ```
5. Returns `{ uploadUrl, publicUrl }`

The client uploads to `uploadUrl`, then saves `publicUrl` to the relevant field
(e.g. `selfieUrl` in the onboarding step PUT).

---

## 13. State Machine & Event Log

### State Machine (`backend/src/services/stateMachine.ts`)

Every delivery status change goes through `stateMachine.transition(delivery, newStatus)`.
This enforces the valid transition map and prevents illegal jumps.

**Valid Transitions:**

```typescript
const TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  DRAFT:             ['BROADCAST'],
  BROADCAST:         ['COURIER_ASSIGNED', 'CANCELLED'],
  COURIER_ASSIGNED:  ['COURIER_CONFIRMED', 'BROADCAST', 'CANCELLED'],
  COURIER_CONFIRMED: ['PICKUP_EN_ROUTE', 'CANCELLED'],
  PICKUP_EN_ROUTE:   ['ARRIVED_PICKUP', 'CANCELLED'],
  ARRIVED_PICKUP:    ['PICKED_UP', 'CANCELLED'],
  PICKED_UP:         ['IN_TRANSIT', 'DISPUTED'],
  IN_TRANSIT:        ['ARRIVED_DROPOFF', 'DISPUTED'],
  ARRIVED_DROPOFF:   ['DELIVERED', 'FAILED', 'DISPUTED'],
  DELIVERED:         [],  // terminal
  CANCELLED:         [],  // terminal
  DISPUTED:          [],  // terminal
  FAILED:            [],  // terminal
};
```

If `newStatus` is not in the allowed list → `BadRequestError('Invalid status transition')`.

---

### What Happens on Every Transition

`stateMachine.transition()` executes a **Prisma transaction** that atomically:

1. Validates the new status is allowed
2. Updates the delivery `status` field
3. Sets the relevant timestamp field:
   ```typescript
   if (newStatus === 'CANCELLED')  data.cancelledAt  = new Date();
   if (newStatus === 'PICKED_UP')  data.pickedUpAt   = new Date();
   if (newStatus === 'DELIVERED')  data.deliveredAt  = new Date();
   // etc.
   ```
4. Creates a `DeliveryEvent` audit record:
   ```typescript
   prisma.deliveryEvent.create({
     data: {
       deliveryId,
       eventType: newStatus,         // e.g. 'COURIER_ASSIGNED'
       actorId:   req.user.id,       // who triggered the change
       metadata:  { previousStatus } // optional extra context
     }
   })
   ```

---

### DeliveryEvent Table (Full Audit Trail)

```
delivery_events
  id           UUID PK
  delivery_id  FK → deliveries.id
  event_type   VARCHAR  (matches DeliveryStatus values)
  actor_id     FK → users.id (nullable for system events)
  metadata     JSONB    (extra context)
  created_at   TIMESTAMP
```

Every delivery has a complete timeline of what happened, who did it, and when.
This is used by:
- `GET /admin/deliveries/:id` — show full event history
- `GET /track/:token` — show public event timeline to recipient
- Dispute resolution — admin can see exact sequence of events

---

### COURIER_ASSIGNED → back to BROADCAST

If a courier is assigned but something goes wrong (e.g. they go offline), the system
can revert to `BROADCAST`:

```typescript
COURIER_ASSIGNED → BROADCAST  // re-broadcast to find another courier
```

This transition clears `courierId = null` and `COURIER_ASSIGNED → BROADCAST`
so a new courier can take the job.

---

## 14. Error Handling

### Custom Error Classes (`backend/src/lib/errors.ts`)

All errors extend a base `ApiError` class:

```typescript
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

class BadRequestError   extends ApiError { constructor(m: string) { super(400, m); } }
class UnauthorizedError extends ApiError { constructor(m: string) { super(401, m); } }
class ForbiddenError    extends ApiError { constructor(m: string) { super(403, m); } }
class NotFoundError     extends ApiError { constructor(m: string) { super(404, m); } }
class ConflictError     extends ApiError { constructor(m: string) { super(409, m); } }
```

Services throw these directly:
```typescript
throw new NotFoundError('Delivery not found');
throw new ConflictError('Job is no longer available');
throw new BadRequestError('Cannot cancel after package has been picked up');
```

---

### Error Handler Middleware (`backend/src/middleware/errorHandler.ts`)

Registered as the last middleware in `index.ts`:

```typescript
app.use(errorHandler);
```

Logic:
1. Checks if `err instanceof ApiError`
2. If yes → returns `{ error: err.message }` with `err.statusCode`
3. If no (unexpected error) → logs the full error, returns:
   - Development: `{ error: err.message }` with `500`
   - Production: `{ error: 'Internal server error' }` with `500` (hides details)

---

### Zod Validation Middleware (`backend/src/middleware/validate.ts`)

Two helpers used in route files:

**`validateBody(schema)`** — validates `req.body`:
```typescript
router.post('/deliveries', authenticate, validateBody(createDeliverySchema), createDelivery);
```

**`validateQuery(schema)`** — validates `req.query`.

On validation failure → returns `400 Bad Request` with field-level errors:
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "agreedPriceRwf", "message": "Number must be greater than or equal to 200" },
    { "field": "pickupLat",      "message": "Required" }
  ]
}
```

---

### Error Response Format

All error responses follow the same shape:
```json
{ "error": "Human-readable error message" }
```

Or with field details for validation errors:
```json
{
  "error": "Validation failed",
  "details": [ { "field": "...", "message": "..." } ]
}
```

---

## 15. Environment Configuration

All environment variables live in `backend/.env`. A template is at `backend/.env.example`.

---

### Database

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled connection string (port **6543**) — used at runtime |
| `DIRECT_URL` | Neon direct connection string (port **5432**) — required for `prisma migrate` |

Prisma uses `DATABASE_URL` for all queries via the connection pool.
`DIRECT_URL` bypasses the pool for schema migrations (Prisma Migrate requires a direct connection).

---

### Auth & Tokens

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | (required) | HS256 signing key for access tokens |
| `JWT_EXPIRES_IN` | `1h` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRES_IN` | `30d` | Refresh token lifetime |

---

### File Storage

| Variable | Purpose |
|----------|---------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (used to sign upload URLs) |

---

### SMS (Stub — Not Yet Wired)

| Variable | Purpose |
|----------|---------|
| `AFRICASTALKING_USERNAME` | Africa's Talking account username |
| `AFRICASTALKING_API_KEY` | Africa's Talking API key |

These are present but the `notifications.ts` service only logs to console.
Replace the stub with real AT SDK calls when ready.

---

### Server

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | Express listen port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `NODE_ENV` | `development` | Controls error detail visibility in responses |

---

### Delivery Tuning

| Variable | Default | Purpose |
|----------|---------|---------|
| `BROADCAST_RADIUS_KM` | `5` | Haversine radius to search for couriers around pickup point |
| `BROADCAST_WINDOW_SECONDS` | `90` | How long a delivery stays in BROADCAST before auto-failing |
| `COURIER_CONFIRM_TIMEOUT_SECONDS` | `60` | Time window for courier to confirm after being assigned |
| `OTP_EXPIRY_MINUTES` | `15` | Auth OTP expiry (courier login) |
| `MIN_DELIVERY_PRICE_RWF` | `200` | Minimum allowed agreed price (validated in confirm-agreement) |
| `MAX_DELIVERY_TIME_MINUTES` | `120` | Maximum allowed agreed delivery time |
| `SERVICE_FEE_RWF` | `100` | Platform fee deducted from every courier payout |

---

### Full `.env.example` Reference

```env
# Database
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech:6543/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech:5432/neondb?sslmode=require"

# Auth
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="your-api-secret"

# SMS (stub)
AFRICASTALKING_USERNAME="sandbox"
AFRICASTALKING_API_KEY="your-at-key"

# Server
PORT=3001
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"

# Delivery tuning
BROADCAST_RADIUS_KM=5
BROADCAST_WINDOW_SECONDS=90
COURIER_CONFIRM_TIMEOUT_SECONDS=60
OTP_EXPIRY_MINUTES=15
MIN_DELIVERY_PRICE_RWF=200
MAX_DELIVERY_TIME_MINUTES=120
SERVICE_FEE_RWF=100
```

---

---

## Appendix A: Full API Route Reference

All routes mount under `/api/v1`. Health check at `GET /health`.

### Auth (`/auth`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/sender/signup` | — | Sender email registration |
| POST | `/auth/sender/signin` | — | Sender email login |
| POST | `/auth/admin/signin` | — | Admin email login |
| POST | `/auth/courier/signup` | — | Courier step-1 registration |
| POST | `/auth/courier/check-phone` | — | Check if phone exists |
| POST | `/auth/courier/request-otp` | — | Send OTP to courier phone |
| POST | `/auth/courier/verify-otp` | — | Verify OTP, return tokens |
| POST | `/auth/google` | — | Google auth (sender) |
| POST | `/auth/refresh` | — | Rotate refresh token |
| GET  | `/auth/me` | ✓ | Current user profile |
| POST | `/auth/logout` | ✓ | Clear session |
| PATCH | `/auth/role` | ✓ | Change user role |
| POST | `/auth/password/reset` | — | Password reset (stub) |
| POST | `/auth/password/update` | ✓ | Update password |
| GET  | `/auth/sessions` | ✓ | List active sessions |
| POST | `/auth/sessions/revoke-all` | ✓ | Sign out all devices |

### Couriers (`/couriers`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/couriers/register` | — | Alternative registration |
| POST | `/couriers/onboarding/start` | ✓ COURIER | Start onboarding session |
| PUT  | `/couriers/onboarding/step` | ✓ COURIER | Save step 2 or 3 |
| GET  | `/couriers/onboarding/status` | ✓ COURIER | Get onboarding progress |
| POST | `/couriers/onboarding/submit` | ✓ COURIER | Submit for approval |
| GET  | `/couriers/me` | ✓ COURIER | Courier profile |
| PUT  | `/couriers/me` | ✓ COURIER | Update courier profile |
| PUT  | `/couriers/me/online` | ✓ COURIER | Toggle online status |
| PUT  | `/couriers/me/location` | ✓ COURIER | Send GPS update |
| GET  | `/couriers/me/jobs` | ✓ COURIER | Job history |
| GET  | `/couriers/me/earnings` | ✓ COURIER | Earnings summary |
| GET  | `/couriers/me/score` | ✓ COURIER | Efficiency score + tier |
| GET  | `/couriers/dashboard` | ✓ COURIER | Dashboard stats |
| GET  | `/couriers/nearby` | ✓ ADMIN | Couriers near a point |

### Deliveries (`/deliveries`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/deliveries` | ✓ SENDER | Create delivery |
| GET  | `/deliveries` | ✓ | List (role-filtered) |
| GET  | `/deliveries/available` | ✓ COURIER | Available jobs |
| GET  | `/deliveries/:id` | ✓ | Delivery detail |
| POST | `/deliveries/:id/interest` | ✓ COURIER | Express interest |
| POST | `/deliveries/:id/take-job` | ✓ COURIER | Take the job |
| POST | `/deliveries/:id/confirm-agreement` | ✓ | Confirm price + time |
| POST | `/deliveries/:id/pay` | ✓ SENDER | Pay (escrow hold) |
| POST | `/deliveries/:id/start-delivery` | ✓ COURIER | Start + pickup OTP |
| POST | `/deliveries/:id/arrived-pickup` | ✓ COURIER | Verify pickup OTP |
| POST | `/deliveries/:id/picked-up` | ✓ COURIER | Package picked up |
| POST | `/deliveries/:id/in-transit` | ✓ COURIER | In transit |
| POST | `/deliveries/:id/arrived` | ✓ COURIER | Arrived + dropoff OTP |
| POST | `/deliveries/:id/complete` | ✓ COURIER | Complete + verify OTP |
| POST | `/deliveries/:id/rate` | ✓ | Rate delivery |
| PUT  | `/deliveries/:id/cancel` | ✓ SENDER | Cancel |
| GET  | `/deliveries/:id/chat` | ✓ | Read chat |
| POST | `/deliveries/:id/chat` | ✓ | Send message |

### Admin, Wallet, Other

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/admin/dashboard` | ✓ ADMIN | Platform stats |
| GET | `/admin/live-map` | ✓ ADMIN | Active deliveries + online couriers |
| GET | `/admin/couriers` | ✓ ADMIN | Courier list with filters |
| PUT | `/admin/couriers/:id/verify` | ✓ ADMIN | Approve / reject courier |
| PUT | `/admin/couriers/:id/suspend` | ✓ ADMIN | Suspend courier |
| GET | `/admin/users` | ✓ ADMIN | User list |
| GET | `/admin/deliveries` | ✓ ADMIN | All deliveries |
| GET | `/admin/disputes` | ✓ ADMIN | Open disputes |
| PUT | `/admin/disputes/:id` | ✓ ADMIN | Resolve dispute |
| GET | `/wallet` | ✓ | Get wallet + balance |
| POST | `/wallet/topup` | ✓ | Add funds |
| POST | `/wallet/withdraw` | ✓ | Withdraw funds (MoMo stub) |
| GET | `/sender/dashboard` | ✓ SENDER | Sender dashboard stats |
| GET | `/track/:token` | — | Public delivery tracking |
| POST | `/track/:token/confirm-otp` | — | Recipient pre-confirms OTP |
| POST | `/storage/signed-upload` | ✓ | Get Cloudinary signed upload URL |
| PUT  | `/users/me` | ✓ | Update user profile |
| POST | `/users/me/photo` | ✓ | Update avatar |
| GET  | `/chat/conversations` | ✓ | All delivery chat threads |
| GET  | `/geocode/bounds` | — | Kigali bounds + district centres |
| POST | `/geocode/resolve` | ✓ | Address → lat/lng |
| POST | `/geocode/reverse` | ✓ | lat/lng → address + district |

---

## Appendix B: Remaining Integrations (Stubs)

| Integration | Status | Where |
|------------|--------|-------|
| SMS (Africa's Talking) | Stub — console only | `services/notifications.ts` |
| WhatsApp OTP | Stub | `services/notifications.ts` |
| Email OTP | Stub | `services/notifications.ts` |
| Courier OTP delivery | Stub | `auth.ts` service |
| Payment gateway (card/MoMo in) | Stub | `services/deliveries.ts` `submitPayment()` |
| MTN MoMo disbursement (withdrawals) | Stub | `services/wallet.ts` |

All stubs log the relevant data to console so development and testing work without
real API keys.

---

*Document generated from live codebase. Last updated: 2025.*
