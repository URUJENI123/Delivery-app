import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  date: string;
  createdAt?: string;
  amount: number;
  status?: 'completed' | 'pending' | 'failed';
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchWallet: () => Promise<void>;
  topUp: (amount: number, method: string) => Promise<boolean>;
  withdraw: (amount: number, method: string) => Promise<boolean>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  transactions: [],
  loading: false,
  error: null,

  fetchWallet: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<any>('/wallet');
      set({
        balance: res.balance ?? res.data?.balance ?? 0,
        transactions: Array.isArray(res.transactions)
          ? res.transactions
          : res.data?.transactions || [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  topUp: async (amount, method) => {
    try {
      await api.post('/wallet/topup', { amount, method });
      set((state) => ({ balance: state.balance + amount }));
      return true;
    } catch {
      return false;
    }
  },

  withdraw: async (amount, method) => {
    try {
      await api.post('/wallet/withdraw', { amount, method });
      set((state) => ({ balance: state.balance - amount }));
      return true;
    } catch {
      return false;
    }
  },
}));
