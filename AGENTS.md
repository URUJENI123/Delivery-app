# DELIVERY APP — Agent Notes (Full Project Reference)

> Motorcycle delivery platform serving 3 districts in Kigali, Rwanda:
> **Nyarugenge · Kicukiro · Gasabo**
>
> See `BACKEND-LOGIC.md` for deep-dive technical documentation on every service.

---

## Project Structure

```
Delivery-app/
  backend/          Express + TypeScript API (Prisma, Socket.IO, JWT, Zod)
  frontend/         Next.js 16 App Router web app (DEV MOCK mode)
  mobile/           React Native (Expo ~54) — couriers + senders
  AGENTS.md         This file
  BACKEND-LOGIC.md  Full backend logic documentation
  Delivery-App.postman_collection.json  — 110 requests, 14 folders
```

---

## Build Commands

### Backend
```bash
cd backend
npm install
npm run dev                  # ts-node-dev on :3001
npm run build                # tsc → dist/
npm run start                # node dist/index.js
npm run prisma:generate
npm run prisma:migrate       # prisma migrate deploy
npm run prisma:push          # prisma db push
npm run prisma:seed          # create admin + platform wallet user
npm run prisma:studio
```

### Frontend
```bash
cd frontend
npm install
npm run dev                  # Next dev on :3000
npm run build
npm run lint
```

### Mobile
```bash
cd mobile
npm install
npm run start                # expo start
npm run android | ios | web
```

---

## Database

- **Neon PostgreSQL** — serverless, database `delivery`, schema `public`
- **Prisma ORM** — schema at `backend/prisma/schema.prisma`
- `DATABASE_URL` — pooled connection (port **6543**), used at runtime
- `DIRECT_URL` — direct connection (port **5432**), required for `prisma migrate`
- Run `npm run prisma:seed` after first deploy — creates the admin user and platform wallet user, prints `PLATFORM_WALLET_USER_ID` to paste into `.env`

---

## Backend Architecture

**Entry point**: `backend/src/index.ts`
- Express + `http.createServer` + Socket.IO (`path: '/ws'`)
- All routes under `/api/v1` · Rate limit: 100 req/min · Health: `GET /health`

**Layering**:
```
routes/ (Zod validation) → controllers/ (req/res) → services/ (logic) → repositories/ (Prisma)
```

**Key libs**:
| File | Purpose |
|------|---------|
| `src/lib/jwt.ts` | Sign/verify JWT. Payload: `{ sub, role }` |
| `src/lib/socket.ts` | `DeliveryGateway` — all Socket.IO event emission |
| `src/lib/cloudinary.ts` | Signed upload URL generation + `publicUrl` |
| `src/lib/geocoding.ts` | Nominatim geocoding, Kigali bounds, district detection |
| `src/lib/mtn-momo.ts` | MTN MoMo Rwanda — Collections + Disbursements |
| `src/lib/airtel-money.ts` | Airtel Money Rwanda — Collections + Disbursements |
| `src/lib/errors.ts` | `BadRequestError(400)` `UnauthorizedError(401)` `ForbiddenError(403)` `NotFoundError(404)` `ConflictError(409)` |

**Key services**:
| File | Purpose |
|------|---------|
| `services/auth.ts` | Signup/signin/OTP/refresh/sessions |
| `services/deliveries.ts` | Full delivery lifecycle + state transitions |
| `services/couriers.ts` | Onboarding, profile, GPS, jobs, efficiency |
| `services/wallet.ts` | Escrow, payouts, top-up, withdraw, platform fee |
| `services/payments.ts` | Unified MTN/Airtel provider abstraction |
| `services/efficiency.ts` | 0–100 courier scoring, tier labels, ranking |
| `services/chat.ts` | Per-delivery DMs + conversation list |
| `services/admin.ts` | Dashboard, live map, courier approval |
| `services/notifications.ts` | SMS/WhatsApp/Email — **stub, console only** |
| `services/stateMachine.ts` | Enforces valid delivery status transitions |

---

