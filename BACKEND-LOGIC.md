# BACKEND LOGIC REFERENCE

> NestJS 10 · Supabase (PostgREST via supabase-js service_role) · No ORM
> Base URL: `http://localhost:3001/api/v1`
> WebSocket namespace: `/ws`

---

## 1. GLOBAL SETUP (`main.ts`)

- Global prefix: `/api/v1`
- CORS: origin = `FRONTEND_URL` (default `http://localhost:3000`), credentials allowed
- `ValidationPipe` — whitelist, forbidNonWhitelisted, transform
- Port: `PORT` env var (default `3001`)
- Rate limiting: ThrottlerModule — 100 requests / 60 s globally (endpoints can tighten this)

---

## 2. DATABASE SERVICE (`db/db.service.ts`)

Single injectable that wraps the Supabase service_role client.
All methods accept **camelCase** keys and convert to **snake_case** for PostgREST.
All results are mapped back to **camelCase** before returning.

| Method | Signature | Notes |
|--------|-----------|-------|
| `findOne` | `(table, column, value)` | Returns single row or `null` |
| `findMany` | `(table, opts?)` | opts: `column, value, orderBy, orderDir, limit` |
| `create` | `(table, data)` | INSERT … RETURNING |
| `update` | `(table, column, value, data)` | UPDATE WHERE col=val, returns updated row |
| `delete` | `(table, column, value)` | DELETE WHERE col=val |
| `findOneWithJoin` | `(table, column, value, joins[])` | PostgREST embed syntax (e.g. `courier_profile:couriers(*)`) |
| `getClient()` | — | Returns raw Supabase client for complex queries |

> Use `mapRow(data)` (exported) to convert raw PostgREST results to camelCase.


---

## 3. AUTH SYSTEM

### Guards

**`SupabaseAuthGuard`** (HTTP)
- Extracts token from `Authorization: Bearer <token>` header OR `access_token` cookie
- Calls `supabase.auth.getUser(token)` to validate
- Looks up `users` table by `supabaseId` → injects `request.user` (full DB row)
- Throws `401` if no token, invalid, or user deactivated (`isActive = false`)
- **Dev bypass**: if Supabase env vars are missing, injects a mock ADMIN user so the app boots without credentials

**`RolesGuard`**
- Reads `@Roles(...)` metadata from route handler
- Compares `request.user.role` against required roles
- Throws `403` if role doesn't match

### Decorators
- `@CurrentUser()` — extracts `request.user` (or a specific field if a key is passed)
- `@Roles(...roles)` — metadata decorator, consumed by RolesGuard

---

### Auth Endpoints (`/auth`)

| Method | Path | Throttle | Auth | What it does |
|--------|------|----------|------|--------------|
| POST | `/auth/sender/signup` | 5/min | Public | Creates Supabase user + local `users` row (role=SENDER). Returns message asking to confirm email |
| POST | `/auth/sender/signin` | 10/min | Public | `signInWithPassword`, returns `access_token`, `refresh_token`, user. Sets httpOnly cookies |
| POST | `/auth/courier/check-phone` | 10/min | Public | Returns `{exists: bool}` — checks if phone is in `users` table |
| POST | `/auth/courier/request-otp` | 3/min | Public | Sends Supabase SMS OTP **only if phone exists** in DB |
| POST | `/auth/courier/verify-otp` | 10/min | Public | Verifies OTP, creates `users` row if needed (role=COURIER), returns tokens + `needsOnboarding` flag |
| POST | `/auth/admin/signin` | 5/min | Public | `signInWithPassword`, checks `role === ADMIN`, returns tokens |
| POST | `/auth/google` | 10/min | Public | `signInWithIdToken(idToken)`, upserts user, returns tokens |
| POST | `/auth/google/callback` | 10/min | Public | `getUser(accessToken)`, upserts user, updates profile photo/name |
| POST | `/auth/request-otp` | 3/min | Public | Generic OTP send (no phone existence check) |
| POST | `/auth/verify-otp` | 10/min | Public | Generic OTP verify |
| POST | `/auth/refresh` | 10/min | Public | `refreshSession(refreshToken)`, returns new tokens + sets cookies |
| POST | `/auth/password/reset` | 3/min | Public | Sends reset email via Supabase |
| POST | `/auth/password/update` | 5/min | Protected | Updates password via `supabase.auth.updateUser` |
| POST | `/auth/email/resend-confirmation` | 3/min | Public | Resends signup confirmation email |
| GET | `/auth/me` | — | Protected | Returns `users` row with joined `courier_profile`, `sender_profile`, `onboarding_session` |
| GET | `/auth/sessions` | — | Protected | Returns Supabase user session metadata |
| POST | `/auth/sessions/revoke-all` | 3/min | Protected | Signs out all sessions via admin client |
| POST | `/auth/logout` | — | Protected | Clears `access_token` + `refresh_token` cookies |
| PATCH | `/auth/role` | — | Protected, ADMIN | Updates any user's role |

