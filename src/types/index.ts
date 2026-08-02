import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

export type RootStackParamList = {
  Splash: undefined
  Login: undefined
  DeliveryLanding: undefined
  SenderDashboard: undefined
  CourierDashboard: undefined
  LiveTracking: undefined
  CourierOnboardingStep1: { isSender?: boolean } | undefined
  CourierOnboardingStep2: undefined
  CourierOnboardingStep3: undefined
  PendingApproval: undefined
  SendPackage: undefined
  PackageDetails: undefined
  OrderHistory: undefined
  Wallet: undefined
  ConfirmWithdraw: undefined
  WithdrawSuccess: undefined
  VehicleManagement: undefined
  Support: undefined
  Chat: { id: string; name: string; avatar?: string; orderTag?: string }
  PersonalDetails: undefined
  PickupOTP: { phone?: string; deliveryId: string }
  DeliveryInfo: {
    orderId: string
    pickup: string
    dropoff: string
    totalDistance: string
    eta: string
    note?: string
    senderPhone?: string
  }
  Settings: undefined
  JobsMap: undefined
  PaymentMethod: undefined
  Notifications: undefined
  DeliveriesMap: undefined
}

export type RootTabParamList = {
  Dashboard: undefined
  Jobs: { isCourier?: boolean } | undefined
  Deliveries: undefined
  Messages: undefined
  Profile: { isCourier?: boolean } | undefined
}

export type CourierTabParamList = {
  CourierHome: undefined
  CourierJobs: { isCourier?: boolean } | undefined
  CourierOrders: undefined
  CourierMessages: undefined
  CourierProfile: { isCourier?: boolean } | undefined
}

export type SplashScreenProps = NativeStackScreenProps<RootStackParamList, 'Splash'>
export type SenderDashboardProps = NativeStackScreenProps<RootStackParamList, 'SenderDashboard'>
export type CourierDashboardProps = NativeStackScreenProps<RootStackParamList, 'CourierDashboard'>
export type LiveTrackingProps = NativeStackScreenProps<RootStackParamList, 'LiveTracking'>