## Environment Variables (backend/.env)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled connection (port 6543) |
| `DIRECT_URL` | Neon direct connection (port 5432) |
| `JWT_SECRET` | HS256 signing key |
| `JWT_EXPIRES_IN` | `1h` |
| `REFRESH_TOKEN_EXPIRES_IN` | `30d` |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | File uploads |
| `AFRICASTALKING_USERNAME/API_KEY` | SMS — stub, not wired |
| `PORT` | `3001` |
| `FRONTEND_URL` | CORS origin (`http://localhost:3000`) |
| `NODE_ENV` | `development` / `production` |
| `BROADCAST_RADIUS_KM` | `5` — Haversine search radius around pickup |
| `BROADCAST_WINDOW_SECONDS` | `90` |
| `COURIER_CONFIRM_TIMEOUT_SECONDS` | `60` |
| `OTP_EXPIRY_MINUTES` | `15` |
| `MIN_DELIVERY_PRICE_RWF` | `200` — minimum agreed price |
| `MAX_DELIVERY_TIME_MINUTES` | `120` — max agreed delivery time |
| `SERVICE_FEE_RWF` | `100` — platform fee per delivery |
| `PLATFORM_WALLET_USER_ID` | UUID of the internal platform revenue user |
| `MTN_MOMO_BASE_URL` | Sandbox or production MoMo URL |
| `MTN_MOMO_TARGET_ENV` | `sandbox` or `mtnrwanda` |
| `MTN_MOMO_CURRENCY` | `RWF` |
| `MTN_COLLECTION_API_USER_ID/API_KEY/SUBSCRIPTION_KEY` | MTN Collections |
| `MTN_DISBURSEMENT_API_USER_ID/API_KEY/SUBSCRIPTION_KEY` | MTN Disbursements |
| `AIRTEL_BASE_URL` | `https://openapi.airtel.africa` |
| `AIRTEL_CLIENT_ID/CLIENT_SECRET` | Airtel auth credentials |
| `AIRTEL_MERCHANT_PIN` | Required for Airtel B2C payouts |

---

## Roles & Auth

| Role | Signup method | Signin method |
|------|--------------|--------------|
| `SENDER` | `POST /auth/sender/signup` (email+password) | `POST /auth/sender/signin` |
| `COURIER` | `POST /auth/courier/signup` (email+password+phone) | `POST /auth/courier/signin` |
| `ADMIN` | DB seed (`npm run prisma:seed`) | `POST /auth/admin/signin` |

**Auth middleware**: reads `Authorization: Bearer <token>` OR `access_token` httpOnly cookie.
**Token pair**: Access token (1h JWT) + Refresh token (30d, stored in DB, rotated on use).
Both returned in JSON body AND set as httpOnly cookies on every auth response.

**Courier OTP login** (alternative to email/password):
1. `POST /auth/courier/check-phone` → `{ exists }`
2. `POST /auth/courier/request-otp` → OTP logged to console (SMS stub)
3. `POST /auth/courier/verify-otp` → returns tokens + `needsOnboarding` / `pendingApproval` / `approved`

---

## Courier Onboarding (3-Step Mobile Flow)

```
Step 1: POST /auth/courier/signup          → creates User + seeds OnboardingSession
Step 2: PUT  /couriers/onboarding/step     → { nationalIdNumber, motorcyclePlate, momoNumber, jacketSerialNumber, operatingZone, step:2 }
Step 3: PUT  /couriers/onboarding/step     → { selfieUrl, idPhotoUrl, licensePhotoUrl, step:3 }
Submit: POST /couriers/onboarding/submit   → { agreeToTerms: true }
```

- `operatingZone` **must be** `"Nyarugenge"` | `"Kicukiro"` | `"Gasabo"` (Zod enum validated)
- Document URLs come from Cloudinary (see Storage section)
- Submit → `isApprovedByAdmin: false` → courier waits on PendingApproval screen
- Admin approves → `PUT /admin/couriers/:id/verify` → emits `courier:approval` WebSocket event
- Mobile receives event and navigates to CourierDashboard

---

## Geocoding & Map API

All coordinates come from the user's map interaction — **never hardcoded**.

```
GET  /geocode/bounds          → Kigali bounding box + 3 district centres (public, no auth)
POST /geocode/resolve         → address string → { lat, lng, district }  (422 if outside Kigali)
POST /geocode/reverse         → { lat, lng } pin drop → { address, district }  (422 if outside Kigali)
```

**Kigali bounding box**: lat `-2.08 to -1.82`, lng `29.92 to 30.20`

**District centres** (used for nearest-district detection):
- Nyarugenge: `-1.9494, 30.0605`
- Gasabo: `-1.9217, 30.0930`
- Kicukiro: `-1.9864, 30.0897`

Delivery creation (`POST /deliveries`) validates both `pickupLat/Lng` and `dropoffLat/Lng` are within the bounding box. Returns `400` if outside Kigali.

