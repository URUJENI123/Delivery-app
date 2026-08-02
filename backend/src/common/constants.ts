export const R2_FOLDERS = {
  PROFILE_PHOTOS: 'profiles',
  COURIER_DOCUMENTS: 'courier-documents',
  DELIVERY_PHOTOS: 'delivery-photos',
  CHAT_PHOTOS: 'chat-photos',
} as const;

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '30', 10);
export const BROADCAST_RADIUS_KM = parseInt(process.env.BROADCAST_RADIUS_KM || '5', 10);
export const BROADCAST_WINDOW_SECONDS = parseInt(process.env.BROADCAST_WINDOW_SECONDS || '90', 10);
export const COURIER_CONFIRM_TIMEOUT_SECONDS = parseInt(process.env.COURIER_CONFIRM_TIMEOUT_SECONDS || '30', 10);

export const STATUS_BADGE_COLORS: Record<string, string> = {
  BROADCAST: 'bg-amber-100 text-amber-800',
  COURIER_ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-red-50 text-red-700',
  IN_TRANSIT: 'bg-red-700 text-white',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  DISPUTED: 'bg-red-100 text-red-700',
};
