export enum UserRole {
  SENDER = 'SENDER',
  COURIER = 'COURIER',
  ADMIN = 'ADMIN',
}

export enum CourierVerificationTier {
  BASIC = 'BASIC',
  IDENTITY = 'IDENTITY',
  VEHICLE = 'VEHICLE',
  TRUSTED = 'TRUSTED',
}

export enum DeliveryStatus {
  DRAFT = 'DRAFT',
  BROADCAST = 'BROADCAST',
  COURIER_ASSIGNED = 'COURIER_ASSIGNED',
  COURIER_CONFIRMED = 'COURIER_CONFIRMED',
  PICKUP_EN_ROUTE = 'PICKUP_EN_ROUTE',
  ARRIVED_PICKUP = 'ARRIVED_PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_DROPOFF = 'ARRIVED_DROPOFF',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  FAILED = 'FAILED',
}

export enum PackageCategory {
  DOCUMENT = 'DOCUMENT',
  FOOD = 'FOOD',
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',
  PHARMACY = 'PHARMACY',
  FRAGILE = 'FRAGILE',
  OTHER = 'OTHER',
}

export enum PackageSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  PLATFORM_BALANCE = 'PLATFORM_BALANCE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED_SENDER = 'RESOLVED_SENDER',
  RESOLVED_COURIER = 'RESOLVED_COURIER',
  CLOSED = 'CLOSED',
}

export enum EventType {
  DELIVERY_CREATED = 'DELIVERY_CREATED',
  BROADCAST_SENT = 'BROADCAST_SENT',
  COURIER_INTERESTED = 'COURIER_INTERESTED',
  COURIER_SELECTED = 'COURIER_SELECTED',
  COURIER_CONFIRMED = 'COURIER_CONFIRMED',
  COURIER_DEPARTED_PICKUP = 'COURIER_DEPARTED_PICKUP',
  COURIER_ARRIVED_PICKUP = 'COURIER_ARRIVED_PICKUP',
  PICKUP_OTP_SENT = 'PICKUP_OTP_SENT',
  PICKUP_OTP_CONFIRMED = 'PICKUP_OTP_CONFIRMED',
  PACKAGE_PICKED_UP = 'PACKAGE_PICKED_UP',
  PACKAGE_IN_TRANSIT = 'PACKAGE_IN_TRANSIT',
  LOCATION_UPDATE = 'LOCATION_UPDATE',
  COURIER_ARRIVED_DROPOFF = 'COURIER_ARRIVED_DROPOFF',
  DROPOFF_OTP_SENT = 'DROPOFF_OTP_SENT',
  DROPOFF_OTP_CONFIRMED = 'DROPOFF_OTP_CONFIRMED',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  DELIVERY_CANCELLED = 'DELIVERY_CANCELLED',
  DISPUTE_RAISED = 'DISPUTE_RAISED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  CHAT_MESSAGE_SENT = 'CHAT_MESSAGE_SENT',
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role: UserRole;
  profilePhotoUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  courierProfile?: Courier;
  senderProfile?: SenderProfile;
  onboardingSession?: OnboardingSession;
}

export interface SenderProfile {
  id: string;
  userId: string;
  businessName?: string;
  businessType?: string;
  defaultPickupAddress?: string;
  preferredContactMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingSession {
  id: string;
  userId: string;
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  isSubmitted: boolean;
  fullName?: string;
  email?: string;
  phone?: string;
  nationalIdNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  motorcyclePlate?: string;
  associationCode?: string;
  jacketSerialNumber?: string;
  operatingZone?: string;
  momoNumber?: string;
  momoProvider?: string;
  selfieUrl?: string;
  idPhotoUrl?: string;
  vehiclePhotoFrontUrl?: string;
  vehiclePhotoRearUrl?: string;
  licensePhotoUrl?: string;
  jacketPhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Courier {
  id: string;
  userId: string;
  nationalIdNumber?: string;
  motorcyclePlate?: string;
  associationCode?: string;
  jacketSerialNumber?: string;
  operatingZone?: string;
  selfieUrl?: string;
  idPhotoUrl?: string;
  vehiclePhotoFrontUrl?: string;
  vehiclePhotoRearUrl?: string;
  licensePhotoUrl?: string;
  jacketPhotoUrl?: string;
  verificationTier: CourierVerificationTier;
  isApprovedByAdmin: boolean;
  adminNotes?: string;
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  lastLocationAt?: string;
  totalDeliveries: number;
  completionRate: number;
  avgRating: number;
  reliabilityScore: number;
  totalEarnings: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  momoNumber?: string;
  momoProvider?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface CourierLocation {
  id: string;
  courierId: string;
  deliveryId?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  recordedAt: string;
}

export interface Delivery {
  id: string;
  trackingCode: string;
  senderId: string;
  courierId?: string;
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
  distanceKm?: number;
  itemDescription: string;
  category: PackageCategory;
  size: PackageSize;
  estimatedValueRwf?: number;
  isFragile: boolean;
  requiresRecipientOtp: boolean;
  pickupContactName: string;
  pickupContactPhone: string;
  recipientName: string;
  recipientPhone: string;
  scheduledPickupAt?: string;
  preferAsap: boolean;
  quotedPriceRwf?: number;
  finalPriceRwf?: number;
  agreedPriceRwf?: number;
  agreedDeliveryTime?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentHeldAt?: string;
  paymentReleasedAt?: string;
  pickupOtpHash?: string;
  dropoffOtpHash?: string;
  otpVerifiedAt?: string;
  recipientTrackingToken?: string;
  status: DeliveryStatus;
  broadcastExpiresAt?: string;
  assignmentExpiresAt?: string;
  deliveryStartedAt?: string;
  courierArrivedAt?: string;
  dropoffOtpSentAt?: string;
  pickupPhotoUrl?: string;
  dropoffPhotoUrl?: string;
  recipientSignatureUrl?: string;
  createdAt: string;
  updatedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  sender?: Partial<User>;
  courier?: Partial<Courier>;
  events?: DeliveryEvent[];
  interests?: CourierInterest[];
  chatMessages?: ChatMessage[];
  dispute?: Dispute;
  rating?: Rating;
}

export interface CourierInterest {
  id: string;
  deliveryId: string;
  courierId: string;
  proposedPriceRwf?: number;
  etaMinutes?: number;
  expressedAt: string;
  isSelected: boolean;
  courier?: Partial<Courier>;
}

export interface DeliveryEvent {
  id: string;
  deliveryId: string;
  userId?: string;
  eventType: EventType;
  metadata?: any;
  lat?: number;
  lng?: number;
  occurredAt: string;
}

export interface ChatMessage {
  id: string;
  deliveryId: string;
  senderId: string;
  body: string;
  photoUrl?: string;
  isTemplate: boolean;
  readAt?: string;
  sentAt: string;
  sender?: Partial<User>;
}

export interface Rating {
  id: string;
  deliveryId: string;
  giverId: string;
  receiverId: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  deliveryId: string;
  raisedById: string;
  reason: string;
  description?: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
