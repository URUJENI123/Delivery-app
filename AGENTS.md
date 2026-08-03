# DELIVERY — Agent Notes

## Project Structure
- `/backend` — Express + TypeScript API. Prisma ORM on Neon PostgreSQL. Zod validation, Socket.IO, JWT auth
- `/frontend` — Next.js 16 App Router web app (Zustand + Tailwind + Socket.IO). **Currently runs in DEV MOCK mode**
- `/mobile` — React Native (Expo ~54) app for couriers/senders
- See also `APP-LOGIC.md` and `MOBILE_APP_DOCUMENTATION.md` at repo root

## Database
- **Neon PostgreSQL** — database `neondb`, schema `public`
- **Prisma ORM** — schema in `backend/prisma/schema.prisma`; client singleton in `backend/src/lib/prisma.ts`
- Connection strings live in `backend/.env`:
  - `DATABASE_URL` — pooled connection (port **6543**), used at runtime
  - `DIRECT_URL` — direct connection (port **5432**), required for `prisma migrate`
- Migrations: `npx prisma migrate dev` (dev) / `npm run prisma:migrate` (deploy)
- **Troubleshooting P1001**: server is usually reachable — the error most often means wrong Neon credentials. Test with `psql`/`pg`; "password authentication failed" → update `DATABASE_URL`/`DIRECT_URL` from the Neon dashboard (Connection Details)

## Build Commands

### Backend
```
cd backend
npm install
npm run dev                # ts-node-dev on :3001
npm run build              # tsc → dist/
npm run start              # node dist/index.js
npm run prisma:generate
npm run prisma:migrate     # prisma migrate deploy
npm run prisma:push        # prisma db push
npm run prisma:studio
```

### Frontend
```
cd frontend
npm install
npm run dev                # Next dev on :3000
npm run build
npm run lint
```

### Mobile
```
cd mobile
npm install
npm run start              # expo start
npm run android | ios | web
```

## Backend Architecture
- **Entry**: `backend/src/index.ts` — Express + `http.createServer` + Socket.IO (`path: '/ws'`). All routes mounted under **`/api/v1`**. Rate limit 100 req/min. Health check at `GET /health`
- **Layering**: `routes/` (zod schemas) → `controllers/` (request/response) → `services/` (business logic) → `repositories/` (Prisma queries)
- **Validation**: `validateBody` / `validateQuery` from `backend/src/middleware/validate.ts`
- **Auth middleware**: `authenticate` (Bearer JWT or `access_token` cookie) + `requireRole(...roles)` in `backend/src/middleware/auth.ts`
- **Errors**: custom `ApiError` classes in `backend/src/lib/errors.ts`; handler in `backend/src/middleware/errorHandler.ts`
- **JWT**: `backend/src/lib/jwt.ts` (jsonwebtoken). Payload `{ sub, role }`, 1h expiry (`JWT_EXPIRES_IN`)
- **Refresh tokens**: stored in `refresh_tokens` table, 30-day TTL, rotated on every use
- **Auth responses**: signin/signup/verify return `{ accessToken, refreshToken, user }` **and** set httpOnly cookies `access_token` (1h) + `refresh_token` (30d)
- **Socket.IO**: `backend/src/lib/socket.ts` — `DeliveryGateway` class, JWT verified on connect via handshake auth
- **Uploads**: Cloudinary signed uploads via `backend/src/lib/cloudinary.ts`; `POST /storage/signed-upload` returns `{ uploadUrl, publicUrl }`
- **Notifications**: `backend/src/services/notifications.ts` — **stub**, logs to console only

