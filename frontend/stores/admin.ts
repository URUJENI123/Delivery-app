import { create } from 'zustand';
import { api } from '@/lib/api';

export type VerificationTier = 'Basic' | 'Verified' | 'Identity' | 'Vehicle' | 'Trusted';

interface AdminCourier {
  id: string;
  fullName: string;
  phone: string;
  verificationTier: string;
  isApprovedByAdmin: boolean;
  isOnline: boolean;
  totalDeliveries: number;
  rating: number;
  motorcyclePlate?: string;
  profilePhotoUrl?: string | null;
}

interface AdminStats {
  totalUsers: number;
  totalCouriers: number;
  totalDeliveries: number;
  totalRevenue: number;
  avgRating?: number;
}

interface AdminState {
  couriers: AdminCourier[];
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  fetchCouriers: () => Promise<void>;
  fetchStats: () => Promise<void>;
  verifyCourier: (id: string, approved: boolean, tier: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  couriers: [],
  stats: null,
  loading: false,
  error: null,

  fetchCouriers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<any>('/admin/couriers');
      set({ couriers: Array.isArray(res) ? res : res.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res = await api.get<any>('/admin/dashboard');
      set({ stats: res.data || res });
    } catch {
      // silently fail
    }
  },

  verifyCourier: async (id, approved, tier) => {
    await api.put(`/admin/couriers/${id}/verify`, { approved, tier });
    set((state) => ({
      couriers: state.couriers.map((c) =>
        c.id === id ? { ...c, isApprovedByAdmin: approved, verificationTier: tier } : c,
      ),
    }));
  },
}));
