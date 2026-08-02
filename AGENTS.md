# DELIVERY — Agent Notes

## Project Structure
- `/backend` — NestJS 10 + Supabase (PostgREST via supabase-js)
- `/frontend` — Next.js 16 App Router + Supabase JS + Zustand

## Database
- **No ORM** — raw SQL tables accessed via `DbService` (wraps `supabase-js` service_role client)
- Tables use **snake_case** column names; `DbService` auto-converts to camelCase in API responses
- Full migration in `/supabase-migration.sql` (run in Supabase SQL Editor)

## Supabase Project
- URL: https://bkxkrrinthmknteoqnkr.supabase.co
- Anon Key: In .env files (placeholder — replace with real key)
- DB: postgresql://postgres:Dieu12done%231@db.bkxkrrinthmknteoqnkr.supabase.co:5432/postgres

## Build Commands

### Backend
```
cd backend
npm install
npm run build              # NestJS build
npm run start:dev          # Start dev server on :3001
```

### Frontend
```
cd frontend
npm install
npm run build              # Production build
npm run dev                # Dev server on :3000
```

## DbService Usage
- `DbService` is global — inject via constructor: `constructor(private readonly db: DbService)`
- Methods: `findOne(table, column, value)`, `findMany(table, opts?)`, `create(table, data)`, `update(table, column, value, data)`, `delete(table, column, value)`, `findOneWithJoin(table, column, value, joins)`
- All take camelCase column names and data keys; converts to snake_case for PostgREST
- For complex joins/queries, use `this.db.getClient()` to access the raw Supabase client directly
- Query params (eq, neq, order, limit) must use **snake_case** when using raw client

## Supabase Setup Required (one-time)
1. Go to Supabase Dashboard > Authentication > Providers
   - Enable Phone Auth (turn off "Confirm phone")
   - Enable Email/Password
   - Enable Google OAuth (configure client ID/secret)
2. Go to Authentication > Settings > Auth Hooks
   - Add JWT customization hook: `public.delivery_jwt_claims()`
3. Run `supabase-migration.sql` in SQL Editor
4. Add admin user manually in Supabase Auth dashboard

## Auth Flows
### Entry Points
- **/auth/signin** — Unified signin page with role toggle ("Send a package" / "Deliver")
  - Sender mode: Google OAuth + email/password
  - Courier mode: phone entry (+250 prefix), checks existence first
- **/auth/signup** — Unified signup page with role toggle
  - Sender mode: Google OAuth + email/password
  - Courier mode: toggle → immediately redirects to `/auth/courier/onboarding` (no OTP phone entry page)
- **/admin/auth** — Admin portal (email+password, role check)
- **/auth** → redirects to /auth/signin

### Courier Flow (Simplified)
1. `/auth/signup` → toggle to "Deliver" → redirects to `/auth/courier/onboarding`
2. Onboarding is a **single page** with 3 client-side sections (personal info → credentials → documents)
   - **Section 1** — Personal info: full name, email, phone (editable), password, confirm password
   - **Section 2** — Credentials: national ID, vehicle plate, jacket serial, emergency contact
   - **Section 3** — Documents: selfie, ID, vehicle front/back, jacket + terms + submit
3. Submit → pending state on same page → `/auth/courier/pending`
4. Admin approves → courier can sign in at `/auth/signin` → `/courier/dashboard`

## Auth Endpoints (Backend)
- POST /auth/sender/signup       — email+password signup
- POST /auth/sender/signin       — email+password signin
- POST /auth/courier/check-phone — check if phone exists before OTP
- POST /auth/courier/request-otp — send OTP (with phone existence check)
- POST /auth/courier/verify-otp  — verify OTP + create local user
- POST /auth/admin/signin        — admin-only signin
- POST /auth/google              — Google OAuth token exchange
- POST /auth/refresh             — refresh JWT
- GET  /auth/me                  — get profile (protected)
- PATCH /auth/role               — change role (admin only)

## Courier Onboarding Endpoints
- POST /couriers/onboarding/start
- PUT  /couriers/onboarding/step
- GET  /couriers/onboarding/status
- POST /couriers/onboarding/submit
- POST /couriers/register

## Delivery Flow (Full Lifecycle)

### Statuses
```
DRAFT → BROADCAST → COURIER_ASSIGNED → COURIER_CONFIRMED → PICKUP_EN_ROUTE → ARRIVED_PICKUP → PICKED_UP → IN_TRANSIT → ARRIVED_DROPOFF → DELIVERED
```
Terminal: `CANCELLED`, `DISPUTED`, `FAILED`

### Payment Statuses (on `deliveries.payment_status`)
```
PENDING → HELD → RELEASED
```
- `PENDING` — default, no payment yet
- `HELD` — sender has paid, funds held in escrow
- `RELEASED` — OTP verified, funds released to courier wallet

### Complete Flow (Step-by-Step)

#### 1. Sender creates delivery
- **Endpoint**: `POST /deliveries` (protected, SENDER only)
- Status: `DRAFT`
- `create()` immediately calls `broadcastToNearbyCouriers()`
- Fields: pickup/dropoff addresses + lat/lng, contact info, item details, optional `pickupEmail`/`dropoffEmail` for recipient

