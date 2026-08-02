# DELIVERY — Agent Notes

## Project Structure
- `/src` — NestJS 11 backend (source root)
- `/frontend` — Next.js 16 App Router + Zustand
- `/prisma` — Prisma schema (`schema.prisma`) + migrations

## Database
- **ORM: Prisma 5** with **Neon PostgreSQL** (`@prisma/client`)
- `PrismaService` (`src/db/prisma.service.ts`) extends `PrismaClient` — injected globally via `DbModule`
- **All DB access uses Prisma** — no raw SQL, no Supabase JS, no snake_case mapping needed
- Column names are **camelCase** in Prisma schema; Prisma handles DB-level snake_case automatically
- `db.service.ts` re-exports `PrismaService` as `DbService` for backwards compat — prefer `PrismaService` directly

## Neon Setup
1. Create a Neon project at https://neon.tech
2. Copy the **connection string** (pooler URL) into `backend/.env` as `DATABASE_URL`
3. Copy the **direct connection string** into `backend/.env` as `DIRECT_URL`
4. Run: `npx prisma migrate dev --name init` (creates all tables)
5. Or for prod: `npx prisma migrate deploy`

## Build Commands

### Backend
```
cd <project root>
npm install
npx prisma generate          # regenerate Prisma client after schema changes
npx prisma migrate dev       # apply migrations (dev)
npm run build                # NestJS TypeScript build
npm run dev                  # Dev server on :3001
```

### Frontend
```
cd frontend
npm install
npm run build
npm run dev                  # Dev server on :3000
```

## PrismaService Usage
- Import and inject `PrismaService` from `../db/prisma.service`
- Fully typed Prisma client — use `this.prisma.user.findUnique(...)`, `this.prisma.delivery.create(...)` etc.
- Use `this.prisma.$transaction([...])` for atomic multi-table operations
- `include` / `select` for joins — no PostgREST syntax needed

## Auth (JWT — no Supabase Auth)
- **Passwords** are bcrypt-hashed and stored in `users.password_hash`
- **JWTs** are issued by NestJS `JwtModule` — payload: `{ sub: userId, role }`
- `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts`) — verifies JWT, loads user from DB
- `SupabaseAuthGuard` re-exports `JwtAuthGuard` — all existing controllers work unchanged
- **Refresh tokens** stored in `refresh_tokens` table (rotated on each use)
- **OTP store**: in-memory `Map` (replace with Redis for multi-instance)
- Google OAuth: frontend gets Google `id_token`, POST to `/auth/google` — verified via `oauth2.googleapis.com/tokeninfo`
- Phone OTP: generated locally, sent via `NotificationsService.sendOtp()`

## Auth Flows (unchanged endpoints)
### Entry Points
- `/auth/signin` — Unified signin with role toggle
- `/auth/signup` — Unified signup with role toggle
- `/admin/auth` — Admin portal (email+password)

### Auth Endpoints (Backend)
- POST /auth/sender/signup       — email+password signup
- POST /auth/sender/signin       — email+password signin
- POST /auth/courier/check-phone — check phone existence
- POST /auth/courier/request-otp — send OTP via NotificationsService
- POST /auth/courier/verify-otp  — verify OTP + issue JWT
- POST /auth/admin/signin        — admin signin
- POST /auth/google              — Google id_token exchange → JWT
- POST /auth/refresh             — rotate refresh token
- GET  /auth/me                  — get profile (protected)
- PATCH /auth/role               — change role (ADMIN only)

## Courier Onboarding Endpoints (unchanged)
- POST /couriers/onboarding/start
- PUT  /couriers/onboarding/step
- GET  /couriers/onboarding/status
- POST /couriers/onboarding/submit
- POST /couriers/register

## Delivery Flow (Full Lifecycle) — unchanged
See delivery status transitions in `delivery-state-machine.service.ts`.

### Statuses
```
DRAFT → BROADCAST → COURIER_ASSIGNED → COURIER_CONFIRMED → PICKUP_EN_ROUTE → ARRIVED_PICKUP → PICKED_UP → IN_TRANSIT → ARRIVED_DROPOFF → DELIVERED
```
Terminal: `CANCELLED`, `DISPUTED`, `FAILED`

### Delivery Endpoints (Full List) — unchanged
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

## WebSocket (DeliveryGateway)
- Auth: JWT token via `handshake.auth.token` or Authorization header
- Verified via `JwtService.verify()` — no Supabase dependency
- Same events as before (job:available, delivery:status, courier:location, message:new, etc.)

## Wallet Logic (unchanged)
- `WalletService` uses Prisma `$transaction` for atomic balance updates
- 100 RWF service fee deducted from courier payout at delivery completion
- `withdrawal_requests` table for MoMo payouts (stub — needs MTN MoMo API)

## Key Files
- `src/db/prisma.service.ts` — PrismaService (global)
- `src/db/db.module.ts` — Global DbModule
- `src/auth/guards/jwt-auth.guard.ts` — JWT auth guard
- `src/auth/guards/supabase-auth.guard.ts` — re-exports JwtAuthGuard (compat shim)
- `src/common/delivery.gateway.ts` — WebSocket gateway (JWT auth)
- `src/deliveries/delivery-state-machine.service.ts` — Status transitions
- `src/wallet/wallet.service.ts` — Wallet & escrow logic
- `src/notifications/notifications.service.ts` — Stub (logs only; plug in Twilio/AT)
- `prisma/schema.prisma` — Full DB schema (13 tables + enums)

## Remaining External Dependencies
- **SMS/WhatsApp**: `NotificationsService` is a stub — integrate Africa's Talking / Twilio
- **Email**: Stub — integrate Resend / SendGrid for OTP delivery + password reset emails
- **Payment gateway**: `submitPayment()` is a placeholder — integrate MTN MoMo API
- **MoMo disbursement**: `withdrawal_requests` table exists — integrate MTN MoMo Disbursements API
- **Map tiles**: MapLibre GL placeholder in courier job detail page
- **Redis**: Replace in-memory OTP store with Redis for multi-instance deployments
- **Google OAuth**: Frontend must use Google Identity Services to get `id_token`, then POST to `/auth/google`

## Prisma Schema Tables
| Table | Description |
|-------|-------------|
| `users` | All users (senders, couriers, admins) |
| `refresh_tokens` | JWT refresh token store |
| `sender_profiles` | Sender business details |
| `onboarding_sessions` | Courier onboarding progress |
| `couriers` | Courier profiles + location |
| `courier_locations` | Location history |
| `deliveries` | Core delivery records |
| `delivery_events` | Audit log for status transitions |
| `courier_interests` | Couriers interested in a delivery |
| `chat_messages` | Delivery chat |
| `ratings` | Post-delivery ratings |
| `disputes` | Delivery disputes |
| `wallets` | Per-user balance |
| `wallet_transactions` | Transaction ledger |
| `withdrawal_requests` | MoMo payout requests |