## Environment (backend/.env)
| Var | Purpose |
|-----|---------|
| `DATABASE_URL` / `DIRECT_URL` | Neon connection strings |
| `JWT_SECRET` / `JWT_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | Token config |
| `CLOUDINARY_*` | File uploads (cloud name, key, secret) |
| `AFRICASTALKING_*` | SMS placeholder (not yet wired) |
| `PORT` / `FRONTEND_URL` / `NODE_ENV` | Server config |
| `OTP_EXPIRY_MINUTES`, `BROADCAST_RADIUS_KM`, `BROADCAST_WINDOW_SECONDS`, `COURIER_CONFIRM_TIMEOUT_SECONDS` | Delivery tuning |

## Frontend Mock Mode
- `frontend/.env` has `NEXT_PUBLIC_DEV_MOCK=true` — **all API calls are mocked** by `frontend/lib/api.ts`; `frontend/lib/supabase.ts` is a placeholder; `frontend/proxy.ts` skips all auth middleware
- No backend/Supabase needed to run the web app locally
- To restore real integration: set `NEXT_PUBLIC_DEV_MOCK=false` and swap `lib/api.ts` for a real fetch client (API base: `NEXT_PUBLIC_API_URL`, default `http://localhost:3001/api/v1`)
- Note: onboarding page calls `/storage/presigned-url` while backend route is `/storage/signed-upload` — frontend currently ignores it (mock mode)

## Auth Flows
### Entry Points
- **/auth/sender/signin** — sender email/password (redirects by role)
- **/auth/sender/signup** — sender email/password signup
- **/auth/courier** — courier phone entry → `POST /auth/courier/request-otp` → `/auth/courier/verify?phone=...&mode=signup|signin`
- **/auth/courier/verify** — OTP entry → `POST /auth/courier/verify-otp`. `mode=signup` → onboarding; otherwise onboarding (if incomplete) / `/auth/courier/pending` (not approved) / `/courier/dashboard`
- **/auth/courier/onboarding** — single page (personal info → credentials → documents) + terms + submit → `/auth/courier/pending`
- **/auth/courier/pending** — awaiting admin approval
- **/auth/signin** and **/admin/auth** — admin signin (`POST /auth/admin/signin`, role-checked)
- **/auth** → redirects to `/auth/signin`

### Courier Flow (Simplified)
1. `/auth/courier` → enter phone → request OTP
2. `/auth/courier/verify` → enter 6-digit OTP
3. `/auth/courier/onboarding` (if new / not submitted) → submit → `/auth/courier/pending`
4. Admin approves (`PUT /admin/couriers/:id/verify`) → courier signs in → `/courier/dashboard`

## Auth Endpoints (Backend)
- POST /auth/sender/signup       — email + password (≥6 chars) + optional fullName
- POST /auth/sender/signin       — email + password
- POST /auth/admin/signin        — email + password, ADMIN role required
- POST /auth/courier/check-phone — `{ phone }` → `{ exists }`
- POST /auth/courier/request-otp — `{ phone }`; auto-creates a COURIER user if new; logs OTP to console (stub)
- POST /auth/courier/verify-otp  — `{ phone, token }`; returns `needsOnboarding`
- POST /auth/google              — `{ email, fullName?, googleId?, avatarUrl? }` (upserts SENDER)
- POST /auth/refresh             — rotates refresh token (`refresh_token` body or cookie)
- GET  /auth/me                  — profile (protected)
- POST /auth/logout              — clears cookies (protected)
- PATCH /auth/role               — `{ userId, role }` (protected)
- POST /auth/password/reset      — stub (logs only)
- POST /auth/password/update     — `{ newPassword }` (protected)
- GET  /auth/sessions            — active sessions (protected)
- POST /auth/sessions/revoke-all — revoke all (protected)

## Courier Onboarding Endpoints
- POST /couriers/register
- POST /couriers/onboarding/start   — `{ fullName?, phone? }`
- PUT  /couriers/onboarding/step    — partial save
- GET  /couriers/onboarding/status
- POST /couriers/onboarding/submit  — `{ agreeToTerms: true }`
- GET  /couriers/me                 — courier profile (COURIER)
- PUT  /couriers/me                 — update profile (COURIER)
- PUT  /couriers/me/online          — `{ isOnline, lat?, lng? }` toggle availability
- PUT  /couriers/me/location        — `{ lat, lng, accuracy?, heading?, speed? }` GPS update
- GET  /couriers/me/jobs            — courier's jobs (COURIER)
- GET  /couriers/me/earnings        — earnings (COURIER)
- GET  /couriers/dashboard          — dashboard stats (COURIER)
- GET  /couriers/nearby             — `{ lat, lng, radius? }` (ADMIN)

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