#### 2. Auto-broadcast to nearby couriers
- Transitions to `BROADCAST`
- Queries all online, admin-approved couriers with non-null `current_lat`/`current_lng`
- Filters by **Haversine distance <= 300m** from pickup location
- Emits `job:available` via WebSocket to each courier's room
- Sends SMS notification (via `NotificationsService` stub — logs only)

#### 3. Courier takes the job
- **Endpoint**: `POST /deliveries/:id/take-job` (protected, COURIER only)
- Concurrency-safe: checks `status === 'BROADCAST'` AND `courier_id IS NULL`
- Assigns courier, transitions to `COURIER_ASSIGNED`
- Notifies sender via `notifyCourierAccepted()`
- Emits `courier:interested` with `type: 'JOB_TAKEN'` via WebSocket
- Other couriers see the job as unavailable (status no longer `BROADCAST`)

#### 4. Negotiation & Communication
- Call/chat buttons visible to both parties from `COURIER_ASSIGNED` onward
- Call: shows sender/courier phone number
- Chat: redirects to `/chat/:id` (DM tied to delivery context)
- Both negotiate price and terms

#### 5. Confirm agreement
- **Endpoint**: `POST /deliveries/:id/confirm-agreement` (protected, SENDER or COURIER)
- Transition: `COURIER_ASSIGNED` → `COURIER_CONFIRMED`
- Sets `agreed_price_rwf`, `final_price_rwf`, `agreed_delivery_time` (optional minutes)
- Floating "Confirm" button at bottom of delivery detail page
- Both parties can click it once price is agreed
- Emits `courier:interested` with `type: 'AGREEMENT_CONFIRMED'`

#### 6. Sender payment (escrow)
- **Endpoint**: `POST /deliveries/:id/pay` (protected, SENDER only)
- Sender sees payment card with agreed amount (read-only) + optional delivery time input
- On pay:
  - Sets `payment_status = 'HELD'`
  - Records `payment_held_at`
  - Debits sender wallet (placeholder — payment gateway TBD)
  - Notifies courier that payment is secured
- Courier sees "Payment secured!" message
- **Start Delivery is only visible after payment is HELD**

#### 7. Courier starts delivery
- **Endpoint**: `POST /deliveries/:id/start-delivery` (protected, COURIER only)
- Guard: requires `payment_status === 'HELD'`
- Transition: `COURIER_CONFIRMED` → `PICKUP_EN_ROUTE`
- Generates **pickup OTP** (6-digit, bcrypt-hashed)
- Sets `delivery_started_at` timestamp
- Notifies sender "courier is on the way"

#### 8. Courier arrives at pickup (handover)
- **Endpoint**: `POST /deliveries/:id/arrived-pickup` (protected, COURIER only)
- Transition: `PICKUP_EN_ROUTE` → `ARRIVED_PICKUP`
- Courier enters pickup OTP to confirm handover from sender
- Sets `courier_arrived_at`

#### 9. Courier picks up package
- Transition: `ARRIVED_PICKUP` → `PICKED_UP`

#### 10. Courier in transit
- Transition: `PICKED_UP` → `IN_TRANSIT`

#### 11. Courier arrives at drop-off
- **Endpoint**: `POST /deliveries/:id/arrived` (protected, COURIER only)
- Transition: `IN_TRANSIT` → `ARRIVED_DROPOFF`
- Generates **dropoff OTP** (6-digit, bcrypt-hashed)
- Sets `dropoff_otp_sent_at`
- Sends OTP to recipient via all configured channels:
  - SMS (via `NotificationsService.sendOtp()`)
  - WhatsApp
  - Email (if `dropoff_email` provided)

#### 12. Complete delivery (OTP verification)
- **Endpoint**: `POST /deliveries/:id/complete` (protected, COURIER only)
- Validates dropoff OTP (bcrypt compare)
- On success:
  - Transition: `ARRIVED_DROPOFF` → `DELIVERED`
  - Sets `payment_status = 'RELEASED'`, `payment_released_at`, `otp_verified_at`
  - Credits courier wallet: `agreed_price_rwf - 100 RWF` (service fee)
  - Updates courier stats: `total_deliveries +1`, `total_earnings += final_price`
  - Notifies sender delivery is complete

#### 13. Rating
- **Endpoint**: `POST /deliveries/:id/rate` (protected, SENDER or COURIER)
- Sender rates courier 1–5 stars + optional comment
- One rating per delivery

### Wallet Logic

#### Tables
- `wallets` — per-user balance (`user_id` unique)
- `wallet_transactions` — ledger (type: `credit`, `debit`, `fee`, `withdrawal`, `refund`)
- `withdrawal_requests` — MoMo payout requests

#### Service Fee
- Fixed **100 RWF** per delivery
- Deducted from courier payout at completion
- Formula: `courier_payout = agreed_price_rwf - 100 RWF`

