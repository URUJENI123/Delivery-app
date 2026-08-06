import type { Express, Router } from 'express';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger / OpenAPI 3 documentation for the Delivery App API.
 *
 * The OpenAPI document is generated at boot time:
 *   - Route enumeration is done by introspecting the mounted Express routers,
 *     so every endpoint appears in the docs even if it has no hand-written
 *     metadata (no drift between routes and docs).
 *   - A curated metadata map (META) adds human-readable summaries, tags,
 *     request bodies and response schemas for every endpoint.
 *   - Mounted at GET /api-docs (interactive UI) and GET /api-docs.json (raw spec).
 */

// ─── types (loose — OpenAPI shapes are JSON-ish) ──────────────────────────────

interface RouteEntry {
  method:   string; // 'GET' | 'POST' | ...
  fullPath: string; // '/api/v1/auth/sender/signup'
  specPath: string; // '/auth/sender/signup' (relative to the /api/v1 server)
}

type QueryParam = Record<string, unknown> & {
  name:        string;
  required?:   boolean;
  description?: string;
  schema:      Record<string, unknown>;
};

interface OpMeta {
  summary:            string;
  description?:       string;
  tags?:              string[];
  public?:            boolean;
  requestBody?:       string;
  requestBodyRequired?: boolean;
  responseSchema?:    string;
  responseStatus?:    number;
  queryParams?:       QueryParam[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function schemaRef(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

function errorResponse(description: string) {
  return {
    description,
    content: { 'application/json': { schema: schemaRef('Error') } },
  };
}

function standardResponses(status: number, schemaName?: string, isPublic = false) {
  const success: Record<string, unknown> = { description: status === 201 ? 'Created' : 'OK' };
  if (schemaName) success.content = { 'application/json': { schema: schemaRef(schemaName) } };

  const responses: Record<string, unknown> = { [status]: success };
  responses[400] = errorResponse('Bad request — validation failed or invalid body');
  responses[429] = errorResponse('Too many requests — rate limit exceeded');
  if (!isPublic) {
    responses[401] = errorResponse('Unauthorized — missing or invalid access token');
    responses[403] = errorResponse('Forbidden — insufficient permissions for this role');
  }
  return responses;
}

function requestBody(name: string, required = true) {
  return {
    required,
    content: { 'application/json': { schema: schemaRef(name) } },
  };
}

function paramObject(name: string, required: boolean, schema: Record<string, unknown>, description?: string) {
  return { name, in: 'query', required, schema, description };
}

// ─── tag mapping ──────────────────────────────────────────────────────────────

const TAGS = [
  { name: 'Auth',            description: 'Authentication: signup, signin, OTP login, sessions, tokens and password management.' },
  { name: 'Couriers',        description: 'Courier onboarding, profiles, GPS, job discovery and earnings.' },
  { name: 'Deliveries',      description: 'The full delivery lifecycle: create, assign, pay, track, complete, rate and cancel.' },
  { name: 'Wallet & Payments', description: 'Wallets, MTN MoMo / Airtel Money top-ups, withdrawals, payouts and provider webhooks.' },
  { name: 'Refunds',         description: 'Admin-managed refund requests — cancellation never auto-refunds, an admin must approve.' },
  { name: 'Admin',           description: 'Admin dashboard, courier verification, users, live map and platform revenue.' },
  { name: 'Sender',          description: 'Sender-facing dashboard.' },
  { name: 'Tracking',        description: 'Public, unauthenticated delivery tracking via recipient token.' },
  { name: 'Chat',            description: 'Per-delivery messaging between sender and courier.' },
  { name: 'Users',           description: 'Profile management for the authenticated user.' },
  { name: 'Geocoding',       description: 'Kigali geocoding: bounds, address → coordinates and reverse lookups.' },
  { name: 'Storage',         description: 'Signed Cloudinary upload URLs — clients upload binaries directly.' },
  { name: 'System',          description: 'Infrastructure and health checks.' },
];

function tagForPath(specPath: string): string {
  const seg = specPath.split('/')[1];
  switch (seg) {
    case 'auth':        return 'Auth';
    case 'couriers':    return 'Couriers';
    case 'deliveries':  return 'Deliveries';
    case 'wallet':      return 'Wallet & Payments';
    case 'admin':       return 'Admin';
    case 'sender':      return 'Sender';
    case 'track':       return 'Tracking';
    case 'chat':        return 'Chat';
    case 'users':       return 'Users';
    case 'geocode':     return 'Geocoding';
    case 'storage':     return 'Storage';
    default:            return 'System';
  }
}

function fallbackSummary(method: string, specPath: string): string {
  const noun = specPath.split('/').pop()?.replace(/[{}]/g, '') ?? 'resource';
  switch (method) {
    case 'GET':    return `Retrieve ${noun.replace(/-/g, ' ')}`;
    case 'POST':   return `Create / action on ${noun.replace(/-/g, ' ')}`;
    case 'PUT':    return `Update ${noun.replace(/-/g, ' ')}`;
    case 'PATCH':  return `Partially update ${noun.replace(/-/g, ' ')}`;
    case 'DELETE': return `Delete ${noun.replace(/-/g, ' ')}`;
    default:       return `${method} ${specPath}`;
  }
}

// ─── curated endpoint metadata ────────────────────────────────────────────────

const META: Record<string, OpMeta> = {
  // ── Auth ───────────────────────────────────────────────────────────────────
  'POST /auth/sender/signup': {
    summary: 'Create a sender account',
    description: 'Registers a sender with email + password. Returns a token pair (also set as httpOnly cookies).',
    requestBody: 'SenderSignupInput', responseStatus: 201, responseSchema: 'AuthResponse',
  },
  'POST /auth/sender/signin': {
    summary: 'Sender sign in',
    requestBody: 'EmailPasswordInput', responseSchema: 'AuthResponse',
  },
  'POST /auth/admin/signin': {
    summary: 'Admin sign in',
    requestBody: 'EmailPasswordInput', responseSchema: 'AuthResponse',
  },
  'POST /auth/courier/signup': {
    summary: 'Create a courier account (step 1 of onboarding)',
    requestBody: 'CourierSignupInput', responseStatus: 201, responseSchema: 'AuthResponse',
  },
  'POST /auth/courier/signin': {
    summary: 'Courier sign in (email + password)',
    requestBody: 'EmailPasswordInput', responseSchema: 'AuthResponse',
  },
  'POST /auth/courier/check-phone': {
    summary: 'Check if a phone number is already registered',
    public: true,
    requestBody: 'PhoneInput', responseSchema: 'PhoneExistsResponse',
  },
  'POST /auth/courier/request-otp': {
    summary: 'Request a login OTP',
    description: 'OTP is logged to the server console (SMS is stubbed). Also creates the user if the phone is new.',
    public: true,
    requestBody: 'PhoneInput', responseSchema: 'OtpRequestedResponse',
  },
  'POST /auth/courier/verify-otp': {
    summary: 'Verify the login OTP and receive tokens',
    public: true,
    requestBody: 'VerifyOtpInput', responseSchema: 'AuthResponse',
  },
  'POST /auth/google': {
    summary: 'Sign in / up with Google',
    public: true,
    requestBody: 'GoogleAuthInput', responseSchema: 'AuthResponse',
  },
  'POST /auth/refresh': {
    summary: 'Refresh the access token',
    public: true,
    requestBody: 'RefreshInput', responseSchema: 'AccessTokenResponse',
  },
  'GET /auth/me': {
    summary: 'Get the authenticated user',
    responseSchema: 'User',
  },
  'POST /auth/logout': {
    summary: 'Log out (revokes the refresh token)',
    responseSchema: 'MessageResponse',
  },
  'PATCH /auth/role': {
    summary: 'Change a user role',
    requestBody: 'RoleUpdateInput', responseSchema: 'User',
  },
  'POST /auth/password/reset': {
    summary: 'Request a password reset link',
    public: true,
    requestBody: 'PasswordResetInput', responseSchema: 'MessageResponse',
  },
  'POST /auth/password/update': {
    summary: 'Update the password for the authenticated user',
    requestBody: 'PasswordUpdateInput', responseSchema: 'MessageResponse',
  },
  'GET /auth/sessions': {
    summary: 'List active refresh-token sessions',
    responseSchema: 'SessionList',
  },
  'POST /auth/sessions/revoke-all': {
    summary: 'Revoke all active sessions',
    responseSchema: 'MessageResponse',
  },

  // ── Couriers ───────────────────────────────────────────────────────────────
  'POST /couriers/register': {
    summary: 'Register a courier profile',
    description: 'Legacy one-shot registration. Promotes the user to COURIER and upserts the profile. Use the onboarding flow for new couriers.',
    requestBody: 'RegisterCourierInput', responseStatus: 201, responseSchema: 'Courier',
  },
  'POST /couriers/onboarding/start': {
    summary: 'Start the onboarding session (seeds it from the signup)',
    requestBody: 'OnboardingStartInput', responseSchema: 'OnboardingStartResponse',
  },
  'PUT /couriers/onboarding/step': {
    summary: 'Save an onboarding step (2 = credentials, 3 = documents)',
    requestBody: 'OnboardingStepInput', responseSchema: 'OnboardingSession',
  },
  'GET /couriers/onboarding/status': {
    summary: 'Get the onboarding session status',
    responseSchema: 'OnboardingStatusResponse',
  },
  'POST /couriers/onboarding/submit': {
    summary: 'Submit onboarding for admin approval',
    requestBody: 'OnboardingSubmitInput', responseSchema: 'Courier',
  },
  'GET /couriers/me': {
    summary: 'Get the authenticated courier profile',
    responseSchema: 'Courier',
  },
  'PUT /couriers/me': {
    summary: 'Update the courier profile',
    requestBody: 'UpdateCourierProfileInput', responseSchema: 'Courier',
  },
  'GET /couriers/me/score': {
    summary: 'Get the courier efficiency score and tier',
    responseSchema: 'EfficiencyScore',
  },
  'PUT /couriers/me/online': {
    summary: 'Go online / offline',
    requestBody: 'ToggleOnlineInput', responseSchema: 'SuccessResponse',
  },
  'PUT /couriers/me/location': {
    summary: 'Report GPS location',
    description: 'Saved to CourierLocation and relayed to the active delivery room over WebSocket (throttled to 1 per 3s).',
    requestBody: 'UpdateLocationInput', responseSchema: 'SuccessResponse',
  },
  'GET /couriers/me/jobs': {
    summary: 'List jobs available to the courier',
    responseSchema: 'DeliveryList',
  },
  'GET /couriers/me/earnings': {
    summary: 'Get courier earnings summary',
    responseSchema: 'CourierEarnings',
  },
  'GET /couriers/dashboard': {
    summary: 'Get the courier dashboard',
    responseSchema: 'CourierDashboard',
  },
  'GET /couriers/nearby': {
    summary: '[ADMIN] List couriers near a point',
    queryParams: [
      paramObject('lat', true, { type: 'number' }),
      paramObject('lng', true, { type: 'number' }),
      paramObject('radius', false, { type: 'number' }, 'Radius in km (default: BROADCAST_RADIUS_KM = 5)'),
    ],
    responseSchema: 'CourierList',
  },

  // ── Deliveries ─────────────────────────────────────────────────────────────
  'POST /deliveries': {
    summary: '[SENDER] Create a delivery and broadcast to nearby couriers',
    description: 'Validates pickup/dropoff are inside the Kigali service area. Couriers are notified via WebSocket sorted by efficiency score.',
    requestBody: 'CreateDeliveryInput', responseStatus: 201, responseSchema: 'Delivery',
  },
  'GET /deliveries': {
    summary: 'List deliveries for the authenticated user',
    responseSchema: 'DeliveryList',
  },
  'GET /deliveries/available': {
    summary: '[COURIER] List deliveries available to accept',
    responseSchema: 'DeliveryList',
  },
  'GET /deliveries/{id}': {
    summary: 'Get a single delivery',
    responseSchema: 'Delivery',
  },
  'POST /deliveries/{id}/interest': {
    summary: '[COURIER] Express interest in a delivery',
    requestBody: 'InterestInput', responseSchema: 'SuccessResponse',
  },
  'POST /deliveries/{id}/take-job': {
    summary: '[COURIER] Atomically claim a delivery (409 if already taken)',
    requestBody: 'TakeJobInput', responseSchema: 'Delivery',
  },
  'POST /deliveries/{id}/confirm-agreement': {
    summary: 'Confirm the agreed price and delivery time',
    requestBody: 'ConfirmAgreementInput', responseSchema: 'Delivery',
  },
  'POST /deliveries/{id}/pay': {
    summary: '[SENDER] Pay for the delivery via MTN/Airtel MoMo',
    description: 'Pushes a USSD pop-up to the sender phone. The delivery transitions to HELD only after the provider webhook confirms.',
    requestBody: 'PayDeliveryInput', responseSchema: 'PayResponse',
  },
  'POST /deliveries/{id}/start-delivery': {
    summary: '[COURIER] Start the delivery (requires paymentStatus = HELD)',
    description: 'Generates the pickup OTP, returned to the courier.',
    responseSchema: 'PickupOtpResponse',
  },
  'POST /deliveries/{id}/arrived-pickup': {
    summary: '[COURIER] Arrive at pickup — verify the pickup OTP',
    requestBody: 'OtpInput', responseSchema: 'Delivery',
  },
  'POST /deliveries/{id}/picked-up': {
    summary: '[COURIER] Mark the package as picked up',
    responseSchema: 'Delivery',
  },
  'POST /deliveries/{id}/in-transit': {
    summary: '[COURIER] Mark the delivery as in transit',
    responseSchema: 'Delivery',
  },
  'POST /deliveries/{id}/arrived': {
    summary: '[COURIER] Arrive at dropoff — generates the dropoff OTP',
    description: 'Dropoff OTP is sent to the recipient (SMS stub). The courier needs it to complete the delivery.',
    responseSchema: 'DropoffOtpResponse',
  },
  'POST /deliveries/{id}/complete': {
    summary: '[COURIER] Complete the delivery',
    description: 'Verifies the dropoff OTP (unless pre-confirmed via the tracking link), releases escrow to the courier, charges the platform fee and recalculates the efficiency score.',
    requestBody: 'OtpInput', responseSchema: 'Delivery',
  },
  'POST /deliveries/{id}/rate': {
    summary: 'Rate a completed delivery (1–5 stars)',
    requestBody: 'RateDeliveryInput', responseSchema: 'SuccessResponse',
  },
  'PUT /deliveries/{id}/cancel': {
    summary: '[SENDER] Cancel a delivery (allowed up to ARRIVED_PICKUP)',
    description: 'Does NOT auto-refund. Money stays HELD — submit a refund request for admin approval.',
    responseSchema: 'Delivery',
  },
  'POST /deliveries/{id}/refund-request': {
    summary: '[SENDER] Request a refund of escrowed funds',
    description: 'Creates a PENDING_REVIEW refund request and notifies all admins via WebSocket. Only an admin can approve it.',
    tags: ['Refunds'],
    requestBody: 'RefundRequestInput', responseStatus: 201, responseSchema: 'RefundRequest',
  },
  'GET /deliveries/{id}/chat': {
    summary: 'Get the chat history for a delivery',
    tags: ['Chat'],
    responseSchema: 'ChatMessageList',
  },
  'POST /deliveries/{id}/chat': {
    summary: 'Send a message in a delivery thread',
    description: 'Accepts either `body` (web) or `content` (mobile).',
    tags: ['Chat'],
    requestBody: 'SendMessageInput', responseStatus: 201, responseSchema: 'ChatMessage',
  },

  // ── Wallet & Payments ──────────────────────────────────────────────────────
  'GET /wallet': {
    summary: 'Get the authenticated wallet (balance + transactions + withdrawals)',
    responseSchema: 'Wallet',
  },
  'POST /wallet/topup': {
    summary: 'Top up the wallet via MoMo USSD push (or direct credit without phoneNumber)',
    requestBody: 'TopupInput', responseSchema: 'TopupResponse',
  },
  'POST /wallet/withdraw': {
    summary: 'Withdraw wallet balance to a MoMo number (MTN or Airtel)',
    requestBody: 'WithdrawInput', responseSchema: 'WithdrawResponse',
  },
  'GET /wallet/payment-status/{id}': {
    summary: 'Poll a provider for the status of a pending payment',
    public: true,
    responseSchema: 'PaymentStatusResponse',
  },
  'POST /wallet/webhook': {
    summary: 'Provider callback (MTN/Airtel)',
    description: 'Called by MTN MoMo / Airtel Money to confirm payment results. No auth — restrict to provider IP ranges in production.',
    public: true,
    requestBody: 'WebhookInput', responseSchema: 'WebhookResponse',
  },

  // ── Refunds (admin) ────────────────────────────────────────────────────────
  'GET /admin/refunds': {
    summary: '[ADMIN] List refund requests',
    queryParams: [paramObject('status', false, { type: 'string', enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'] })],
    responseSchema: 'RefundRequestList',
  },
  'GET /admin/refunds/{id}': {
    summary: '[ADMIN] Get a single refund request',
    responseSchema: 'RefundRequest',
  },
  'PUT /admin/refunds/{id}/approve': {
    summary: '[ADMIN] Approve a refund — real MoMo disbursement to the sender phone',
    description: 'Disburses the full agreed price to the sender, zero platform fee.',
    tags: ['Refunds'],
    requestBody: 'ApproveRefundInput', responseSchema: 'RefundRequest',
  },
  'PUT /admin/refunds/{id}/reject': {
    summary: '[ADMIN] Reject a refund with a reason',
    tags: ['Refunds'],
    requestBody: 'RejectRefundInput', responseSchema: 'RefundRequest',
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  'GET /admin/dashboard': {
    summary: '[ADMIN] Platform dashboard statistics',
    responseSchema: 'AdminDashboard',
  },
  'GET /admin/live-map': {
    summary: '[ADMIN] Active deliveries + online couriers with GPS',
    responseSchema: 'LiveMap',
  },
  'GET /admin/revenue': {
    summary: '[ADMIN] Platform fee wallet balance + total fees earned',
    responseSchema: 'PlatformRevenue',
  },
  'POST /admin/revenue/withdraw': {
    summary: '[ADMIN] Withdraw platform service fees to a MoMo number',
    requestBody: 'RevenueWithdrawInput', responseSchema: 'WithdrawResponse',
  },
  'GET /admin/disputes': {
    summary: '[ADMIN] List disputes',
    responseSchema: 'DisputeList',
  },
  'GET /admin/couriers': {
    summary: '[ADMIN] List couriers (sorted by reliability score desc)',
    queryParams: [
      paramObject('tier', false, { type: 'string' }),
      paramObject('approved', false, { type: 'string' }, 'true / false'),
      paramObject('zone', false, { type: 'string' }, 'Nyarugenge / Kicukiro / Gasabo'),
    ],
    responseSchema: 'CourierList',
  },
  'PUT /admin/couriers/{id}/verify': {
    summary: '[ADMIN] Approve / reject courier onboarding',
    description: 'Emits the `courier:approval` WebSocket event to the courier.',
    requestBody: 'VerifyCourierInput', responseSchema: 'Courier',
  },
  'PUT /admin/couriers/{id}/suspend': {
    summary: '[ADMIN] Suspend a courier',
    description: 'Emits the `courier:suspended` WebSocket event.',
    requestBody: 'SuspendCourierInput', responseSchema: 'SuccessResponse',
  },
  'GET /admin/users': {
    summary: '[ADMIN] List users with role filter + search',
    queryParams: [
      paramObject('role', false, { type: 'string' }),
      paramObject('search', false, { type: 'string' }),
    ],
    responseSchema: 'AdminUserList',
  },
  'GET /admin/deliveries': {
    summary: '[ADMIN] List all deliveries',
    queryParams: [paramObject('status', false, { type: 'string' })],
    responseSchema: 'DeliveryList',
  },
  'PUT /admin/disputes/{id}': {
    summary: '[ADMIN] Resolve a dispute',
    requestBody: 'UpdateDisputeInput', responseSchema: 'Dispute',
  },

  // ── Sender ─────────────────────────────────────────────────────────────────
  'GET /sender/dashboard': {
    summary: '[SENDER] Sender dashboard summary',
    responseSchema: 'SenderDashboard',
  },

  // ── Tracking (public) ──────────────────────────────────────────────────────
  'GET /track/{token}': {
    summary: 'Public delivery tracking by recipient token',
    description: 'Full delivery status + courier position + event history. No auth required.',
    public: true,
    responseSchema: 'TrackingInfo',
  },
  'POST /track/{token}/confirm-otp': {
    summary: 'Recipient pre-confirms the dropoff OTP',
    description: 'When pre-confirmed, the courier can complete the delivery without the OTP.',
    public: true,
    requestBody: 'OtpInput', responseSchema: 'SuccessResponse',
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  'PUT /users/me': {
    summary: 'Update the authenticated user profile',
    requestBody: 'UpdateUserInput', responseSchema: 'User',
  },
  'POST /users/me/photo': {
    summary: 'Set the profile photo (public Cloudinary URL)',
    requestBody: 'UploadPhotoInput', responseSchema: 'User',
  },

  // ── Chat ───────────────────────────────────────────────────────────────────
  'GET /chat/conversations': {
    summary: 'List all chat conversations for the user',
    tags: ['Chat'],
    responseSchema: 'ConversationList',
  },

  // ── Geocoding ──────────────────────────────────────────────────────────────
  'GET /geocode/bounds': {
    summary: 'Kigali bounding box + district centres (public)',
    public: true,
    responseSchema: 'GeocodeBounds',
  },
  'POST /geocode/resolve': {
    summary: 'Resolve an address string to coordinates (Kigali only, 422 outside)',
    requestBody: 'ResolveAddressInput', responseSchema: 'GeocodeResult',
  },
  'POST /geocode/reverse': {
    summary: 'Reverse geocode coordinates to an address',
    requestBody: 'ReverseGeocodeInput', responseSchema: 'GeocodeResult',
  },

  // ── Storage ────────────────────────────────────────────────────────────────
  'POST /storage/signed-upload': {
    summary: 'Get a signed Cloudinary upload URL',
    description: 'Client uploads the binary directly to Cloudinary at uploadUrl, then saves publicUrl.',
    requestBody: 'SignedUploadInput', responseSchema: 'SignedUpload',
  },
};

// ─── OpenAPI component schemas ───────────────────────────────────────────────

const schemas: Record<string, unknown> = {
  // Base
  Error: {
    type: 'object',
    properties: {
      statusCode: { type: 'integer' },
      error:      { type: 'string' },
      message:    { type: 'string' },
      details:    { type: 'array', items: { type: 'object' } },
    },
  },
  User: {
    type: 'object',
    properties: {
      id:              { type: 'string', format: 'uuid' },
      email:           { type: 'string', format: 'email', nullable: true },
      phone:           { type: 'string', nullable: true },
      fullName:        { type: 'string', nullable: true },
      role:            { type: 'string', enum: ['SENDER', 'COURIER', 'ADMIN'] },
      profilePhotoUrl: { type: 'string', nullable: true },
      emailVerified:   { type: 'boolean' },
      phoneVerified:   { type: 'boolean' },
      isActive:        { type: 'boolean' },
      createdAt:       { type: 'string', format: 'date-time' },
      updatedAt:       { type: 'string', format: 'date-time' },
    },
  },
  AuthResponse: {
    type: 'object',
    properties: {
      access_token:  { type: 'string', description: 'JWT access token (1h). Also set as an httpOnly cookie.' },
      refresh_token: { type: 'string', description: 'Refresh token (30d), rotated on use. Also set as an httpOnly cookie.' },
      user:          schemaRef('User'),
      needsOnboarding: { type: 'boolean', nullable: true, description: 'Courier OTP login — true when no courier profile exists yet.' },
    },
  },
  AccessTokenResponse: {
    type: 'object',
    properties: { access_token: { type: 'string' } },
  },
  MessageResponse: {
    type: 'object',
    properties: { message: { type: 'string' } },
  },
  SuccessResponse: {
    type: 'object',
    properties: { success: { type: 'boolean', example: true }, message: { type: 'string' } },
  },

  // Auth inputs / outputs
  SenderSignupInput: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email:    { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      fullName: { type: 'string' },
    },
  },
  EmailPasswordInput: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email:    { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  CourierSignupInput: {
    type: 'object',
    required: ['email', 'password', 'fullName', 'phone'],
    properties: {
      email:    { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      fullName: { type: 'string', minLength: 1 },
      phone:    { type: 'string', minLength: 5, example: '+250781234567' },
    },
  },
  PhoneInput: {
    type: 'object',
    required: ['phone'],
    properties: { phone: { type: 'string', example: '+250781234567' } },
  },
  PhoneExistsResponse: {
    type: 'object',
    properties: { exists: { type: 'boolean' } },
  },
  OtpRequestedResponse: {
    type: 'object',
    properties: {
      exists:   { type: 'boolean' },
      message:  { type: 'string' },
    },
  },
  VerifyOtpInput: {
    type: 'object',
    required: ['phone', 'token'],
    properties: {
      phone: { type: 'string', example: '+250781234567' },
      token: { type: 'string', description: '6-digit OTP from request-otp', example: '123456' },
    },
  },
  GoogleAuthInput: {
    type: 'object',
    required: ['email'],
    properties: {
      email:     { type: 'string', format: 'email' },
      fullName:  { type: 'string' },
      googleId:  { type: 'string' },
      avatarUrl: { type: 'string', format: 'url' },
    },
  },
  RefreshInput: {
    type: 'object',
    properties: { refresh_token: { type: 'string', description: 'Optional — falls back to the httpOnly cookie.' } },
  },
  RoleUpdateInput: {
    type: 'object',
    required: ['userId', 'role'],
    properties: {
      userId: { type: 'string', format: 'uuid' },
      role:   { type: 'string', enum: ['SENDER', 'COURIER', 'ADMIN'] },
    },
  },
  PasswordResetInput: {
    type: 'object',
    required: ['email'],
    properties: { email: { type: 'string', format: 'email' } },
  },
  PasswordUpdateInput: {
    type: 'object',
    required: ['newPassword'],
    properties: { newPassword: { type: 'string', minLength: 6 } },
  },
  Session: {
    type: 'object',
    properties: {
      id:         { type: 'string', format: 'uuid' },
      createdAt:  { type: 'string', format: 'date-time' },
      expiresAt:  { type: 'string', format: 'date-time' },
      token:      { type: 'string', description: 'Truncated refresh token' },
    },
  },
  SessionList: {
    type: 'array',
    items: schemaRef('Session'),
  },

  // Courier
  Courier: {
    type: 'object',
    properties: {
      id:                    { type: 'string', format: 'uuid' },
      userId:                { type: 'string', format: 'uuid' },
      nationalIdNumber:      { type: 'string', nullable: true },
      motorcyclePlate:       { type: 'string', nullable: true },
      associationCode:       { type: 'string', nullable: true },
      jacketSerialNumber:    { type: 'string', nullable: true },
      operatingZone:         { type: 'string', enum: ['Nyarugenge', 'Kicukiro', 'Gasabo'], nullable: true },
      selfieUrl:             { type: 'string', nullable: true },
      idPhotoUrl:            { type: 'string', nullable: true },
      licensePhotoUrl:       { type: 'string', nullable: true },
      verificationTier:      { type: 'string', enum: ['BASIC', 'IDENTITY', 'VEHICLE', 'TRUSTED'] },
      isApprovedByAdmin:     { type: 'boolean' },
      isOnline:              { type: 'boolean' },
      currentLat:            { type: 'number', nullable: true },
      currentLng:            { type: 'number', nullable: true },
      totalDeliveries:       { type: 'integer' },
      avgRating:             { type: 'number' },
      reliabilityScore:      { type: 'number', description: '0–100' },
      totalEarnings:         { type: 'number' },
      momoNumber:            { type: 'string', nullable: true },
      momoProvider:          { type: 'string', nullable: true },
      user:                  schemaRef('User'),
      createdAt:             { type: 'string', format: 'date-time' },
    },
  },
  CourierList: { type: 'array', items: schemaRef('Courier') },
  RegisterCourierInput: {
    type: 'object',
    properties: {
      fullName:         { type: 'string', description: 'Saved on the User record' },
      phone:            { type: 'string', description: 'Saved on the User record' },
      nationalIdNumber: { type: 'string' },
      motorcyclePlate:  { type: 'string' },
      momoNumber:       { type: 'string' },
      operatingZone:    { type: 'string', enum: ['Nyarugenge', 'Kicukiro', 'Gasabo'] },
    },
  },
  OnboardingStartInput: {
    type: 'object',
    properties: {
      fullName: { type: 'string' },
      phone:    { type: 'string' },
    },
  },
  OnboardingStartResponse: {
    type: 'object',
    properties: {
      created: { type: 'boolean' },
      session: schemaRef('OnboardingSession'),
    },
  },
  OnboardingSession: {
    type: 'object',
    properties: {
      id:                     { type: 'string', format: 'uuid' },
      userId:                 { type: 'string', format: 'uuid' },
      currentStep:            { type: 'integer' },
      totalSteps:             { type: 'integer' },
      isComplete:             { type: 'boolean' },
      isSubmitted:            { type: 'boolean' },
      fullName:               { type: 'string', nullable: true },
      phone:                  { type: 'string', nullable: true },
      nationalIdNumber:       { type: 'string', nullable: true },
      motorcyclePlate:        { type: 'string', nullable: true },
      operatingZone:          { type: 'string', nullable: true },
      momoNumber:             { type: 'string', nullable: true },
      momoProvider:           { type: 'string', nullable: true },
      emergencyContactName:   { type: 'string', nullable: true },
      emergencyContactPhone:  { type: 'string', nullable: true },
      selfieUrl:              { type: 'string', nullable: true },
      idPhotoUrl:             { type: 'string', nullable: true },
      licensePhotoUrl:        { type: 'string', nullable: true },
      vehiclePhotoFrontUrl:   { type: 'string', nullable: true },
      vehiclePhotoRearUrl:    { type: 'string', nullable: true },
      jacketPhotoUrl:         { type: 'string', nullable: true },
    },
  },
  OnboardingStatusResponse: {
    type: 'object',
    properties: {
      hasSession: { type: 'boolean' },
      session:    schemaRef('OnboardingSession'),
    },
  },
  OnboardingStepInput: {
    type: 'object',
    description: 'Step 2 = credentials (national ID, plate, momo, zone). Step 3 = document URLs. Fields are optional per call.',
    properties: {
      nationalIdNumber:       { type: 'string' },
      vehiclePlate:           { type: 'string', description: 'Alias for motorcyclePlate' },
      motorcyclePlate:        { type: 'string' },
      momoNumber:             { type: 'string' },
      momoProvider:           { type: 'string', enum: ['MTN', 'AIRTEL'] },
      jacketSerialNumber:     { type: 'string' },
      operatingZone:          { type: 'string', enum: ['Nyarugenge', 'Kicukiro', 'Gasabo'] },
      emergencyContactName:   { type: 'string' },
      emergencyContactPhone:  { type: 'string' },
      selfieUrl:              { type: 'string', format: 'url' },
      idPhotoUrl:             { type: 'string', format: 'url' },
      licensePhotoUrl:        { type: 'string', format: 'url' },
      vehiclePhotoFrontUrl:   { type: 'string', format: 'url' },
      vehiclePhotoRearUrl:    { type: 'string', format: 'url' },
      jacketPhotoUrl:         { type: 'string', format: 'url' },
      nationalIdDocumentUrl:  { type: 'string', format: 'url' },
      licenseDocumentUrl:     { type: 'string', format: 'url' },
      step:                   { type: 'integer', minimum: 1, maximum: 3 },
    },
  },
  OnboardingSubmitInput: {
    type: 'object',
    required: ['agreeToTerms'],
    properties: { agreeToTerms: { type: 'boolean' } },
  },
  UpdateCourierProfileInput: {
    type: 'object',
    properties: {
      emergencyContactName:  { type: 'string' },
      emergencyContactPhone: { type: 'string' },
      momoNumber:            { type: 'string' },
      momoProvider:          { type: 'string', enum: ['MTN', 'AIRTEL'] },
      operatingZone:         { type: 'string', enum: ['Nyarugenge', 'Kicukiro', 'Gasabo'] },
    },
  },
  ToggleOnlineInput: {
    type: 'object',
    required: ['isOnline'],
    properties: {
      isOnline: { type: 'boolean' },
      lat:      { type: 'number' },
      lng:      { type: 'number' },
    },
  },
  UpdateLocationInput: {
    type: 'object',
    required: ['lat', 'lng'],
    properties: {
      lat:      { type: 'number' },
      lng:      { type: 'number' },
      accuracy: { type: 'number' },
      heading:  { type: 'number' },
      speed:    { type: 'number' },
    },
  },
  EfficiencyScore: {
    type: 'object',
    properties: {
      reliabilityScore: { type: 'number', description: '0–100' },
      tier:             { type: 'string', enum: ['New', 'Learning', 'Active', 'Trusted', 'Premier'] },
      avgRating:        { type: 'number' },
      totalDeliveries:  { type: 'integer' },
      completedDeliveries: { type: 'integer' },
      cancelledDeliveries: { type: 'integer' },
      failedDeliveries:    { type: 'integer' },
      onTimeDeliveries:    { type: 'integer' },
    },
  },
  CourierEarnings: {
    type: 'object',
    properties: {
      totalEarnings: { type: 'number' },
      monthEarnings: { type: 'number' },
      weekEarnings:  { type: 'number' },
      todayEarnings: { type: 'number' },
      withdrawals:   { type: 'array', items: schemaRef('WithdrawalRequest') },
    },
  },
  CourierDashboard: {
    type: 'object',
    properties: {
      courier:        schemaRef('Courier'),
      activeJob:      schemaRef('Delivery'),
      todayEarnings:  { type: 'number' },
      monthEarnings:  { type: 'number' },
      todayDeliveries: { type: 'integer' },
      weekDeliveries: { type: 'integer' },
      monthDeliveries: { type: 'integer' },
      avgRating:      { type: 'number' },
      totalRatings:   { type: 'integer' },
    },
  },

  // Delivery
  DeliveryStatus: { type: 'string', enum: ['DRAFT', 'BROADCAST', 'COURIER_ASSIGNED', 'COURIER_CONFIRMED', 'PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF', 'DELIVERED', 'CANCELLED', 'DISPUTED', 'FAILED'] },
  PaymentStatus: { type: 'string', enum: ['PENDING', 'HELD', 'RELEASED', 'REFUNDED'] },
  Delivery: {
    type: 'object',
    properties: {
      id:                    { type: 'string', format: 'uuid' },
      trackingCode:          { type: 'string', example: 'DLV-2025-0001' },
      senderId:              { type: 'string', format: 'uuid' },
      courierId:             { type: 'string', format: 'uuid', nullable: true },
      pickupAddress:         { type: 'string' },
      pickupLat:             { type: 'number' },
      pickupLng:             { type: 'number' },
      dropoffAddress:        { type: 'string' },
      dropoffLat:            { type: 'number' },
      dropoffLng:            { type: 'number' },
      distanceKm:            { type: 'number', nullable: true },
      itemDescription:       { type: 'string' },
      category:              { type: 'string', enum: ['DOCUMENT', 'FOOD', 'ELECTRONICS', 'CLOTHING', 'PHARMACY', 'FRAGILE', 'OTHER'] },
      size:                  { type: 'string', enum: ['SMALL', 'MEDIUM', 'LARGE'] },
      isFragile:             { type: 'boolean' },
      requiresRecipientOtp:  { type: 'boolean' },
      pickupContactName:     { type: 'string' },
      pickupContactPhone:    { type: 'string' },
      recipientName:         { type: 'string' },
      recipientPhone:        { type: 'string' },
      quotedPriceRwf:        { type: 'number', minimum: 200 },
      agreedPriceRwf:        { type: 'number', nullable: true },
      agreedDeliveryTime:    { type: 'integer', nullable: true, description: 'Minutes, max 120' },
      paymentMethod:         { type: 'string', enum: ['CASH', 'MOBILE_MONEY', 'PLATFORM_BALANCE'] },
      paymentStatus:         schemaRef('PaymentStatus'),
      status:                schemaRef('DeliveryStatus'),
      broadcastExpiresAt:    { type: 'string', format: 'date-time', nullable: true },
      scheduledPickupAt:     { type: 'string', format: 'date-time', nullable: true },
      createdAt:             { type: 'string', format: 'date-time' },
      updatedAt:             { type: 'string', format: 'date-time' },
      sender:                schemaRef('User'),
      courier:               schemaRef('Courier'),
    },
  },
  DeliveryList: { type: 'array', items: schemaRef('Delivery') },
  CreateDeliveryInput: {
    type: 'object',
    required: ['pickupAddress', 'pickupLat', 'pickupLng', 'dropoffAddress', 'dropoffLat', 'dropoffLng', 'itemDescription', 'pickupContactName', 'pickupContactPhone', 'recipientName', 'recipientPhone'],
    properties: {
      pickupAddress:         { type: 'string' },
      pickupLat:             { type: 'number', description: 'Must be inside the Kigali bounding box' },
      pickupLng:             { type: 'number' },
      pickupNotes:           { type: 'string' },
      pickupEmail:           { type: 'string', format: 'email' },
      dropoffAddress:        { type: 'string' },
      dropoffLat:            { type: 'number', description: 'Must be inside the Kigali bounding box' },
      dropoffLng:            { type: 'number' },
      dropoffNotes:          { type: 'string' },
      dropoffEmail:          { type: 'string', format: 'email' },
      itemDescription:       { type: 'string' },
      category:              { type: 'string', enum: ['DOCUMENT', 'FOOD', 'ELECTRONICS', 'CLOTHING', 'PHARMACY', 'FRAGILE', 'OTHER'] },
      size:                  { type: 'string', enum: ['SMALL', 'MEDIUM', 'LARGE'] },
      estimatedValueRwf:     { type: 'number' },
      isFragile:             { type: 'boolean' },
      pickupContactName:     { type: 'string' },
      pickupContactPhone:    { type: 'string' },
      recipientName:         { type: 'string' },
      recipientPhone:        { type: 'string' },
      scheduledPickupAt:     { type: 'string', format: 'date-time' },
      preferAsap:            { type: 'boolean' },
      quotedPriceRwf:        { type: 'number', minimum: 200 },
      paymentMethod:         { type: 'string' },
      requiresRecipientOtp:  { type: 'boolean' },
    },
  },
  InterestInput: {
    type: 'object',
    properties: {
      proposedPriceRwf: { type: 'number' },
      etaMinutes:       { type: 'integer' },
    },
  },
  TakeJobInput: {
    type: 'object',
    properties: { proposedPriceRwf: { type: 'number' } },
  },
  ConfirmAgreementInput: {
    type: 'object',
    required: ['agreedPriceRwf'],
    properties: {
      agreedPriceRwf:     { type: 'number', minimum: 200 },
      agreedDeliveryTime: { type: 'integer', minimum: 1, maximum: 120 },
    },
  },
  PayDeliveryInput: {
    type: 'object',
    required: ['phoneNumber'],
    properties: {
      phoneNumber:         { type: 'string', minLength: 9, description: 'Sender MTN/Airtel number receiving the USSD pop-up', example: '0781234567' },
      provider:            { type: 'string', enum: ['MTN', 'AIRTEL'] },
      agreedDeliveryTime:  { type: 'integer', minimum: 1, maximum: 120 },
    },
  },
  OtpInput: {
    type: 'object',
    properties: { otp: { type: 'string', description: '6-digit OTP', example: '123456' } },
  },
  PayResponse: {
    type: 'object',
    properties: {
      success:       { type: 'boolean', example: true },
      status:        { type: 'string', example: 'PENDING' },
      provider:      { type: 'string', enum: ['MTN', 'AIRTEL'] },
      transactionId: { type: 'string' },
      amount:        { type: 'number' },
      message:       { type: 'string' },
      pollUrl:       { type: 'string', example: '/api/v1/wallet/payment-status/abc123' },
    },
  },
  PickupOtpResponse: {
    type: 'object',
    properties: { pickupOtp: { type: 'string', example: '123456' } },
  },
  DropoffOtpResponse: {
    type: 'object',
    properties: {
      dropoffOtp: { type: 'string', example: '123456' },
      message:    { type: 'string' },
    },
  },
  RateDeliveryInput: {
    type: 'object',
    required: ['stars'],
    properties: {
      stars:   { type: 'integer', minimum: 1, maximum: 5 },
      comment: { type: 'string' },
    },
  },

  // Wallet
  Wallet: {
    type: 'object',
    properties: {
      balance:      { type: 'number', description: 'RWF' },
      transactions: { type: 'array', items: schemaRef('WalletTransaction') },
      withdrawals:  { type: 'array', items: schemaRef('WithdrawalRequest') },
    },
  },
  WalletTransaction: {
    type: 'object',
    properties: {
      id:            { type: 'string', format: 'uuid' },
      walletId:      { type: 'string', format: 'uuid' },
      type:          { type: 'string', enum: ['credit', 'debit', 'fee', 'withdrawal', 'refund'] },
      description:   { type: 'string' },
      amount:        { type: 'number' },
      referenceType: { type: 'string' },
      referenceId:   { type: 'string' },
      status:        { type: 'string', enum: ['pending', 'completed', 'failed'] },
      createdAt:     { type: 'string', format: 'date-time' },
    },
  },
  WithdrawalRequest: {
    type: 'object',
    properties: {
      id:            { type: 'string', format: 'uuid' },
      walletId:      { type: 'string', format: 'uuid' },
      userId:        { type: 'string', format: 'uuid' },
      amount:        { type: 'number' },
      method:        { type: 'string' },
      provider:      { type: 'string', enum: ['MTN', 'AIRTEL'] },
      accountNumber: { type: 'string' },
      status:        { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
      reference:     { type: 'string' },
      createdAt:     { type: 'string', format: 'date-time' },
      updatedAt:     { type: 'string', format: 'date-time' },
    },
  },
  TopupInput: {
    type: 'object',
    required: ['amount'],
    properties: {
      amount:      { type: 'number', exclusiveMinimum: 0 },
      method:      { type: 'string' },
      phoneNumber: { type: 'string', description: 'Omit for direct credit (admin/test); provide for a real MoMo charge.' },
    },
  },
  WithdrawInput: {
    type: 'object',
    required: ['amount'],
    properties: {
      amount:        { type: 'number', exclusiveMinimum: 0 },
      method:        { type: 'string' },
      provider:      { type: 'string', enum: ['MTN', 'AIRTEL'], description: 'Auto-detected from accountNumber if omitted' },
      accountNumber: { type: 'string', minLength: 9, description: 'MoMo phone number receiving the payout' },
    },
  },
  TopupResponse: {
    type: 'object',
    properties: {
      success:       { type: 'boolean' },
      status:        { type: 'string' },
      message:       { type: 'string' },
      transactionId: { type: 'string' },
      pollUrl:       { type: 'string' },
    },
  },
  WithdrawResponse: {
    type: 'object',
    properties: {
      success:       { type: 'boolean' },
      status:        { type: 'string' },
      message:       { type: 'string' },
      withdrawalRequestId: { type: 'string' },
      transactionId: { type: 'string' },
    },
  },
  PaymentStatusResponse: {
    type: 'object',
    properties: {
      status:    { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'success'] },
      message:   { type: 'string' },
    },
  },
  WebhookInput: {
    type: 'object',
    properties: {
      transactionId:  { type: 'string' },
      referenceId:    { type: 'string' },
      status:         { type: 'string' },
      amount:         { type: 'number' },
      phoneNumber:    { type: 'string' },
      externalReference: { type: 'string' },
    },
  },
  WebhookResponse: {
    type: 'object',
    properties: {
      handled:         { type: 'boolean', example: true },
      alreadyProcessed: { type: 'boolean' },
      status:          { type: 'string' },
    },
  },

  // Refunds
  RefundRequest: {
    type: 'object',
    properties: {
      id:            { type: 'string', format: 'uuid' },
      deliveryId:    { type: 'string', format: 'uuid' },
      requestedById: { type: 'string', format: 'uuid' },
      amountRwf:     { type: 'number' },
      reason:        { type: 'string' },
      status:        { type: 'string', enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'] },
      phoneNumber:   { type: 'string' },
      provider:      { type: 'string', enum: ['MTN', 'AIRTEL'] },
      adminNote:     { type: 'string' },
      reviewedById:  { type: 'string' },
      reviewedAt:    { type: 'string', format: 'date-time' },
      disbursedAt:   { type: 'string', format: 'date-time' },
      transactionId: { type: 'string' },
      createdAt:     { type: 'string', format: 'date-time' },
      updatedAt:     { type: 'string', format: 'date-time' },
      delivery:      schemaRef('Delivery'),
      requestedBy:   schemaRef('User'),
    },
  },
  RefundRequestList: { type: 'array', items: schemaRef('RefundRequest') },
  RefundRequestInput: {
    type: 'object',
    required: ['reason', 'phoneNumber'],
    properties: {
      reason:      { type: 'string', minLength: 10 },
      phoneNumber: { type: 'string', minLength: 9, description: 'MoMo number to receive the refund' },
      provider:    { type: 'string', enum: ['MTN', 'AIRTEL'] },
    },
  },
  ApproveRefundInput: {
    type: 'object',
    properties: { adminNote: { type: 'string' } },
  },
  RejectRefundInput: {
    type: 'object',
    required: ['adminNote'],
    properties: { adminNote: { type: 'string', minLength: 5 } },
  },

  // Admin
  AdminDashboard: {
    type: 'object',
    properties: {
      activeDeliveries:     { type: 'integer' },
      onlineCouriers:       { type: 'integer' },
      completedToday:       { type: 'integer' },
      revenueToday:         { type: 'number' },
      revenueWeek:          { type: 'number' },
      revenueMonth:         { type: 'number' },
      totalCouriers:        { type: 'integer' },
      totalUsers:           { type: 'integer' },
      pendingVerifications: { type: 'integer' },
      disputesOpen:         { type: 'integer' },
      failedDeliveries:     { type: 'integer' },
      topCouriers:          { type: 'array', items: schemaRef('Courier') },
      recentActivities:     { type: 'array', items: { type: 'object' } },
    },
  },
  LiveMap: {
    type: 'object',
    properties: {
      activeDeliveries: { type: 'array', items: schemaRef('Delivery') },
      onlineCouriers:   { type: 'array', items: schemaRef('Courier') },
    },
  },
  PlatformRevenue: {
    type: 'object',
    properties: {
      balance:    { type: 'number', description: 'RWF available to withdraw' },
      totalFees:  { type: 'number', description: 'Cumulative service fees earned' },
      configured: { type: 'boolean', description: 'false when PLATFORM_WALLET_USER_ID is not set' },
    },
  },
  RevenueWithdrawInput: {
    type: 'object',
    required: ['amount', 'phoneNumber'],
    properties: {
      amount:      { type: 'number', exclusiveMinimum: 0 },
      phoneNumber: { type: 'string', minLength: 9 },
      provider:    { type: 'string', enum: ['MTN', 'AIRTEL'] },
    },
  },
  Dispute: {
    type: 'object',
    properties: {
      id:           { type: 'string', format: 'uuid' },
      deliveryId:   { type: 'string', format: 'uuid' },
      raisedById:   { type: 'string', format: 'uuid' },
      reason:       { type: 'string' },
      description:  { type: 'string' },
      evidenceUrls: { type: 'array', items: { type: 'string' } },
      status:       { type: 'string', enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED_SENDER', 'RESOLVED_COURIER', 'CLOSED'] },
      resolution:   { type: 'string' },
      resolvedAt:   { type: 'string', format: 'date-time' },
      createdAt:    { type: 'string', format: 'date-time' },
      updatedAt:    { type: 'string', format: 'date-time' },
      delivery:     schemaRef('Delivery'),
    },
  },
  DisputeList: { type: 'array', items: schemaRef('Dispute') },
  VerifyCourierInput: {
    type: 'object',
    required: ['approved'],
    properties: {
      approved:   { type: 'boolean' },
      tier:       { type: 'string', enum: ['BASIC', 'IDENTITY', 'VEHICLE', 'TRUSTED'] },
      adminNotes: { type: 'string' },
    },
  },
  SuspendCourierInput: {
    type: 'object',
    required: ['reason'],
    properties: { reason: { type: 'string' } },
  },
  AdminUserList: {
    type: 'array',
    items: schemaRef('User'),
  },
  UpdateDisputeInput: {
    type: 'object',
    properties: {
      status:     { type: 'string', enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED_SENDER', 'RESOLVED_COURIER', 'CLOSED'] },
      resolution: { type: 'string' },
    },
  },

  // Sender
  SenderDashboard: {
    type: 'object',
    properties: {
      totalSpent:    { type: 'number' },
      activeDeliveries: { type: 'integer' },
      savedAddresses: { type: 'string' },
      recentDeliveries: { type: 'array', items: schemaRef('Delivery') },
    },
  },

  // Tracking
  TrackingInfo: {
    type: 'object',
    properties: {
      id:                { type: 'string' },
      trackingCode:      { type: 'string' },
      status:            schemaRef('DeliveryStatus'),
      paymentStatus:     schemaRef('PaymentStatus'),
      pickupAddress:     { type: 'string' },
      dropoffAddress:    { type: 'string' },
      itemDescription:   { type: 'string' },
      courier:           { type: 'object', properties: { fullName: { type: 'string' }, phone: { type: 'string' }, currentLat: { type: 'number' }, currentLng: { type: 'number' }, lastLocationAt: { type: 'string', format: 'date-time' } } },
      events:            { type: 'array', items: { type: 'object' } },
    },
  },

  // Chat
  ChatMessage: {
    type: 'object',
    properties: {
      id:         { type: 'string', format: 'uuid' },
      deliveryId: { type: 'string', format: 'uuid' },
      senderId:   { type: 'string', format: 'uuid' },
      body:       { type: 'string' },
      content:    { type: 'string', description: 'Mobile alias for body' },
      photoUrl:   { type: 'string' },
      isTemplate: { type: 'boolean' },
      readAt:     { type: 'string', format: 'date-time' },
      sentAt:     { type: 'string', format: 'date-time' },
      sender:     schemaRef('User'),
    },
  },
  ChatMessageList: { type: 'array', items: schemaRef('ChatMessage') },
  SendMessageInput: {
    type: 'object',
    properties: {
      body:     { type: 'string', minLength: 1 },
      content:  { type: 'string', minLength: 1 },
      photoUrl: { type: 'string', format: 'url' },
    },
    description: 'Either body (web) or content (mobile) is required.',
  },
  Conversation: {
    type: 'object',
    properties: {
      id:             { type: 'string', format: 'uuid' },
      delivery:       schemaRef('Delivery'),
      otherUser:      schemaRef('User'),
      lastMessage:    schemaRef('ChatMessage'),
      unreadCount:    { type: 'integer' },
    },
  },
  ConversationList: { type: 'array', items: schemaRef('Conversation') },

  // Users
  UpdateUserInput: {
    type: 'object',
    properties: {
      fullName:        { type: 'string' },
      profilePhotoUrl: { type: 'string', format: 'url' },
    },
  },
  UploadPhotoInput: {
    type: 'object',
    required: ['photoUrl'],
    properties: { photoUrl: { type: 'string', format: 'url' } },
  },

  // Geocoding
  GeocodeBounds: {
    type: 'object',
    properties: {
      bounds: {
        type: 'object',
        properties: {
          minLat: { type: 'number', example: -2.08 },
          maxLat: { type: 'number', example: -1.82 },
          minLng: { type: 'number', example: 29.92 },
          maxLng: { type: 'number', example: 30.2 },
        },
      },
      districts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', enum: ['Nyarugenge', 'Gasabo', 'Kicukiro'] },
            lat:  { type: 'number' },
            lng:  { type: 'number' },
          },
        },
      },
    },
  },
  ResolveAddressInput: {
    type: 'object',
    required: ['address'],
    properties: { address: { type: 'string', minLength: 3 } },
  },
  ReverseGeocodeInput: {
    type: 'object',
    required: ['lat', 'lng'],
    properties: {
      lat: { type: 'number', minimum: -2.1, maximum: -1.8 },
      lng: { type: 'number', minimum: 29.9, maximum: 30.2 },
    },
  },
  GeocodeResult: {
    type: 'object',
    properties: {
      lat:      { type: 'number' },
      lng:      { type: 'number' },
      address:  { type: 'string' },
      district: { type: 'string', enum: ['Nyarugenge', 'Gasabo', 'Kicukiro'] },
    },
  },

  // Storage
  SignedUploadInput: {
    type: 'object',
    required: ['folder'],
    properties: {
      folder: {
        type: 'string',
        enum: ['selfies', 'id-photos', 'vehicle-photos', 'jacket-photos', 'license-photos', 'delivery-photos', 'avatars', 'courier-selfies', 'courier-documents'],
      },
      resource_type: { type: 'string', default: 'image' },
    },
  },
  SignedUpload: {
    type: 'object',
    properties: {
      uploadUrl: { type: 'string', description: 'POST the binary here with form fields' },
      publicUrl: { type: 'string', description: 'Public URL to persist' },
      folder:    { type: 'string' },
      expiresAt: { type: 'string', format: 'date-time' },
    },
  },
};

// ─── route enumeration ────────────────────────────────────────────────────────

function collectRoutes(routers: Record<string, Router>): RouteEntry[] {
  const out: RouteEntry[] = [];
  for (const [prefix, router] of Object.entries(routers)) {
    const stack = (router as unknown as { stack?: Array<{ route?: { methods: Record<string, boolean>; path: string } }> }).stack ?? [];
    for (const layer of stack) {
      if (!layer.route) continue;
      const methods = Object.keys(layer.route.methods);
      for (const method of methods) {
        if (method === 'all') continue;
        const fullPath = `${prefix}${layer.route.path}`.replace(/\/+/g, '/');
        const specPath = fullPath
          .replace(/^\/api\/v1/, '')
          .replace(/\/$/, '')               // strip trailing slash so '/deliveries' matches metadata
          .replace(/\/:([^/]+)/g, '/{$1}'); // express :param → OpenAPI {param}
        out.push({ method: method.toUpperCase(), fullPath, specPath });
      }
    }
  }
  return out;
}

// ─── operation builder ────────────────────────────────────────────────────────

function buildOperation(method: string, specPath: string): Record<string, unknown> {
  const key   = `${method} ${specPath}`;
  const meta  = META[key];
  const tag   = meta?.tags?.[0] ?? tagForPath(specPath);
  const isPub = !!meta?.public;

  const op: Record<string, unknown> = {
    tags:      meta?.tags ?? [tag],
    summary:   meta?.summary ?? fallbackSummary(method, specPath),
    security:  isPub ? [] : [{ bearerAuth: [] }],
    responses: standardResponses(meta?.responseStatus ?? 200, meta?.responseSchema, isPub),
  };
  if (meta?.description) op.description = meta.description;

  const parameters: Array<Record<string, unknown>> = [];

  const pathParams = specPath.match(/\{[^}]+\}/g) ?? [];
  for (const p of pathParams) {
    parameters.push({
      name: p.slice(1, -1), in: 'path', required: true,
      schema: { type: 'string' },
    });
  }
  if (meta?.queryParams) parameters.push(...meta.queryParams);
  if (parameters.length) op.parameters = parameters;

  if (meta?.requestBody) {
    op.requestBody = requestBody(meta.requestBody, meta.requestBodyRequired !== false);
  }

  return op;
}

function buildSpec(routers: Record<string, Router>): Record<string, unknown> {
  const paths: Record<string, unknown> = {};

  // Introspected router routes
  for (const route of collectRoutes(routers)) {
    const op = buildOperation(route.method, route.specPath);
    if (!paths[route.specPath]) paths[route.specPath] = {};
    (paths[route.specPath] as Record<string, unknown>)[route.method.toLowerCase()] = op;
  }

  // App-level routes not mounted through a router
  paths['/health'] = {
    get: {
      tags: ['System'],
      summary: 'Health check',
      security: [],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  };

  return {
    openapi: '3.0.3',
    info: {
      title: 'Delivery App API',
      version: '1.0.0',
      description: [
        'REST API for the Delivery App — a motorcycle delivery platform serving **Nyarugenge · Kicukiro · Gasabo** (Kigali, Rwanda).',
        '',
        '### Authentication',
        'Most endpoints require a **Bearer access token** from an `/auth/*/signin` (or `/auth/courier/verify-otp`) response.',
        'The token pair is **also set as httpOnly cookies** (`access_token` / `refresh_token`) on every auth response, so cookie-based clients work without headers.',
        '',
        '### Money & payments',
        '- MTN MoMo (`078x/079x`) and Airtel Money (`072x/073x`) are supported; the provider is auto-detected from the phone prefix.',
        '- Payments flow **USSD pop-up** → provider webhook → `paymentStatus: HELD`. Escrow is released on delivery completion.',
        '- Cancellation never auto-refunds — the sender must request a refund, which **only an admin can approve**.',
        '',
        '### Rate limits',
        'Global 200 req/min/IP. Auth 20/min, public 60/min, payment 10/min/user (admins exempt), admin 120/min/user. Over-limit requests return `429`.',
        '',
        '### WebSocket (path `/ws`)',
        'Authenticated via `socket.handshake.auth.token`. Live job dispatch (`job:available`), GPS relay, delivery status, and chat events. See `lib/socket.ts`.',
      ].join('\n'),
      contact: { name: 'Delivery App' },
    },
    servers: [
      { url: '/api/v1', description: 'API v1 (relative to current host)' },
      { url: 'http://localhost:3001/api/v1', description: 'Local dev' },
    ],
    tags: TAGS,
    security: [{ bearerAuth: [] }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token (1h) issued by /auth/*/signin or /auth/courier/verify-otp. Also accepted as the `access_token` httpOnly cookie.',
        },
      },
      schemas,
    },
  };
}

// ─── mounting ─────────────────────────────────────────────────────────────────

/**
 * Mounts the interactive Swagger UI at GET /api-docs and the raw OpenAPI
 * document at GET /api-docs.json. Call after all routes are registered.
 */
export function setupSwagger(app: Express, routers: Record<string, Router>): void {
  const spec = buildSpec(routers);

  app.get('/api-docs.json', (_req, res) => res.json(spec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec as never));
  console.log(`[Swagger] OpenAPI docs mounted at /api-docs (${Object.keys(spec.paths as Record<string, unknown>).length} paths)`);
}