### Valid Transitions (enforced by `stateMachine.ts`)
`DRAFT: BROADCAST` · `BROADCAST: COURIER_ASSIGNED, CANCELLED` · `COURIER_ASSIGNED: COURIER_CONFIRMED, BROADCAST, CANCELLED` · `COURIER_CONFIRMED: PICKUP_EN_ROUTE, CANCELLED` · `PICKUP_EN_ROUTE: ARRIVED_PICKUP, CANCELLED` · `ARRIVED_PICKUP: PICKED_UP, CANCELLED` · `PICKED_UP: IN_TRANSIT, DISPUTED` · `IN_TRANSIT: ARRIVED_DROPOFF, DISPUTED` · `ARRIVED_DROPOFF: DELIVERED, FAILED, DISPUTED`

### Complete Flow (Step-by-Step)

#### 1. Sender creates delivery
- **Endpoint**: `POST /api/v1/deliveries` (SENDER only)
- Status: `DRAFT`; `create()` immediately fires `broadcastToNearbyCouriers()` (async, non-blocking)
- Fields: pickup/dropoff address + lat/lng, contact info, item details, optional `pickupEmail`/`dropoffEmail`

#### 2. Auto-broadcast to nearby couriers
- Transitions to `BROADCAST`
- Queries online couriers with non-null `current_lat`/`current_lng`
- Filters by **Haversine distance <= 300 m** (`BROADCAST_RADIUS_KM = 0.3`) from pickup
- Emits `job:available` to each courier's room (`courier:{userId}`); sends SMS (stub)

#### 3. Courier takes the job
- **Endpoint**: `POST /deliveries/:id/take-job` (COURIER only)
- Concurrency-safe: `updateMany({ id, status: BROADCAST, courierId: null })` — count 0 → "Job is no longer available"
- Assigns courier, transitions to `COURIER_ASSIGNED`, notifies sender
- Emits `courier:interested` `{ type: 'JOB_TAKEN' }`

#### 4. Negotiation & Communication
- Call/chat visible from `COURIER_ASSIGNED` onward
- Chat: `GET/POST /deliveries/:id/chat` (per-delivery DM); full conversation list: `GET /chat/conversations`

#### 5. Confirm agreement
- **Endpoint**: `POST /deliveries/:id/confirm-agreement` (SENDER or COURIER)
- Transition: `COURIER_ASSIGNED` → `COURIER_CONFIRMED`
- Sets `agreed_price_rwf`, `final_price_rwf`, `agreed_delivery_time`
- Emits `courier:interested` `{ type: 'AGREEMENT_CONFIRMED' }`

#### 6. Sender payment (escrow)
- **Endpoint**: `POST /deliveries/:id/pay` (SENDER only)
- Sets `payment_status = 'HELD'`, `payment_held_at`; debits sender wallet (placeholder — gateway TBD)
- Emits `courier:interested` `{ type: 'PAYMENT_HELD' }`
- **Start Delivery only allowed when `payment_status === 'HELD'`**

#### 7. Courier starts delivery
- **Endpoint**: `POST /deliveries/:id/start-delivery` (COURIER only)
- Guard: `payment_status === 'HELD'`
- Transition: `COURIER_CONFIRMED` → `PICKUP_EN_ROUTE`
- Generates **pickup OTP** (6-digit, bcrypt-hashed), sets `delivery_started_at`, notifies sender

#### 8. Courier arrives at pickup (handover)
- **Endpoint**: `POST /deliveries/:id/arrived-pickup` (COURIER only, body `{ otp }`)
- Validates pickup OTP (bcrypt compare) → `ARRIVED_PICKUP`, sets `courier_arrived_at`

#### 9. Courier picks up package
- **Endpoint**: `POST /deliveries/:id/picked-up` → `PICKED_UP`

#### 10. Courier in transit
- **Endpoint**: `POST /deliveries/:id/in-transit` → `IN_TRANSIT`

