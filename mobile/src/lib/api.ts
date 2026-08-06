/**
 * Typed HTTP client for the Delivery-app backend.
 * Automatically injects the Bearer token, refreshes on 401, and throws ApiError.
 */
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearSession } from './storage'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Internal: do a single fetch, attaching the token */
async function rawFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${BASE}${path}`, { ...options, headers })
}

/** Callback invoked when session is definitively expired (no valid refresh) */
let _onSessionExpired: (() => void) | null = null
export function setSessionExpiredHandler(fn: () => void) {
  _onSessionExpired = fn
}

/** Core request — handles 401 token refresh and error parsing */
export async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let res = await rawFetch(path, options)

  if (res.status === 401) {
    // Try to refresh the token once
    const refreshToken = await getRefreshToken()
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          await setAccessToken(data.accessToken)
          await setRefreshToken(data.refreshToken)
          // Retry original request with new token
          res = await rawFetch(path, options)
        } else {
          await clearSession()
          _onSessionExpired?.()
          throw new ApiError(401, 'Session expired')
        }
      } catch (err) {
        if (err instanceof ApiError) throw err
        await clearSession()
        _onSessionExpired?.()
        throw new ApiError(401, 'Session expired')
      }
    } else {
      await clearSession()
      _onSessionExpired?.()
      throw new ApiError(401, 'Session expired')
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.error ?? body?.message ?? message
    } catch {
      // use default message
    }
    throw new ApiError(res.status, message)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ── Convenience wrappers ───────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// ── Auth endpoints ─────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email?: string | null
    phone?: string | null
    fullName?: string | null
    role: 'SENDER' | 'COURIER' | 'ADMIN'
    avatarUrl?: string | null
  }
}

export const authApi = {
  senderSignin: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/sender/signin', { email, password }),

  senderSignup: (email: string, password: string, fullName?: string) =>
    api.post<AuthResponse>('/auth/sender/signup', { email, password, fullName }),

  adminSignin: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/admin/signin', { email, password }),

  checkPhone: (phone: string) =>
    api.post<{ exists: boolean }>('/auth/courier/check-phone', { phone }),

  requestOtp: (phone: string) =>
    api.post<{ message: string }>('/auth/courier/request-otp', { phone }),

  verifyOtp: (phone: string, token: string) =>
    api.post<AuthResponse & { needsOnboarding: boolean }>('/auth/courier/verify-otp', { phone, token }),

  me: () => api.get<AuthResponse['user']>('/auth/me'),

  logout: () => api.post<void>('/auth/logout'),

  updatePassword: (newPassword: string) =>
    api.post<void>('/auth/password/update', { newPassword }),
}

// ── Courier onboarding endpoints ───────────────────────────────────────────────

export interface OnboardingStatus {
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
  step?: number
  data?: Record<string, unknown>
}

export const courierApi = {
  onboardingStart: (data: { fullName?: string; phone?: string }) =>
    api.post<unknown>('/couriers/onboarding/start', data),

  onboardingStep: (data: Record<string, unknown>) =>
    api.put<unknown>('/couriers/onboarding/step', data),

  onboardingStatus: () => api.get<OnboardingStatus>('/couriers/onboarding/status'),

  onboardingSubmit: () => api.post<unknown>('/couriers/onboarding/submit', { agreeToTerms: true }),

  me: () => api.get<{
    id: string; fullName: string; phone: string; email?: string
    isOnline: boolean; currentLat?: number; currentLng?: number
    avgRating?: number; totalDeliveries: number
    vehiclePlate?: string; jacketNumber?: string
  }>('/couriers/me'),

  updateMe: (data: Record<string, unknown>) =>
    api.put<unknown>('/couriers/me', data),

  setOnline: (isOnline: boolean, lat?: number, lng?: number) =>
    api.put<unknown>('/couriers/me/online', { isOnline, lat, lng }),

  updateLocation: (lat: number, lng: number, accuracy?: number) =>
    api.put<unknown>('/couriers/me/location', { lat, lng, accuracy }),

  jobs: () => api.get<unknown[]>('/couriers/me/jobs'),

  earnings: () => api.get<{ total: number; today: number; thisWeek: number }>('/couriers/me/earnings'),

  dashboard: () => api.get<{
    totalEarnings: number; todayEarnings: number; totalDeliveries: number; isOnline: boolean
  }>('/couriers/dashboard'),
}

// ── Delivery endpoints ─────────────────────────────────────────────────────────

export interface DeliveryBrief {
  id: string
  status: string
  paymentStatus: string
  pickupAddress: string
  dropoffAddress: string
  pickupLat?: number; pickupLng?: number
  dropoffLat?: number; dropoffLng?: number
  agreedPriceRwf?: number
  createdAt: string
  courier?: { id: string; fullName: string; phone: string; avgRating?: number; vehiclePlate?: string }
  sender?: { id: string; fullName: string; email?: string }
}

export const deliveryApi = {
  list: () => api.get<DeliveryBrief[]>('/deliveries'),

  available: () => api.get<DeliveryBrief[]>('/deliveries/available'),

  get: (id: string) => api.get<DeliveryBrief>(`/deliveries/${id}`),

  create: (data: {
    pickupAddress: string; pickupLat: number; pickupLng: number
    pickupContactName: string; pickupContactPhone: string
    dropoffAddress: string; dropoffLat: number; dropoffLng: number
    dropoffContactName: string; dropoffContactPhone: string
    itemDescription?: string; itemWeightKg?: number
    dropoffEmail?: string
  }) => api.post<DeliveryBrief>('/deliveries', data),

  takeJob: (id: string) => api.post<DeliveryBrief>(`/deliveries/${id}/take-job`),

  confirmAgreement: (id: string, data: { agreedPriceRwf: number; agreedDeliveryTime: string }) =>
    api.post<DeliveryBrief>(`/deliveries/${id}/confirm-agreement`, data),

  pay: (id: string) => api.post<DeliveryBrief>(`/deliveries/${id}/pay`),

  startDelivery: (id: string) => api.post<{ updated: DeliveryBrief; pickupOtp: string }>(`/deliveries/${id}/start-delivery`),

  arrivedPickup: (id: string, otp: string) =>
    api.post<DeliveryBrief>(`/deliveries/${id}/arrived-pickup`, { otp }),

  pickedUp: (id: string) => api.post<DeliveryBrief>(`/deliveries/${id}/picked-up`),

  inTransit: (id: string) => api.post<DeliveryBrief>(`/deliveries/${id}/in-transit`),

  arrived: (id: string) => api.post<{ updated: DeliveryBrief; dropoffOtp: string }>(`/deliveries/${id}/arrived`),

  complete: (id: string, otp: string) =>
    api.post<DeliveryBrief>(`/deliveries/${id}/complete`, { otp }),

  rate: (id: string, stars: number, comment?: string) =>
    api.post<unknown>(`/deliveries/${id}/rate`, { stars, comment }),

  cancel: (id: string) => api.put<DeliveryBrief>(`/deliveries/${id}/cancel`),

  chat: {
    list: (id: string) => api.get<{ id: string; content: string; senderId: string; createdAt: string }[]>(`/deliveries/${id}/chat`),
    send: (id: string, content: string) => api.post<unknown>(`/deliveries/${id}/chat`, { content }),
  },
}

// ── Wallet endpoints ───────────────────────────────────────────────────────────

export interface WalletData {
  balance: number
  transactions: {
    id: string; type: string; amount: number; description?: string; createdAt: string
  }[]
}

export const walletApi = {
  get: () => api.get<WalletData>('/wallet'),

  topup: (amount: number, method?: string) =>
    api.post<unknown>('/wallet/topup', { amount, method }),

  withdraw: (amount: number, momoPhone: string) =>
    api.post<unknown>('/wallet/withdraw', { amount, momoPhone }),
}

// ── User endpoints ─────────────────────────────────────────────────────────────

export const userApi = {
  updateMe: (data: { fullName?: string; email?: string }) =>
    api.put<unknown>('/users/me', data),

  uploadPhoto: async (uri: string): Promise<{ avatarUrl: string }> => {
    // First get a signed upload URL from our backend
    const { uploadUrl, publicUrl } = await api.post<{ uploadUrl: string; publicUrl: string }>(
      '/storage/signed-upload',
      { folder: 'avatars', resource_type: 'image' },
    )
    // Upload directly to Cloudinary
    const formData = new FormData()
    formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any)
    await fetch(uploadUrl, { method: 'POST', body: formData })
    return { avatarUrl: publicUrl }
  },
}

// ── Chat (conversations) ───────────────────────────────────────────────────────

export const chatApi = {
  conversations: () => api.get<{
    deliveryId: string
    lastMessage?: string
    updatedAt: string
    otherParty: { id: string; fullName: string; avatarUrl?: string }
  }[]>('/chat/conversations'),
}