---

## Delivery Lifecycle

### Status Flow
```
DRAFT → BROADCAST → COURIER_ASSIGNED → COURIER_CONFIRMED → PICKUP_EN_ROUTE
  → ARRIVED_PICKUP → PICKED_UP → IN_TRANSIT → ARRIVED_DROPOFF → DELIVERED
Terminal: CANCELLED · DISPUTED · FAILED
```

### Payment Status (parallel track)
```
PENDING → HELD → RELEASED (+ REFUNDED on cancellation)
```

### Constraints
- `quotedPriceRwf` / `agreedPriceRwf` **minimum 200 RWF**
- `agreedDeliveryTime` **maximum 120 minutes**
- Both validated via Zod at route level AND in the service layer

### Step-by-Step

| # | Endpoint | Who | Key action |
|---|----------|-----|-----------|
| 1 | `POST /deliveries` | SENDER | Creates delivery, validates coords, fires broadcast |
| 2 | (internal) | system | `broadcastToNearbyCouriers()` — ranked couriers sorted by efficiency score |
| 3 | `POST /deliveries/:id/take-job` | COURIER | Atomic claim — returns 409 if already taken |
| 4 | `POST /deliveries/:id/confirm-agreement` | SENDER/COURIER | Sets `agreedPriceRwf` |
| 5 | `POST /deliveries/:id/pay` | SENDER | `{ phoneNumber }` — USSD push to sender's MTN/Airtel phone; they approve the pop-up → webhook sets `paymentStatus=HELD` |
| 6 | `POST /deliveries/:id/start-delivery` | COURIER | Guards on `paymentStatus=HELD`, generates pickup OTP |
| 7 | `POST /deliveries/:id/arrived-pickup` | COURIER | `{ otp }` — bcrypt verify pickup OTP |
| 8 | `POST /deliveries/:id/picked-up` | COURIER | Sets `pickedUpAt` |
| 9 | `POST /deliveries/:id/in-transit` | COURIER | Courier sends GPS every ~15s via `PUT /couriers/me/location` |
| 10 | `POST /deliveries/:id/arrived` | COURIER | Generates dropoff OTP, sends to recipient |
| 11 | `POST /deliveries/:id/complete` | COURIER | `{ otp }` — releases escrow, credits courier, recalculates score |
| 12 | `POST /deliveries/:id/rate` | SENDER/COURIER | `{ stars 1–5, comment? }` — recalculates courier efficiency |
| 13 | `PUT /deliveries/:id/cancel` | SENDER | Allowed up to `ARRIVED_PICKUP`. Does **not** auto-refund — sender must request a refund |
| 14 | `POST /deliveries/:id/refund-request` | SENDER | `{ reason, phoneNumber }` — creates refund request, notifies all admins |
| 15 | `PUT /admin/refunds/:id/approve` | ADMIN | Approves → real MoMo disbursement to sender's phone |
| 16 | `PUT /admin/refunds/:id/reject` | ADMIN | Rejects with a reason |

**Refund rule**: cancellation never auto-refunds. Money stays `HELD`; the sender submits a refund request, every admin is notified (WebSocket `refund:requested` + console log), and **only an admin can approve** the refund at any point after. On approval the full `agreedPriceRwf` is disbursed to the sender's MoMo phone — zero fee charged.

---

## Wallet & Payment System

### Money Flow
```
1. Sender pays for delivery — direct from their phone
   POST /deliveries/:id/pay { phoneNumber }
   → MTN/Airtel USSD pop-up pushed to sender's phone
   → sender approves the pop-up → MTN/Airtel calls POST /wallet/webhook
   → delivery paymentStatus = HELD  (money is now held / escrowed)

2. Delivery completed
   POST /deliveries/:id/complete
   → courier wallet += (agreedPriceRwf - 100 RWF)
   → platform wallet += 100 RWF  (internal ledger, no MoMo call)
   → paymentStatus=RELEASED

3. Cancellation after payment — admin-approved refund
   PUT /deliveries/:id/cancel
   → money STAYS HELD (no auto-refund)
   → POST /deliveries/:id/refund-request { reason, phoneNumber }
   → every admin notified (WebSocket refund:requested)
   → admin approves → real MoMo disbursement to sender's phone → paymentStatus=REFUNDED

4. Courier withdraws
   POST /wallet/withdraw { amount, accountNumber, provider }
   → MTN/Airtel disbursement to courier phone
   → if fails → wallet auto-refunded

5. Admin withdraws platform revenue
   POST /admin/revenue/withdraw { amount, phoneNumber, provider }
   → MTN/Airtel disbursement to admin phone
   → if fails → platform wallet auto-refunded
```