#### Escrow Flow
1. Sender pays → `payment_status = 'HELD'` (funds held)
2. OTP verified → `payment_status = 'RELEASED'`
3. `WalletService.creditCourier()` credits `agreed_price_rwf - 100 RWF`
4. Two transactions: CREDIT (net amount) + FEE (100 RWF)

#### Withdrawal (MoMo)
- **Endpoint**: `POST /wallet/withdraw`
- Courier withdraws balance to MoMo
- `withdrawal_requests` table tracks payout status
- Actual MoMo disbursement requires provider integration

### Broadcasting Logic
- After DRAFT creation, `broadcastToNearbyCouriers()` is called:
  1. Transitions status to `BROADCAST`
  2. Queries all online, approved couriers with non-null `current_lat`/`current_lng`
  3. Filters by Haversine distance <= 300m from pickup location
  4. Emits `job:available` via WebSocket to each courier's room
  5. Sends SMS notification

### OTP Logic
- **Pickup OTP**: Generated on `startDelivery()`, entered by courier on `arrivedAtPickup()`
- **Dropoff OTP**: Generated on `arrived()` endpoint OR `completeDelivery()` if not already generated
- Both bcrypt-hashed in DB (never stored in plaintext)
- Sent to recipient via SMS + WhatsApp + Email (`NotificationsService.sendOtp()`)
- 6-digit numeric codes

### WebSocket Events (DeliveryGateway)
| Event | Direction | Purpose |
|-------|-----------|---------|
| `job:available` | Server → Courier room | New job available nearby |
| `job:cancelled` | Server → Delivery room | Job cancelled |
| `courier:interested` | Server → Delivery room | Job taken / payment held / agreement confirmed |
| `delivery:status` | Server → Delivery room | Status update |
| `courier:location` | Server → Delivery room | Live courier location |
| `message:new` | Server → Delivery room | New chat message |
| `location:update` | Client → Server | Courier sends GPS |
| `status:update` | Client → Server | Status change |
| `join:delivery` / `leave:delivery` | Client → Server | Room management |
| `join:courier` / `leave:courier` | Client → Server | Room management |

### Delivery Endpoints (Full List)
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/deliveries` | POST | SENDER | Create delivery |
| `/deliveries` | GET | Any | List deliveries (role-filtered) |
| `/deliveries/available` | GET | COURIER | Get nearby available jobs |
| `/deliveries/:id` | GET | Any | Get delivery detail |
| `/deliveries/:id/interest` | POST | COURIER | Express interest |
| `/deliveries/:id/take-job` | POST | COURIER | Take the job |
| `/deliveries/:id/confirm-agreement` | POST | SENDER/COURIER | Confirm price |
| `/deliveries/:id/pay` | POST | SENDER | Pay (set escrow) |
| `/deliveries/:id/start-delivery` | POST | COURIER | Start delivery |
| `/deliveries/:id/arrived-pickup` | POST | COURIER | Arrive at pickup + enter OTP |
| `/deliveries/:id/arrived` | POST | COURIER | Arrived at dropoff (sends OTP) |
| `/deliveries/:id/complete` | POST | COURIER | Complete delivery (enter OTP) |
| `/deliveries/:id/rate` | POST | SENDER/COURIER | Rate delivery |
| `/deliveries/:id/cancel` | PUT | SENDER | Cancel delivery |

### Email Fields
- `pickup_email` and `dropoff_email` (optional) on deliveries table
- Used for OTP delivery alongside SMS and WhatsApp
- Passed in `CreateDeliveryDto` as `pickupEmail`/`dropoffEmail`

## Important Notes
- JWT token stored in localStorage as `access_token`
- All protected API calls use `Authorization: Bearer <token>` header
- Roles: SENDER (email+password/Google), COURIER (phone OTP), ADMIN (internal)
- RLS is second layer — primary auth is via NestJS SupabaseAuthGuard
- Custom JWT claim `delivery_role` injected via Supabase Auth Hook
- All DB queries go through `DbService` (PostgREST via service_role key) — no Prisma
- `DbService` is in `backend/src/db/db.service.ts`; types are in `backend/src/types.ts`
- `DeliveryGateway` is in `backend/src/common/delivery.gateway.ts`, provided by `CommonModule` (global)
- `WalletService` is in `backend/src/wallet/wallet.service.ts` (100 RWF flat service fee)
- `NotificationsService` is in `backend/src/notifications/notifications.service.ts` (stub — logs to console)
- `DeliveryStateMachineService` is in `backend/src/deliveries/delivery-state-machine.service.ts`

## Remaining External Dependencies
- **Payment gateway**: Payment flow wired as escrow (debits sender wallet). Replace placeholder with real gateway (e.g., Stripe, MTN MoMo API) in `submitPayment()`
- **SMS provider**: `NotificationsService` is a stub. Integrate Twilio / Africa's Talking for real SMS
- **WhatsApp provider**: Stub. Integrate Twilio WhatsApp / WATI / 360dialog
- **Email provider**: Stub. Integrate Resend / SendGrid for email OTP delivery
- **MoMo disbursement**: Withdrawal request structure exists. Integrate MTN MoMo API for actual payout
- **Map tiles**: MapLibre GL integration placeholder in courier job detail page; OpenRouteService for routing
