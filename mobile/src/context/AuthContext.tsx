/**
 * AuthContext — provides current user + auth actions across the app.
 * Restores session from AsyncStorage on mount.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import {
  getStoredUser,
  saveSession,
  clearSession,
  StoredUser,
} from '../lib/storage'
import {
  authApi,
  setSessionExpiredHandler,
} from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'

interface AuthState {
  user: StoredUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  signInSender: (email: string, password: string) => Promise<void>
  signUpSender: (email: string, password: string, fullName?: string) => Promise<void>
  signInAdmin: (email: string, password: string) => Promise<void>
  requestOtp: (phone: string) => Promise<void>
  verifyOtp: (phone: string, token: string) => Promise<{ needsOnboarding: boolean }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

type AuthContextValue = AuthState & AuthActions

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session on boot
  useEffect(() => {
    ;(async () => {
      try {
        const stored = await getStoredUser()
        if (stored) {
          setUser(stored)
          await connectSocket()
        }
      } catch {
        // ignore — session is just absent
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  // Wire session expiry (e.g., refresh token invalid)
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
    })
  }, [])

  const afterAuth = useCallback(async (data: {
    accessToken: string
    refreshToken: string
    user: StoredUser
  }) => {
    await saveSession(data)
    setUser(data.user)
    await connectSocket()
  }, [])

  const signInSender = useCallback(async (email: string, password: string) => {
    const data = await authApi.senderSignin(email, password)
    await afterAuth({ ...data, user: data.user as StoredUser })
  }, [afterAuth])

  const signUpSender = useCallback(async (email: string, password: string, fullName?: string) => {
    const data = await authApi.senderSignup(email, password, fullName)
    await afterAuth({ ...data, user: data.user as StoredUser })
  }, [afterAuth])

  const signInAdmin = useCallback(async (email: string, password: string) => {
    const data = await authApi.adminSignin(email, password)
    await afterAuth({ ...data, user: data.user as StoredUser })
  }, [afterAuth])

  const requestOtp = useCallback(async (phone: string) => {
    await authApi.requestOtp(phone)
  }, [])

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const data = await authApi.verifyOtp(phone, token)
    await afterAuth({ ...data, user: data.user as StoredUser })
    return { needsOnboarding: data.needsOnboarding }
  }, [afterAuth])

  const signOut = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    disconnectSocket()
    await clearSession()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authApi.me()
      if (fresh) {
        setUser(fresh as StoredUser)
      }
    } catch { /* ignore */ }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signInSender,
      signUpSender,
      signInAdmin,
      requestOtp,
      verifyOtp,
      signOut,
      refreshUser,
    }),
    [user, isLoading, signInSender, signUpSender, signInAdmin, requestOtp, verifyOtp, signOut, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