### Refund Management (admin-controlled)

Every refund goes through an admin review — there is **no automatic refund path**.

| Endpoint | Who | Purpose |
|----------|-----|---------|
| `POST /deliveries/:id/refund-request` | SENDER | `{ reason, phoneNumber, provider? }` — creates request (status `PENDING_REVIEW`), notifies all admins |
| `GET /admin/refunds` | ADMIN | List requests, filter by `?status=` |
| `GET /admin/refunds/:id` | ADMIN | Single request detail |
| `PUT /admin/refunds/:id/approve` | ADMIN | Approves → MoMo disbursement to sender's phone → `DISBURSED`, delivery `paymentStatus=REFUNDED` |
| `PUT /admin/refunds/:id/reject` | ADMIN | `{ adminNote }` (required) → `REJECTED` |

**Eligibility**: only deliveries with `paymentStatus=HELD` (escrow, pre-completion) or `RELEASED` (post-completion, e.g. dispute) — one active request per delivery.

**Events**: `refund:requested` → admins room · `refund:approved` / `refund:rejected` → sender's user room.

### Provider Detection (auto)
- Phone starts with `078x / 079x` → **MTN MoMo**
- Phone starts with `072x / 073x` → **Airtel Money**

### Platform Wallet
- Special internal user (`platform@delivery.app`) whose wallet accumulates all 100 RWF fees
- Created by `npm run prisma:seed` — prints the UUID to set as `PLATFORM_WALLET_USER_ID`
- No MoMo number on the wallet itself — fees are pure DB ledger entries
- Admin views balance: `GET /admin/revenue`
- Admin withdraws: `POST /admin/revenue/withdraw`

### Wallet Endpoints
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /wallet` | ✓ | Balance + transaction history |
| `POST /wallet/topup` | ✓ | MoMo USSD push (add `phoneNumber` for real charge) |
| `POST /wallet/withdraw` | ✓ | MoMo disbursement to phone |
| `GET /wallet/payment-status/:id` | ✓ | Poll provider for pending payment |
| `POST /wallet/webhook` | — | MTN/Airtel callback (no auth — IP whitelist in prod) |

---

## Courier Efficiency Scoring

Every courier has a `reliabilityScore` (0–100) that:
1. Determines job broadcast order — highest scored couriers get `job:available` first
2. Sorts the admin courier list (best couriers at top)
3. Is visible to the courier on `GET /couriers/me/score`

**Formula:**
```
score = (avgRating / 5.0)                                × 40
      + (delivered / (delivered + cancelled + failed))   × 30
      + (on-time deliveries / delivered)                 × 20  [125% grace window]
      + (min(totalDeliveries, 500) / 500)                × 10