**Cookie config**: `httpOnly`, `sameSite: lax`, `access_token` expires 1 h, `refresh_token` expires 30 days, `secure` in production.


---

## 4. DELIVERY STATE MACHINE (`deliveries/delivery-state-machine.service.ts`)

### Valid Transitions

```
DRAFT           → BROADCAST
BROADCAST       → COURIER_ASSIGNED | CANCELLED
COURIER_ASSIGNED → COURIER_CONFIRMED | BROADCAST | CANCELLED
COURIER_CONFIRMED → PICKUP_EN_ROUTE | CANCELLED
PICKUP_EN_ROUTE → ARRIVED_PICKUP | CANCELLED
ARRIVED_PICKUP  → PICKED_UP | CANCELLED
PICKED_UP       → IN_TRANSIT | DISPUTED
IN_TRANSIT      → ARRIVED_DROPOFF | DISPUTED
ARRIVED_DROPOFF → DELIVERED | FAILED | DISPUTED
DELIVERED       → (terminal)
CANCELLED       → (terminal)
DISPUTED        → (terminal)
FAILED          → (terminal)
```

### `transition(deliveryId, newStatus, userId?, metadata?)`
1. Fetches delivery, validates transition is allowed (throws `400` if not)
2. Updates `deliveries.status`; also sets `cancelledAt`, `pickedUpAt`, or `deliveredAt` timestamps as appropriate
3. Creates a `delivery_events` row with mapped `event_type`
4. Returns the updated delivery row

### `canCancel(status)` → boolean
Returns `true` for: `DRAFT, BROADCAST, COURIER_ASSIGNED, COURIER_CONFIRMED, PICKUP_EN_ROUTE, ARRIVED_PICKUP`

### Status → Event mapping

| Status | Event type written |
|--------|-------------------|
| DRAFT | `DELIVERY_CREATED` |
| BROADCAST | `BROADCAST_SENT` |
| COURIER_ASSIGNED | `COURIER_SELECTED` |
| COURIER_CONFIRMED | `COURIER_CONFIRMED` |
| PICKUP_EN_ROUTE | `COURIER_DEPARTED_PICKUP` |
| ARRIVED_PICKUP | `COURIER_ARRIVED_PICKUP` |
| PICKED_UP / IN_TRANSIT | `PACKAGE_PICKED_UP` |
| ARRIVED_DROPOFF | `COURIER_ARRIVED_DROPOFF` |
| DELIVERED | `DELIVERY_COMPLETED` |
| CANCELLED / FAILED | `DELIVERY_CANCELLED` |
| DISPUTED | `DISPUTE_RAISED` |


---

## 5. DELIVERIES SERVICE — FULL FLOW

### `create(userId, dto)` → `POST /deliveries` (SENDER only)
1. Generates `recipientTrackingToken` (20-byte hex)
2. Inserts into `deliveries` with `status = DRAFT`
3. Re-fetches row with `sender` join
4. Calls `broadcastToNearbyCouriers(delivery)` immediately