#### 11. Courier arrives at drop-off
- **Endpoint**: `POST /deliveries/:id/arrived` (COURIER only)
- Transition: `IN_TRANSIT` → `ARRIVED_DROPOFF`
- Generates **dropoff OTP** (6-digit, bcrypt-hashed), sets `dropoff_otp_sent_at`, sends via `notifications.sendOtp()` (SMS + WhatsApp + Email if `dropoff_email`)
- Returns `{ updated, dropoffOtp }`

#### 12. Complete delivery (OTP verification)
- **Endpoint**: `POST /deliveries/:id/complete` (COURIER only, body `{ otp }`)
- Validates dropoff OTP; skips check if `otp_verified_at` already set
- On success: → `DELIVERED`; `payment_status = 'RELEASED'`, `payment_released_at`, `otp_verified_at`
- Credits courier wallet `agreed_price_rwf - 100 RWF`; updates courier stats (deliveries +1, earnings)
- Notifies sender

#### 13. Rating
- **Endpoint**: `POST /deliveries/:id/rate` (SENDER or COURIER, `{ stars 1–5, comment? }`)
- One rating per delivery (upsert); recomputes courier `avgRating`

#### 14. Recipient tracking (public, no auth)
- `GET /track/:token` and `POST /track/:token/confirm-otp` — uses `recipient_tracking_token`

## Wallet Logic

#### Tables
- `wallets` — per-user balance (`user_id` unique)
- `wallet_transactions` — ledger (type: `credit`, `debit`, `fee`, `withdrawal`, `refund`)
- `withdrawal_requests` — MoMo payout requests

#### Service Fee
- Fixed **100 RWF** per delivery (`SERVICE_FEE_RWF` in `backend/src/services/wallet.ts`)
- Formula: `courier_payout = agreed_price_rwf - 100 RWF`

#### Escrow Flow
1. Sender pays → `payment_status = 'HELD'` (funds held); `debitSender()` debits wallet
2. OTP verified → `payment_status = 'RELEASED'`
3. `creditCourier()` credits `agreed_price_rwf - 100 RWF`
4. Two transactions: CREDIT (net amount) + FEE (100 RWF)

#### Withdrawal (MoMo)
- **Endpoint**: `POST /wallet/withdraw` — validates balance, decrements wallet, creates `withdrawal_requests` row (status `pending`)
- Top-up: `POST /wallet/topup` (`{ amount, method? }`) — wallet credit (placeholder)
- Actual MoMo disbursement requires provider integration

## Broadcasting Logic
- After DRAFT creation, `broadcastToNearbyCouriers()` runs async:
  1. Transitions to `BROADCAST`
  2. Queries online couriers with non-null `current_lat`/`current_lng`
  3. Filters by Haversine distance <= 300 m from pickup
  4. Emits `job:available` to `courier:{userId}` rooms
  5. Sends SMS (stub)

## OTP Logic
- **Courier auth OTP**: `request-otp` stores `otp:{hash}` in `refresh_tokens` table (10-min expiry); `verify-otp` bcrypt-compares
- **Pickup OTP**: generated on `startDelivery()`, entered on `arrived-pickup`
- **Dropoff OTP**: generated on `arrived()`; entered on `complete` (skipped if already verified)
- All delivery OTPs bcrypt-hashed in DB, 6-digit numeric, sent via `notifications.sendOtp()` (SMS + WhatsApp + Email)

## WebSocket Events (DeliveryGateway, path `/ws`)
| Event | Direction | Purpose |
|-------|-----------|---------|
| `job:available` | Server → `courier:{userId}` | New job available nearby |
| `job:cancelled` | Server → `delivery:{id}` | Job cancelled |
| `courier:interested` | Server → `delivery:{id}` | Interest / job taken / payment held / agreement confirmed |
| `delivery:status` | Server → `delivery:{id}` | Status update |
| `courier:location` | Server → `delivery:{id}` | Live courier location |
| `message:new` | Server → `delivery:{id}` | New chat message |
| `location:update` | Client → Server | Courier sends GPS (relayed) |
| `status:update` | Client → Server | Status change (relayed) |
| `join:delivery` / `leave:delivery` | Client → Server | Room management |
| `join:courier` / `leave:courier` | Client → Server | Room management |

