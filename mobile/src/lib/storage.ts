/**
 * Typed AsyncStorage wrapper for tokens and user session.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const

export interface StoredUser {
  id: string
  email?: string | null
  phone?: string | null
  fullName?: string | null
  role: 'SENDER' | 'COURIER' | 'ADMIN'
  avatarUrl?: string | null
}

// ── Token helpers ──────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ACCESS_TOKEN)
}

export async function setAccessToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token)
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.REFRESH_TOKEN)
}

export async function setRefreshToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token)
}

// ── User helpers ───────────────────────────────────────────────────────────────

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user))
}

// ── Session helpers ────────────────────────────────────────────────────────────

export async function saveSession(params: {
  accessToken: string
  refreshToken: string
  user: StoredUser
}): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEYS.ACCESS_TOKEN, params.accessToken),
    AsyncStorage.setItem(KEYS.REFRESH_TOKEN, params.refreshToken),
    AsyncStorage.setItem(KEYS.USER, JSON.stringify(params.user)),
  ])
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.ACCESS_TOKEN),
    AsyncStorage.removeItem(KEYS.REFRESH_TOKEN),
    AsyncStorage.removeItem(KEYS.USER),
  ])
}
