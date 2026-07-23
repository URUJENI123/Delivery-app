/**
 * Central mock data store used by lib/api.ts (dev mode).
 * Replace with real backend calls when ready.
 */

export const MOCK_DB = {
  // ── USERS ────────────────────────────────────────────────────────────
  adminUser: {
    id: 'admin-001',
    supabaseId: 'sb-admin-001',
    email: 'admin@delivery.rw',
    fullName: 'Admin User',
    role: 'ADMIN',
    emailVerified: true,
    phoneVerified: false,
    phone: null,
    profilePhotoUrl: null,
    courierProfile: null,
    onboardingSession: null,
  },

  senderUser: {
    id: 'sender-001',
    supabaseId: 'sb-sender-001',
    email: 'alice@example.com',
    fullName: 'Alice Uwimana',
    role: 'SENDER',
    emailVerified: true,
    phoneVerified: false,
    phone: '+250780000001',
    profilePhotoUrl: null,
    courierProfile: null,
    onboardingSession: null,
  },

  courierUser: {
    id: 'courier-001',
    supabaseId: 'sb-courier-001',
    email: null,
    fullName: 'Bob Mugisha',
    role: 'COURIER',
    emailVerified: false,
    phoneVerified: true,
    phone: '+250780000002',
    profilePhotoUrl: null,
    courierProfile: {
      id: 'cp-001',
      verificationTier: 'Verified',
      isApprovedByAdmin: true,
      isOnline: true,
    },
    onboardingSession: null,
  },

  // current user (shown to /auth/me) — default to admin for dashboard access
  get currentUser() {
    if (typeof window === 'undefined') return MOCK_DB.adminUser;
    const token = localStorage.getItem('access_token');
    if (!token || token === 'dev-bypass-token') return MOCK_DB.adminUser;
    return MOCK_DB.adminUser;
  },

  // ── USERS LIST ───────────────────────────────────────────────────────
  users: [
    { id: 'sender-001', fullName: 'Alice Uwimana', phone: '+250780000001', role: 'SENDER', isActive: true, createdAt: '2025-01-10T08:00:00Z' },
    { id: 'courier-001', fullName: 'Bob Mugisha', phone: '+250780000002', role: 'COURIER', isActive: true, createdAt: '2025-01-12T09:00:00Z' },
    { id: 'sender-002', fullName: 'Claire Ingabire', phone: '+250780000003', role: 'SENDER', isActive: true, createdAt: '2025-02-01T10:00:00Z' },
    { id: 'courier-002', fullName: 'David Nkurunziza', phone: '+250780000004', role: 'COURIER', isActive: false, createdAt: '2025-02-15T11:00:00Z' },
    { id: 'sender-003', fullName: 'Emma Iradukunda', phone: '+250780000005', role: 'SENDER', isActive: true, createdAt: '2025-03-05T07:30:00Z' },
  ],

  // ── COURIERS ─────────────────────────────────────────────────────────
  couriers: [
    {
      id: 'cp-001',
      user: { id: 'courier-001', fullName: 'Bob Mugisha', phone: '+250780000002' },
      verificationTier: 'Verified',
      isApprovedByAdmin: true,
      isOnline: true,
      totalDeliveries: 142,
      avgRating: 4.8,
      motorcyclePlate: 'RAB 123A',
      currentLat: -1.9441,
      currentLng: 30.0619,
    },
    {
      id: 'cp-002',
      user: { id: 'courier-002', fullName: 'David Nkurunziza', phone: '+250780000004' },
      verificationTier: 'Basic',
      isApprovedByAdmin: false,
      isOnline: false,
      totalDeliveries: 0,
      avgRating: 0,
      motorcyclePlate: 'RAC 456B',
      currentLat: null,
      currentLng: null,
    },
    {
      id: 'cp-003',
      user: { id: 'courier-003', fullName: 'Eric Habimana', phone: '+250780000006' },
      verificationTier: 'Basic',
      isApprovedByAdmin: false,
      isOnline: false,
      totalDeliveries: 0,
      avgRating: 0,
      motorcyclePlate: 'RAD 789C',
      currentLat: null,
      currentLng: null,
    },
  ],

  // ── DELIVERIES ───────────────────────────────────────────────────────
  deliveries: [
    {
      id: 'del-001',
      trackingCode: 'DLV-2025-001',
      status: 'IN_TRANSIT',
      paymentStatus: 'HELD',
      pickupAddress: 'Kacyiru, Kigali',
      dropoffAddress: 'Kimironko Market, Kigali',
      pickupLat: -1.9355,
      pickupLng: 30.0928,
      dropoffLat: -1.9273,
      dropoffLng: 30.1146,
      itemDescription: 'Electronics',
      quotedPriceRwf: 3500,
      finalPriceRwf: 3500,
      agreedPriceRwf: 3500,
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      updatedAt: new Date().toISOString(),
      sender: { id: 'sender-001', fullName: 'Alice Uwimana', phone: '+250780000001', email: 'alice@example.com' },
      courier: { id: 'courier-001', fullName: 'Bob Mugisha', phone: '+250780000002', profilePhotoUrl: null, motorcyclePlate: 'RAB 123A' },
    },
    {
      id: 'del-002',
      trackingCode: 'DLV-2025-002',
      status: 'BROADCAST',
      paymentStatus: 'PENDING',
      pickupAddress: 'Nyamirambo, Kigali',
      dropoffAddress: 'Gisozi, Kigali',
      pickupLat: -1.9706,
      pickupLng: 30.0378,
      dropoffLat: -1.9122,
      dropoffLng: 30.0719,
      itemDescription: 'Documents',
      quotedPriceRwf: 2000,
      finalPriceRwf: null,
      agreedPriceRwf: null,
      createdAt: new Date(Date.now() - 1800_000).toISOString(),
      updatedAt: new Date().toISOString(),
      sender: { id: 'sender-002', fullName: 'Claire Ingabire', phone: '+250780000003', email: 'claire@example.com' },
      courier: null,
    },
    {
      id: 'del-003',
      trackingCode: 'DLV-2025-003',
      status: 'DELIVERED',
      paymentStatus: 'RELEASED',
      pickupAddress: 'Remera, Kigali',
      dropoffAddress: 'Kicukiro, Kigali',
      pickupLat: -1.9553,
      pickupLng: 30.1122,
      dropoffLat: -2.0052,
      dropoffLng: 30.0956,
      itemDescription: 'Clothing',
      quotedPriceRwf: 2800,
      finalPriceRwf: 2800,
      agreedPriceRwf: 2800,
      createdAt: new Date(Date.now() - 86400_000).toISOString(),
      updatedAt: new Date(Date.now() - 72000_000).toISOString(),
      sender: { id: 'sender-001', fullName: 'Alice Uwimana', phone: '+250780000001', email: 'alice@example.com' },
      courier: { id: 'courier-001', fullName: 'Bob Mugisha', phone: '+250780000002', profilePhotoUrl: null, motorcyclePlate: 'RAB 123A' },
    },
    {
      id: 'del-004',
      trackingCode: 'DLV-2025-004',
      status: 'COURIER_ASSIGNED',
      paymentStatus: 'PENDING',
      pickupAddress: 'Gikondo, Kigali',
      dropoffAddress: 'Kibagabaga, Kigali',
      pickupLat: -1.9783,
      pickupLng: 30.0756,
      dropoffLat: -1.9188,
      dropoffLng: 30.1207,
      itemDescription: 'Food',
      quotedPriceRwf: 1500,
      finalPriceRwf: null,
      agreedPriceRwf: null,
      createdAt: new Date(Date.now() - 900_000).toISOString(),
      updatedAt: new Date().toISOString(),
      sender: { id: 'sender-003', fullName: 'Emma Iradukunda', phone: '+250780000005', email: 'emma@example.com' },
      courier: { id: 'courier-001', fullName: 'Bob Mugisha', phone: '+250780000002', profilePhotoUrl: null, motorcyclePlate: 'RAB 123A' },
    },
  ],

  // ── DISPUTES ─────────────────────────────────────────────────────────
  disputes: [
    {
      id: 'disp-001',
      deliveryId: 'del-003',
      delivery: { trackingCode: 'DLV-2025-003' },
      reason: 'Package arrived damaged',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 43200_000).toISOString(),
    },
  ],

  // ── MESSAGES ─────────────────────────────────────────────────────────
  messages: [
    { id: 'msg-001', senderId: 'courier-001', text: 'I am on my way to the pickup point', createdAt: new Date(Date.now() - 1200_000).toISOString(), isSender: false },
    { id: 'msg-002', senderId: 'sender-001', text: 'Great, I will be ready!', createdAt: new Date(Date.now() - 1100_000).toISOString(), isSender: true },
    { id: 'msg-003', senderId: 'courier-001', text: 'Arrived at pickup. Please come down.', createdAt: new Date(Date.now() - 600_000).toISOString(), isSender: false },
  ],

  // ── WALLET ───────────────────────────────────────────────────────────
  wallet: {
    balance: 45000,
    transactions: [
      { id: 'tx-001', type: 'credit', description: 'Delivery payout #DLV-2025-003', amount: 2700, date: new Date(Date.now() - 86400_000).toISOString(), status: 'completed' },
      { id: 'tx-002', type: 'debit', description: 'Withdrawal to MoMo', amount: 10000, date: new Date(Date.now() - 172800_000).toISOString(), status: 'completed' },
      { id: 'tx-003', type: 'credit', description: 'Delivery payout #DLV-2025-001', amount: 3400, date: new Date(Date.now() - 259200_000).toISOString(), status: 'completed' },
      { id: 'tx-004', type: 'fee', description: 'Service fee', amount: 100, date: new Date(Date.now() - 259200_000).toISOString(), status: 'completed' },
    ],
  },

  // ── ADMIN DASHBOARD ──────────────────────────────────────────────────
  adminDashboard: {
    activeDeliveries: 2,
    onlineCouriers: 1,
    completedToday: 1,
    revenueToday: 3500,
    revenueWeek: 24500,
    revenueMonth: 98000,
    totalCouriers: 3,
    totalUsers: 5,
    pendingVerifications: 2,
    disputesOpen: 1,
    failedDeliveries: 0,
    topCouriers: [
      { id: 'cp-001', user: { fullName: 'Bob Mugisha' }, motorcyclePlate: 'RAB 123A', totalDeliveries: 142, avgRating: 4.8 },
    ],
    recentActivities: [
      { id: 'act-001', eventType: 'DELIVERY_CREATED', user: { fullName: 'Alice Uwimana' }, delivery: { trackingCode: 'DLV-2025-004' }, occurredAt: new Date().toISOString() },
      { id: 'act-002', eventType: 'COURIER_ASSIGNED', user: { fullName: 'Bob Mugisha' }, delivery: { trackingCode: 'DLV-2025-004' }, occurredAt: new Date(Date.now() - 300_000).toISOString() },
      { id: 'act-003', eventType: 'DELIVERED', user: { fullName: 'Bob Mugisha' }, delivery: { trackingCode: 'DLV-2025-003' }, occurredAt: new Date(Date.now() - 86400_000).toISOString() },
    ],
  },

  // ── SENDER DASHBOARD ─────────────────────────────────────────────────
  senderDashboard: {
    totalSpent: 8300,
    savedAddresses: 'Kacyiru, KG 7 Ave, Kigali',
  },

  // ── COURIER DASHBOARD ────────────────────────────────────────────────
  courierDashboard: {
    courier: {
      id: 'cp-001',
      isOnline: true,
      completionRate: 0.97,
      totalDeliveries: 142,
      totalEarnings: 380000,
    },
    activeJob: null,
    todayEarnings: 10500,
    monthEarnings: 98000,
    todayDeliveries: 3,
    weekDeliveries: 18,
    monthDeliveries: 62,
    avgRating: 4.8,
    totalRatings: 137,
  },
};