## API Endpoints (Full List, all under `/api/v1`)

### Deliveries
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/deliveries` | POST | SENDER | Create delivery |
| `/deliveries` | GET | Any auth | List deliveries (role-filtered) |
| `/deliveries/available` | GET | COURIER | Available jobs |
| `/deliveries/:id` | GET | Any auth | Delivery detail |
| `/deliveries/:id/interest` | POST | COURIER | Express interest (price + ETA) |
| `/deliveries/:id/take-job` | POST | COURIER | Take the job |
| `/deliveries/:id/confirm-agreement` | POST | SENDER/COURIER | Confirm price |
| `/deliveries/:id/pay` | POST | SENDER | Pay (set escrow HELD) |
| `/deliveries/:id/start-delivery` | POST | COURIER | Start (generates pickup OTP) |
| `/deliveries/:id/arrived-pickup` | POST | COURIER | Arrive at pickup + pickup OTP |
| `/deliveries/:id/picked-up` | POST | COURIER | Package picked up |
| `/deliveries/:id/in-transit` | POST | COURIER | In transit |
| `/deliveries/:id/arrived` | POST | COURIER | Arrived at dropoff (dropoff OTP) |
| `/deliveries/:id/complete` | POST | COURIER | Complete delivery (dropoff OTP) |
| `/deliveries/:id/rate` | POST | SENDER/COURIER | Rate delivery |
| `/deliveries/:id/cancel` | PUT | SENDER | Cancel delivery |
| `/deliveries/:id/chat` | GET/POST | Any auth | Delivery DM |

### Other groups
| Group | Endpoints |
|-------|-----------|
| `/admin` | GET dashboard, GET live-map, GET disputes, GET couriers, PUT couriers/:id/verify, PUT couriers/:id/suspend, GET users, GET deliveries, PUT disputes/:id — all ADMIN |
| `/wallet` | GET /, POST /topup, POST /withdraw — any auth |
| `/sender` | GET /dashboard — auth |
| `/track` | GET /:token, POST /:token/confirm-otp — public (token) |
| `/storage` | POST /signed-upload — auth |
| `/users` | PUT /me, POST /me/photo — auth |
| `/chat` | GET /conversations — auth |

## Important Notes
- All routes mounted under `/api/v1`; health at `GET /health`
- Token: backend returns `accessToken`/`refreshToken` in body + sets httpOnly cookies; frontend also stores `access_token` in localStorage
- Auth middleware reads Bearer header OR `access_token` cookie
- Roles: SENDER (email/password or Google), COURIER (phone OTP), ADMIN
- DB access only via Prisma (`backend/src/lib/prisma.ts`) — repositories in `backend/src/repositories/`
- Types: Prisma schema is source of truth; `backend/src/types.ts` re-exports enums for runtime use
- `DeliveryGateway` is in `backend/src/lib/socket.ts`, wired in `index.ts` via `setGateway()`
- Wallet fee logic in `backend/src/services/wallet.ts`
- Notifications stub in `backend/src/services/notifications.ts` (logs to console)
- State machine in `backend/src/services/stateMachine.ts`
- Delivery logic in `backend/src/services/deliveries.ts`
- Frontend currently in DEV MOCK mode (`NEXT_PUBLIC_DEV_MOCK=true`)

## Remaining External Dependencies
- **Payment gateway**: escrow flow wired to wallet debits. Replace placeholder with real gateway in `submitPayment()` (`backend/src/services/deliveries.ts`)
- **SMS provider**: `notifications.ts` is a stub (console logs). `AFRICASTALKING_*` env vars present but unused
- **WhatsApp provider**: Stub. Integrate Twilio WhatsApp / WATI / 360dialog
- **Email provider**: Stub. Integrate Resend / SendGrid for email OTP delivery
- **Courier OTP delivery**: `courierRequestOtp()` logs OTP to console only — no real SMS yet
- **MoMo disbursement**: `withdrawal_requests` structure exists; integrate MTN MoMo API for actual payout
- **Maps**: MapLibre GL + OpenRouteService in frontend; `react-native-maps` in mobile