```

**Tiers**: New (0–29) · Learning (30–49) · Active (50–69) · Trusted (70–84) · Premier (85–100)

**Triggered automatically** after: delivery completed, delivery cancelled (if courier was assigned), new rating submitted.

---

## WebSocket Events (path `/ws`)

All connections authenticated via JWT in `socket.handshake.auth.token`.

**Rooms**: `courier:{userId}` (job notifications) · `delivery:{id}` (all delivery updates)

| Event | Direction | Purpose |
|-------|-----------|---------|
| `job:available` | Server → `courier:{userId}` | New nearby job (sorted by score) |
| `job:cancelled` | Server → `delivery:{id}` | Delivery cancelled |
| `courier:interested` | Server → `delivery:{id}` | JOB_TAKEN / AGREEMENT_CONFIRMED / PAYMENT_HELD |
| `delivery:status` | Server → `delivery:{id}` | Status change + LOCATION_UPDATE |
| `message:new` | Server → `delivery:{id}` | New chat message |
| `courier:approval` | Server → `courier:{userId}` | Admin approved/rejected onboarding |
| `courier:suspended` | Server → `courier:{userId}` | Admin suspended courier |
| `refund:requested` | Server → `admins` | Sender requested a refund |
| `refund:approved` / `refund:rejected` | Server → `user:{userId}` | Admin decision on a refund |
| `location:update` | Client → Server | Courier GPS (relayed to delivery room) |
| `join:delivery` / `leave:delivery` | Client → Server | Room join/leave |
| `join:courier` / `leave:courier` | Client → Server | Room join/leave |
| `join:user` / `leave:user` | Client → Server | Per-user room (senders receive refund events here) |

GPS relay: `PUT /couriers/me/location` → saves to `CourierLocation` table → emits `LOCATION_UPDATE` to active delivery room.

---

## Chat System

- Per-delivery DMs between sender and courier (admins can read)
- `GET /deliveries/:id/chat` — message history
- `POST /deliveries/:id/chat` — send message. Accepts `body` (web) OR `content` (mobile) field
- Response includes both `body` and `content` for cross-client compatibility
- `GET /chat/conversations` — all threads for the user (role-aware)

---

## File Storage (Cloudinary)

Client **never** sends files to our server. Flow:
1. `POST /storage/signed-upload { folder }` → returns `{ uploadUrl, publicUrl }`
2. Client uploads binary directly to Cloudinary at `uploadUrl`
3. Client saves `publicUrl` to onboarding step or user profile

**Allowed folders**: `selfies` · `id-photos` · `vehicle-photos` · `jacket-photos` · `license-photos` · `delivery-photos` · `avatars` · `courier-selfies` · `courier-documents`

---

## Recipient Tracking (Public — No Auth)

Every delivery has a `recipientTrackingToken` (40-char hex).

- `GET /track/:token` — full delivery status + courier position + event history
- `POST /track/:token/confirm-otp { otp }` — recipient pre-confirms dropoff OTP

When recipient pre-confirms, the courier's `POST /deliveries/:id/complete` call skips the OTP check.

---

## Admin Endpoints

All under `/admin`, all require ADMIN role.

| Endpoint | Purpose |
|----------|---------|
| `GET /admin/dashboard` | Platform stats (deliveries, couriers, revenue) |
| `GET /admin/live-map` | All active deliveries + online couriers with GPS |
| `GET /admin/revenue` | Platform fee wallet balance + total earned |
| `POST /admin/revenue/withdraw` | Withdraw platform fees to admin's MoMo phone |
| `GET /admin/refunds` | List refund requests (filter by `?status=`) |
| `PUT /admin/refunds/:id/approve` | Approve + disburse a refund to the sender's MoMo |
| `PUT /admin/refunds/:id/reject` | Reject a refund with a reason |
| `GET /admin/couriers` | List couriers (sorted by score DESC), filterable |
| `PUT /admin/couriers/:id/verify` | Approve/reject onboarding → emits `courier:approval` |
| `PUT /admin/couriers/:id/suspend` | Suspend courier → emits `courier:suspended` |
| `GET /admin/users` | List users with role + search filter |
| `GET /admin/deliveries` | All deliveries with optional status filter |
| `GET /admin/disputes` | Open disputes |
| `PUT /admin/disputes/:id` | Resolve dispute |

---

## Full API Route Reference (all under `/api/v1`)

### Auth
`POST /auth/sender/signup` · `/sender/signin` · `/admin/signin` · `/courier/signup` · `/courier/signin` · `/courier/check-phone` · `/courier/request-otp` · `/courier/verify-otp` · `/google` · `/refresh`
`GET /auth/me` · `/sessions`
`POST /auth/logout` · `/password/reset` · `/password/update` · `/sessions/revoke-all`
`PATCH /auth/role`

### Couriers
`POST /couriers/register` · `/onboarding/start` · `/onboarding/submit`
`PUT /couriers/onboarding/step` · `/me` · `/me/online` · `/me/location`
`GET /couriers/onboarding/status` · `/me` · `/me/jobs` · `/me/earnings` · `/me/score` · `/dashboard` · `/nearby`

### Deliveries
`POST /deliveries` · `/:id/interest` · `/:id/take-job` · `/:id/confirm-agreement` · `/:id/pay` · `/:id/start-delivery` · `/:id/arrived-pickup` · `/:id/picked-up` · `/:id/in-transit` · `/:id/arrived` · `/:id/complete` · `/:id/rate` · `/:id/chat` · `/:id/refund-request`
`GET /deliveries` · `/:id` · `/available` · `/:id/chat`
`PUT /deliveries/:id/cancel`

### Other
`GET /wallet` · `GET /wallet/payment-status/:id`
`POST /wallet/topup` · `/withdraw` · `/webhook`
`GET /sender/dashboard`
`GET /track/:token` · `POST /track/:token/confirm-otp`
`POST /storage/signed-upload`
`PUT /users/me` · `POST /users/me/photo`
`GET /chat/conversations`
`GET /geocode/bounds` · `POST /geocode/resolve` · `POST /geocode/reverse`
`GET /admin/dashboard` · `/live-map` · `/revenue` · `/refunds` · `/couriers` · `/users` · `/deliveries` · `/disputes`
`POST /admin/revenue/withdraw`
`PUT /admin/couriers/:id/verify` · `/couriers/:id/suspend` · `/refunds/:id/approve` · `/refunds/:id/reject` · `/disputes/:id`
`GET /health`

---

## Frontend (Web)

- **Framework**: Next.js 16 App Router · Tailwind · Zustand · Socket.IO
- **Status**: DEV MOCK mode (`NEXT_PUBLIC_DEV_MOCK=true`)
- All API calls mocked in `frontend/lib/api.ts`
- To enable real backend: set `NEXT_PUBLIC_DEV_MOCK=false`, `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

