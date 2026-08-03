export enum UserRole {
  SENDER  = 'SENDER',
  COURIER = 'COURIER',
  ADMIN   = 'ADMIN',
}

export enum DeliveryStatus {
  DRAFT             = 'DRAFT',
  BROADCAST         = 'BROADCAST',
  COURIER_ASSIGNED  = 'COURIER_ASSIGNED',
  COURIER_CONFIRMED = 'COURIER_CONFIRMED',
  PICKUP_EN_ROUTE   = 'PICKUP_EN_ROUTE',
  ARRIVED_PICKUP    = 'ARRIVED_PICKUP',
  PICKED_UP         = 'PICKED_UP',
  IN_TRANSIT        = 'IN_TRANSIT',
  ARRIVED_DROPOFF   = 'ARRIVED_DROPOFF',
  DELIVERED         = 'DELIVERED',
  CANCELLED         = 'CANCELLED',
  DISPUTED          = 'DISPUTED',
  FAILED            = 'FAILED',
}

export enum EventType {
  DELIVERY_CREATED        = 'DELIVERY_CREATED',
  BROADCAST_SENT          = 'BROADCAST_SENT',
  COURIER_INTERESTED      = 'COURIER_INTERESTED',
  COURIER_SELECTED        = 'COURIER_SELECTED',
  COURIER_CONFIRMED       = 'COURIER_CONFIRMED',
  COURIER_DEPARTED_PICKUP = 'COURIER_DEPARTED_PICKUP',
  COURIER_ARRIVED_PICKUP  = 'COURIER_ARRIVED_PICKUP',
  PICKUP_OTP_SENT         = 'PICKUP_OTP_SENT',
  PICKUP_OTP_CONFIRMED    = 'PICKUP_OTP_CONFIRMED',
  PACKAGE_PICKED_UP       = 'PACKAGE_PICKED_UP',
  PACKAGE_IN_TRANSIT      = 'PACKAGE_IN_TRANSIT',
  LOCATION_UPDATE         = 'LOCATION_UPDATE',
  COURIER_ARRIVED_DROPOFF = 'COURIER_ARRIVED_DROPOFF',
  DROPOFF_OTP_SENT        = 'DROPOFF_OTP_SENT',
  DROPOFF_OTP_CONFIRMED   = 'DROPOFF_OTP_CONFIRMED',
  DELIVERY_COMPLETED      = 'DELIVERY_COMPLETED',
  DELIVERY_CANCELLED      = 'DELIVERY_CANCELLED',
  DISPUTE_RAISED          = 'DISPUTE_RAISED',
  DISPUTE_RESOLVED        = 'DISPUTE_RESOLVED',
  CHAT_MESSAGE_SENT       = 'CHAT_MESSAGE_SENT',
}

// Augment Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        email?: string | null;
        phone?: string | null;
        fullName?: string | null;
        isActive: boolean;
      };
    }
  }
}
