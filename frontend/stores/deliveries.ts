import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Delivery {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  quotedPriceRwf?: number;
  courier?: {
    id: string;
    fullName: string;
    phone: string;
    profilePhotoUrl: string | null;
    motorcyclePlate?: string;
  } | null;
  sender?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
}

interface DeliveriesState {
  deliveries: Delivery[];
  loading: boolean;
  error: string | null;
  fetchDeliveries: (role?: 'sender' | 'courier' | 'admin') => Promise<void>;
  fetchDeliveryById: (id: string) => Promise<Delivery | null>;
  createDelivery: (data: Partial<Delivery>) => Promise<Delivery | null>;
  updateStatus: (id: string, status: string) => Promise<void>;
}

export const useDeliveriesStore = create<DeliveriesState>((set) => ({
  deliveries: [],
  loading: false,
  error: null,

  fetchDeliveries: async (role) => {
    set({ loading: true, error: null });
    try {
      const path = role === 'admin' ? '/admin/deliveries' : '/deliveries';
      const res = await api.get<any>(path);
      set({ deliveries: Array.isArray(res) ? res : res.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchDeliveryById: async (id) => {
    try {
      const res = await api.get<any>(`/deliveries/${id}`);
      return res.data || res;
    } catch {
      return null;
    }
  },

  createDelivery: async (data) => {
    try {
      const res = await api.post<any>('/deliveries', data);
      return res.data || res;
    } catch {
      return null;
    }
  },

  updateStatus: async (id, status) => {
    await api.post(`/deliveries/${id}/status`, { status });
    set((state) => ({
      deliveries: state.deliveries.map((d) =>
        d.id === id ? { ...d, status } : d,
      ),
    }));
  },
}));
