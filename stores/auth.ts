import { create } from 'zustand';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  supabaseId: string;
  phone?: string | null;
  email?: string | null;
  fullName: string | null;
  role: 'SENDER' | 'COURIER' | 'ADMIN';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profilePhotoUrl: string | null;
  courierProfile?: {
    id: string;
    verificationTier: string;
    isApprovedByAdmin: boolean;
    isOnline: boolean;
  } | null;
  onboardingSession?: {
    id: string;
    currentStep: number;
    isComplete: boolean;
    isSubmitted: boolean;
  } | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

function clearAuthStorage() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  fetchProfile: async () => {
    // DEV BYPASS: if a dev token is set, inject mock admin user without hitting backend
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token === 'dev-bypass-token') {
      set({
        user: {
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
        loading: false,
      });
      return;
    }
    try {
      const res = await api.get<any>('/auth/me');
      set({ user: res.data || res, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut().catch(() => {});
    await api.post('/auth/logout').catch(() => {});
    clearAuthStorage();
    set({ user: null });
  },
}));