### Key Pages
- `/auth/sender/signin` · `/auth/sender/signup` → sender auth
- `/auth/courier` → OTP phone entry → `/auth/courier/verify`
- `/auth/courier/onboarding` → 3-step form → `/auth/courier/pending`
- `/auth/admin` → admin signin
- `/sender/dashboard` → sender home
- `/courier/dashboard` → courier home
- `/admin/dashboard` → admin panel

---

## Mobile (React Native / Expo)

- **Framework**: Expo ~54 · React Navigation · react-native-maps · Socket.IO client
- **Infrastructure ready** (created, not yet wired into screens):
  - `src/lib/api.ts` — typed fetch client with token refresh
  - `src/lib/storage.ts` — AsyncStorage wrapper for tokens
  - `src/lib/socket.ts` — Socket.IO singleton
  - `src/context/AuthContext.tsx` — auth state provider

### Current Status
- All screens are **UI-only** (no real API calls yet)
- Infrastructure files exist but are not connected to screens
- When ready to integrate: wrap `App.tsx` in `AuthProvider`, replace navigation hardcodes with API calls

### Key Screens
- `SplashScreen` → `LoginScreen` (sender) or courier OTP flow
- `CourierOnboardingStep1/2/3` → `PendingApproval`
- `SenderDashboard` · `CourierDashboard`
- `DeliveryInfoScreen` · `PickupOTP` · `LiveTracking`
- `ChatScreen` · `Wallet` · `PersonalDetails`

---

## OTP Logic

| Type | Generated | Delivered | Verified |
|------|-----------|-----------|---------|
| Auth OTP (courier login) | `request-otp` | Console log (SMS stub) | `verify-otp` bcrypt compare |
| Pickup OTP | `start-delivery` | Returned to courier in response | `arrived-pickup { otp }` |
| Dropoff OTP | `arrived` | SMS/WhatsApp/Email to recipient (stub) | `complete { otp }` or pre-confirmed via `/track/:token/confirm-otp` |

All OTPs: 6-digit numeric, bcrypt-hashed before DB storage, single-use.

---

## What's Stubbed (Not Yet Production-Ready)

| Feature | Status | File |
|---------|--------|------|
| SMS (Africa's Talking) | Console log only | `services/notifications.ts` |
| WhatsApp | Console log only | `services/notifications.ts` |
| Email OTP | Console log only | `services/notifications.ts` |
| Mobile screen integration | UI only | `mobile/src/screens/` |
| Frontend real API calls | Mock mode | `frontend/lib/api.ts` |

## What's Live

| Feature | Status |
|---------|--------|
| MTN MoMo Collections | ✅ Real USSD push |
| MTN MoMo Disbursements | ✅ Real payout |
| Airtel Money Collections | ✅ Real USSD push |
| Airtel Money Disbursements | ✅ Real payout |
| Payment webhook handling | ✅ Auto-credits/refunds (admin-approved) |
| Platform fee wallet | ✅ Internal ledger |
| Admin revenue withdrawal | ✅ Real MoMo disbursement |
| Cloudinary uploads | ✅ Signed URL flow |
| Geocoding (Nominatim) | ✅ Address ↔ coordinates |
| Kigali bounds validation | ✅ 400 if outside service area |
| Courier efficiency scoring | ✅ Auto-calculated, affects broadcast order |
| Delivery state machine | ✅ All transitions enforced |
| Real-time WebSocket | ✅ GPS relay, job dispatch, chat |
| Postman collection | ✅ 110 requests, 14 folders |
