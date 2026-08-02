import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'

// ─── Root Stack Param List ────────────────────────────────────────────────────
export type RootStackParamList = {
  // Auth
  Login: undefined
  Signup: undefined
  OtpVerify: { phone: string }
  Onboarding: undefined

  // Sender
  SenderDashboard: undefined
  CreateDelivery: undefined
  DeliveryDetail: { id: string }
  Track: { id: string }
  SenderWallet: undefined
  SenderMessages: undefined

  // Courier
  CourierDashboard: undefined
  AvailableJobs: undefined
  JobDetail: { id: string }
  LiveTracking: { deliveryId: string }
  CourierEarnings: undefined
  CourierProfile: undefined

  // Shared
  Chat: { id: string; name: string; orderTag?: string }
  Wallet: undefined
  Profile: undefined
  Settings: undefined
  Support: undefined
}

// ─── Screen Navigation Props ──────────────────────────────────────────────────
export type LiveTrackingProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LiveTracking'>
  route: RouteProp<RootStackParamList, 'LiveTracking'>
}

export type ChatProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>
  route: RouteProp<RootStackParamList, 'Chat'>
}

export type JobDetailProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JobDetail'>
  route: RouteProp<RootStackParamList, 'JobDetail'>
}

export type DeliveryDetailProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeliveryDetail'>
  route: RouteProp<RootStackParamList, 'DeliveryDetail'>
}

// ─── Domain Types ─────────────────────────────────────────────────────────────
export type UserRole = 'SENDER' | 'COURIER' | 'ADMIN'

export type DeliveryStatus =
  | 'DRAFT'
  | 'BROADCAST'
  | 'COURIER_ASSIGNED'
  | 'COURIER_CONFIRMED'
  | 'PICKUP_EN_ROUTE'
  | 'ARRIVED_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED_DROPOFF'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'FAILED'

export type PaymentStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED'

export interface User {
  id: string
  supabaseId: string
  email?: string
  phone?: string
  fullName: string
  role: UserRole
  profilePhotoUrl?: string
  isActive: boolean
}

export interface Delivery {
  id: string
  senderId: string
  courierId?: string
  status: DeliveryStatus
  paymentStatus: PaymentStatus
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropoffAddress: string
  dropoffLat: number
  dropoffLng: number
  recipientName: string
  recipientPhone: string
  dropoffEmail?: string
  agreedPriceRwf?: number
  finalPriceRwf?: number
  recipientTrackingToken: string
  createdAt: string
  deliveredAt?: string
}

export interface CourierLocation {
  lat: number
  lng: number
  accuracy?: number
  heading?: number
  speed?: number
}