### `broadcastToNearbyCouriers(delivery)` (private)
1. Calls `stateMachine.transition(id, BROADCAST, senderId)` → status becomes `BROADCAST`
2. Queries all couriers where `is_online=true`, `is_approved_by_admin=true`, `current_lat IS NOT NULL`
3. For each courier, computes Haversine distance from pickup
4. If distance ≤ **300 m** (0.3 km): emits `job:available` WebSocket to `courier:<userId>` room + SMS via `NotificationsService`

### `takeJob(deliveryId, courierUserId, proposedPriceRwf?)` → `POST /deliveries/:id/take-job` (COURIER)
1. Looks up courier profile by `userId`
2. Atomic UPDATE: sets `courier_id` WHERE `status='BROADCAST' AND courier_id IS NULL` — concurrency-safe
3. Throws `400` if delivery is no longer available (another courier took it)
4. Transitions to `COURIER_ASSIGNED`
5. SMS-notifies sender, emits `courier:interested` WS event with `type: 'JOB_TAKEN'`

### `confirmAgreement(deliveryId, userId, agreedPriceRwf, agreedDeliveryTime?)` → `POST /deliveries/:id/confirm-agreement` (SENDER or COURIER)
1. Validates `status === COURIER_ASSIGNED`
2. Confirms caller is sender OR courier on this delivery
3. Saves `agreed_price_rwf`, `final_price_rwf`, `agreed_delivery_time`
4. Transitions to `COURIER_CONFIRMED`
5. Emits `courier:interested` WS event with `type: 'AGREEMENT_CONFIRMED'`

### `submitPayment(deliveryId, senderUserId, agreedDeliveryTime?)` → `POST /deliveries/:id/pay` (SENDER)
1. Guards: `status === COURIER_CONFIRMED`, `payment_status !== HELD`, `agreed_price_rwf > 0`
2. Sets `payment_status = HELD`, `payment_held_at = now()`
3. Attempts to debit sender wallet (non-critical, won't fail the request if wallet missing)
4. Emits `courier:interested` WS with `type: 'PAYMENT_HELD'`
5. SMS-notifies courier "payment secured"

### `startDelivery(deliveryId, courierUserId)` → `POST /deliveries/:id/start-delivery` (COURIER)
1. Guards: `status === COURIER_CONFIRMED`, **`payment_status === HELD`** (hard stop if not paid)
2. Generates 6-digit pickup OTP → bcrypt-hashes, stores in `pickup_otp_hash`
3. Sets `delivery_started_at`
4. Transitions to `PICKUP_EN_ROUTE`
5. SMS-notifies sender "courier on the way"
6. **Returns `pickupOtp` in plain text** (courier shows this to sender for handover)

### `arrivedAtPickup(deliveryId, courierUserId, otp)` → `POST /deliveries/:id/arrived-pickup` (COURIER)
1. Guards: `status === PICKUP_EN_ROUTE`, must be assigned courier
2. Bcrypt-compares provided `otp` against `pickup_otp_hash`
3. Sets `courier_arrived_at`
4. Transitions to `ARRIVED_PICKUP`

### `pickedUp(deliveryId, courierUserId)` → `POST /deliveries/:id/picked-up` (COURIER)
- Guard: `status === ARRIVED_PICKUP`
- Transitions to `PICKED_UP`

### `inTransit(deliveryId, courierUserId)` → `POST /deliveries/:id/in-transit` (COURIER)
- Guard: `status === PICKED_UP`
- Transitions to `IN_TRANSIT`

### `courierArrived(deliveryId, courierUserId)` → `POST /deliveries/:id/arrived` (COURIER)
1. Guard: `status === IN_TRANSIT`
2. Generates 6-digit dropoff OTP → bcrypt-hashes, stores in `dropoff_otp_hash`
3. Sets `dropoff_otp_sent_at`
4. Calls `notifications.sendOtp(recipientPhone, otp, dropoffEmail?)` — SMS + WhatsApp + optional email
5. Transitions to `ARRIVED_DROPOFF`
6. **Returns `dropoffOtp` in plain text**

### `completeDelivery(deliveryId, courierUserId, otp?)` → `POST /deliveries/:id/complete` (COURIER)
1. Guard: `status === ARRIVED_DROPOFF`
2. If `requiresRecipientOtp` and `dropoff_otp_hash` missing: generates + sends OTP (rare fallback)
3. If `requiresRecipientOtp`: bcrypt-compares `otp` against `dropoff_otp_hash` (throws `400` if wrong)
4. Transitions to `DELIVERED`
5. Sets `payment_status = RELEASED`, `payment_released_at`, `otp_verified_at`
6. Calls `walletService.creditCourier(courierUserId, finalPrice, deliveryId)` — deducts 100 RWF fee
7. Updates courier stats: `total_deliveries +1`, `total_earnings += finalPrice`
8. SMS-notifies sender delivery complete
9. Returns `{ delivered, finalPrice, fee: 100, netAmount }`

### `cancel(id, userId)` → `PUT /deliveries/:id/cancel` (SENDER)
- Verifies caller is sender or admin
- Checks `canCancel(status)`, transitions to `CANCELLED`

### `expressInterest(deliveryId, courierUserId, dto)` → `POST /deliveries/:id/interest` (COURIER)
- Upserts into `courier_interests` with `proposed_price_rwf`, `eta_minutes`

### `findAll(userId, role)` → `GET /deliveries`
- SENDER: filters by `sender_id = userId`
- COURIER: looks up courier row, filters by `courier_id`
- ADMIN: returns all

### `findOne(id)` → `GET /deliveries/:id`
- Full join: sender, courier (with user), delivery_events, chat_messages (with sender), dispute, rating

### `getAvailable / getNearbyAvailable` → `GET /deliveries/available` (COURIER)
- Returns deliveries with `status=BROADCAST`, `courier_id IS NULL`
- If courier has location → filters by 300 m Haversine radius


---

## 6. COURIERS MODULE

### Onboarding flow (3-section single-page form)

| Endpoint | Method | Service call | What happens |
|----------|--------|-------------|--------------|
| `POST /couriers/onboarding/start` | Protected | `startOnboarding(userId, dto)` | Creates `onboarding_sessions` row (idempotent). Optionally creates Supabase auth user for the phone and sends OTP |
| `PUT /couriers/onboarding/step` | Protected | `saveOnboardingStep(userId, dto)` | Upserts any field in `onboarding_sessions`, tracks `current_step` |
| `GET /couriers/onboarding/status` | Protected | `getOnboardingStatus(userId)` | Returns `{ hasSession, session }` |
| `POST /couriers/onboarding/submit` | Protected | `submitOnboarding(userId, dto)` | Requires `agreeToTerms=true`. Marks session complete, creates `couriers` row with `is_approved_by_admin=false`, updates user role to COURIER |

### Other courier endpoints (all require role=COURIER except `register` and `nearby`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /couriers/register` | Protected | Direct register (skips onboarding) |
| `PUT /couriers/me` | COURIER | Update profile fields |
| `PUT /couriers/me/online` | COURIER | Toggle `is_online`, optionally set lat/lng |
| `PUT /couriers/me/location` | COURIER | Update `current_lat/lng`, inserts `courier_locations` row |
| `GET /couriers/me/jobs` | COURIER | All deliveries for this courier |
| `GET /couriers/dashboard` | COURIER | Active job, available jobs count, today/week/month delivery counts, earnings, avg rating |
| `GET /couriers/me/earnings` | COURIER | `totalEarnings, totalDeliveries, completionRate, avgRating` |
| `GET /couriers/nearby?lat&lng&radiusKm` | ADMIN | Approved online couriers within radius |

### `getDashboard` detail
Runs 8 parallel queries:
- Active job (any in-progress status)
- Count of available `BROADCAST` jobs
- Today/week/month delivery counts (for this courier)
- Today/month earnings (sum `final_price_rwf` on DELIVERED)
- All ratings received (computes `avgRating`)


---

## 7. WALLET SERVICE (`wallet/wallet.service.ts`)

Service fee: **100 RWF** per delivery (constant).

### `getWallet(userId)` → `GET /wallet`
- Creates wallet if not found (`balance=0`)
- Returns `{ balance, transactions[] }` (last 50 ordered by `created_at desc`)

### `topUp(userId, amount, method)` → `POST /wallet/top-up`
- Credits wallet balance
- Inserts `wallet_transactions` row: `type='credit'`

### `withdraw(userId, amount, method)` → `POST /wallet/withdraw`
- Checks `balance >= amount`, throws `400` if insufficient
- Debits balance, inserts `type='withdrawal'` transaction

### `creditCourier(courierUserId, amount, deliveryId)` (called internally on delivery complete)
- `netAmount = amount - 100`
- Adds `netAmount` to courier wallet balance
- Inserts two `wallet_transactions` rows: `type='credit'` (net) + `type='fee'` (100 RWF)

### `debitSender(senderUserId, amount, deliveryId)` (called internally on payment)
- Subtracts `amount` from sender wallet (balance can go negative — placeholder escrow)
- Inserts `type='debit'` transaction

---

## 8. NOTIFICATIONS SERVICE (`notifications/notifications.service.ts`)

> **Stub only — all methods log to console, no real sending.**

| Method | Channels used |
|--------|--------------|
| `sendOtp(phone, otp, email?)` | SMS + WhatsApp + Email (if email provided) |
| `notifyJobAvailable(phone, pickupAddress)` | SMS |
| `notifyCourierAccepted(phone, courierName)` | SMS |
| `notifyDeliveryStarted(phone)` | SMS |
| `notifyDeliveryCompleted(phone, courierName)` | SMS + WhatsApp |
| `notifyMoneyReceived(phone, amount)` | SMS |

To integrate real providers: replace the `sendSms`, `sendWhatsApp`, `sendEmail` private methods.

---

## 9. WEBSOCKET GATEWAY (`common/delivery.gateway.ts`)

- Namespace: `/ws`
- Auth: validates Supabase JWT on `handleConnection`; disconnects on failure
- Dev mode (no Supabase configured): accepts all connections with a generated `dev-user-<id>`

### Client → Server events

| Event | Payload | Effect |
|-------|---------|--------|
| `join:delivery` | `deliveryId: string` | Client joins room `delivery:<id>` |
| `leave:delivery` | `deliveryId: string` | Client leaves room |
| `join:courier` | `courierId: string` | Client joins room `courier:<id>` |
| `leave:courier` | `courierId: string` | Client leaves room |
| `location:update` | `{ deliveryId, lat, lng, accuracy?, heading?, speed? }` | Broadcasts `courier:location` to `delivery:<id>` room |
| `status:update` | `{ deliveryId, status }` | Broadcasts `delivery:status` to `delivery:<id>` room |

### Server → Client events (emitted by services)

| Event | Target room | Emitted by |
|-------|-------------|-----------|
| `job:available` | `courier:<userId>` | `broadcastToNearbyCouriers` |
| `job:cancelled` | `delivery:<id>` | `emitJobCancelled` |
| `courier:interested` | `delivery:<id>` | `takeJob`, `confirmAgreement`, `submitPayment` |
| `delivery:status` | `delivery:<id>` | `status:update` handler |
| `courier:location` | `delivery:<id>` | `location:update` handler |
| `message:new` | `delivery:<id>` | `ChatService.sendMessage` |


---

## 10. ADMIN MODULE (`/admin` — all routes require ADMIN role)

| Endpoint | Purpose |
|----------|---------|
| `GET /admin/dashboard` | Active deliveries, online couriers, today's completions, disputes, revenue (today/week/month), top couriers, recent events |
| `GET /admin/couriers?tier&approved&zone` | List all couriers with filters |
| `PUT /admin/couriers/:id/verify` | Set `is_approved_by_admin`, optional `tier`, `admin_notes` |
| `PUT /admin/couriers/:id/suspend` | Sets `is_online=false`, `is_approved_by_admin=false`, `users.is_active=false` |
| `GET /admin/users?role&search` | List users, searchable by name/email/phone |
| `GET /admin/deliveries?status&zone` | List deliveries (limit 100) |
| `GET /admin/disputes` | All disputes with delivery join |
| `PUT /admin/disputes/:id` | Update dispute `status`, `resolution`; sets `resolvedAt` if closed |
| `GET /admin/live-map` | Active in-progress deliveries + online couriers with coordinates |

---

## 11. SENDER MODULE

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /sender/dashboard` | Protected | `activeDeliveries`, `totalDeliveries`, `totalSpent`, `recentDeliveries` (last 5), `savedAddresses` |

---

## 12. CHAT MODULE

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /chat/conversations` | Protected | Returns all delivery conversations for the user with `lastMessage`, `unreadCount`, other party details |
| `GET /deliveries/:id/chat` | Protected | All messages for a delivery (sender + sender name joined), ordered by `sent_at ASC` |
| `POST /deliveries/:id/chat` | Protected | Insert message, emit `message:new` WS event to `delivery:<id>` room |

Access control: only sender or courier of that delivery (or admin) can read/write messages.

---

## 13. TRACKING MODULE (public, no auth)

| Endpoint | Purpose |
|----------|---------|
| `GET /track/:token` | Get delivery by `recipient_tracking_token`. Returns full delivery with courier location, events |
| `POST /track/:token/confirm-otp` | Recipient confirms dropoff OTP. Validates OTP, transitions to DELIVERED, releases payment, credits courier, notifies sender |

Throttled: OTP confirm limited to 5/min.

---

## 14. STORAGE MODULE

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /storage/presigned-url` | Protected | Generates Cloudflare R2 presigned PUT URL. Body: `{ fileName, contentType, folder }`. Returns `{ uploadUrl, publicUrl, key }` |

R2 folders (constants): `profiles`, `courier-documents`, `delivery-photos`, `chat-photos`  
Presigned URL expires in **900 seconds (15 min)**.


---

## 15. ERROR HANDLING

Global `HttpExceptionFilter` (applied via `CommonModule`) catches all `HttpException` and returns:

```json
{
  "success": false,
  "error": "message string",
  "details": "validation errors array (if any)"
}
```

---

## 16. KEY ENUMS (`types.ts`)

```ts
UserRole:        SENDER | COURIER | ADMIN
DeliveryStatus:  DRAFT | BROADCAST | COURIER_ASSIGNED | COURIER_CONFIRMED |
                 PICKUP_EN_ROUTE | ARRIVED_PICKUP | PICKED_UP | IN_TRANSIT |
                 ARRIVED_DROPOFF | DELIVERED | CANCELLED | DISPUTED | FAILED
PaymentStatus:   PENDING | HELD | RELEASED | REFUNDED
PackageCategory: DOCUMENT | FOOD | ELECTRONICS | CLOTHING | PHARMACY | FRAGILE | OTHER
PackageSize:     SMALL | MEDIUM | LARGE
PaymentMethod:   CASH | MOBILE_MONEY | PLATFORM_BALANCE
DisputeStatus:   OPEN | UNDER_REVIEW | RESOLVED_SENDER | RESOLVED_COURIER | CLOSED
CourierVerificationTier: BASIC | IDENTITY | VEHICLE | TRUSTED
```

---

## 17. ENV VARS REQUIRED

| Variable | Used by |
|----------|---------|
| `SUPABASE_URL` | DbService, AuthService, SupabaseAuthGuard, DeliveryGateway |
| `SUPABASE_ANON_KEY` | AuthService (anon client), DeliveryGateway |
| `SUPABASE_SERVICE_ROLE_KEY` | DbService (service_role client), AuthService (admin ops), CouriersService |
| `FRONTEND_URL` | CORS origin, password reset redirect |
| `PORT` | Server port (default 3001) |
| `R2_ACCOUNT_ID` | StorageService endpoint |
| `R2_ACCESS_KEY_ID` | StorageService |
| `R2_SECRET_ACCESS_KEY` | StorageService |
| `R2_BUCKET_NAME` | StorageService (default `delivery-media`) |
| `R2_PUBLIC_URL` | StorageService public URL base |
| `OTP_EXPIRY_MINUTES` | constants (default 30) |
| `BROADCAST_RADIUS_KM` | constants (default 5 — note: service hardcodes 0.3) |
| `BROADCAST_WINDOW_SECONDS` | constants (default 90) |
| `COURIER_CONFIRM_TIMEOUT_SECONDS` | constants (default 30) |

---

## 18. COMPLETE ENDPOINT SUMMARY

```
POST   /api/v1/auth/sender/signup
POST   /api/v1/auth/sender/signin
POST   /api/v1/auth/courier/check-phone
POST   /api/v1/auth/courier/request-otp
POST   /api/v1/auth/courier/verify-otp
POST   /api/v1/auth/admin/signin
POST   /api/v1/auth/google
POST   /api/v1/auth/google/callback
POST   /api/v1/auth/request-otp
POST   /api/v1/auth/verify-otp
POST   /api/v1/auth/refresh
POST   /api/v1/auth/password/reset
POST   /api/v1/auth/password/update
POST   /api/v1/auth/email/resend-confirmation
GET    /api/v1/auth/sessions
POST   /api/v1/auth/sessions/revoke-all
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
PATCH  /api/v1/auth/role

POST   /api/v1/deliveries
GET    /api/v1/deliveries
GET    /api/v1/deliveries/available
GET    /api/v1/deliveries/:id
POST   /api/v1/deliveries/:id/interest
POST   /api/v1/deliveries/:id/take-job
POST   /api/v1/deliveries/:id/confirm-agreement
POST   /api/v1/deliveries/:id/pay
POST   /api/v1/deliveries/:id/start-delivery
POST   /api/v1/deliveries/:id/arrived-pickup
POST   /api/v1/deliveries/:id/picked-up
POST   /api/v1/deliveries/:id/in-transit
POST   /api/v1/deliveries/:id/arrived
POST   /api/v1/deliveries/:id/complete
POST   /api/v1/deliveries/:id/rate
PUT    /api/v1/deliveries/:id/cancel

POST   /api/v1/couriers/register
POST   /api/v1/couriers/onboarding/start
PUT    /api/v1/couriers/onboarding/step
GET    /api/v1/couriers/onboarding/status
POST   /api/v1/couriers/onboarding/submit
PUT    /api/v1/couriers/me
PUT    /api/v1/couriers/me/online
PUT    /api/v1/couriers/me/location
GET    /api/v1/couriers/me/jobs
GET    /api/v1/couriers/dashboard
GET    /api/v1/couriers/me/earnings
GET    /api/v1/couriers/nearby

GET    /api/v1/admin/dashboard
GET    /api/v1/admin/couriers
PUT    /api/v1/admin/couriers/:id/verify
PUT    /api/v1/admin/couriers/:id/suspend
GET    /api/v1/admin/users
GET    /api/v1/admin/deliveries
GET    /api/v1/admin/disputes
PUT    /api/v1/admin/disputes/:id
GET    /api/v1/admin/live-map

GET    /api/v1/sender/dashboard

GET    /api/v1/chat/conversations
GET    /api/v1/deliveries/:id/chat
POST   /api/v1/deliveries/:id/chat

GET    /api/v1/track/:token
POST   /api/v1/track/:token/confirm-otp

POST   /api/v1/storage/presigned-url

GET    /api/v1/wallet
POST   /api/v1/wallet/top-up
POST   /api/v1/wallet/withdraw
```
