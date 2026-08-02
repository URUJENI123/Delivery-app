import { create } from 'zustand';
import { api } from '@/lib/api';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  isSender?: boolean;
}

interface Conversation {
  id: string;
  deliveryId: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

interface MessagesState {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetchConversations: (role?: 'sender' | 'courier') => Promise<void>;
  fetchMessages: (deliveryId: string) => Promise<void>;
  sendMessage: (deliveryId: string, text: string) => Promise<void>;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  messages: [],
  loading: false,
  error: null,

  fetchConversations: async (role) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<any>('/deliveries');
      const deliveries = Array.isArray(res) ? res : res.data || [];

      const conversations: Conversation[] = await Promise.all(
        deliveries.slice(0, 20).map(async (d: any) => {
          let participantName = 'Courier';
          if (role === 'courier') {
            participantName = d.sender?.fullName || d.sender?.email || 'Sender';
          } else {
            participantName = d.courier?.fullName || d.courier?.user?.fullName || 'Courier';
          }

          let lastMessage = '';
          let timestamp = new Date(d.createdAt).toLocaleDateString();
          try {
            const msgs = await api.get<any>(`/deliveries/${d.id}/chat`);
            const msgList = Array.isArray(msgs) ? msgs : msgs.data || [];
            if (msgList.length > 0) {
              const latest = msgList[msgList.length - 1];
              lastMessage = latest.text || '';
              timestamp = latest.createdAt ? new Date(latest.createdAt).toLocaleDateString() : timestamp;
            }
          } catch {}

          return {
            id: d.id,
            deliveryId: d.id,
            participantName,
            participantAvatar: null,
            lastMessage: lastMessage || (d.pickupAddress ? `${d.pickupAddress} → ${d.dropoffAddress}` : 'No messages yet'),
            timestamp,
            unread: 0,
            online: false,
          };
        }),
      );

      set({ conversations, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMessages: async (deliveryId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<any>(`/deliveries/${deliveryId}/chat`);
      const msgs = Array.isArray(res) ? res : res.data || [];
      const messages = msgs.map((m: any) => ({
        id: m.id,
        senderId: m.senderId || m.sender?.id || '',
        text: m.text || m.message || '',
        createdAt: m.createdAt || m.sentAt || '',
        isSender: false,
      }));
      set({ messages, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  sendMessage: async (deliveryId, text) => {
    try {
      const res = await api.post<any>(`/deliveries/${deliveryId}/chat`, { text });
      const newMsg = res.data || res;
      if (newMsg) {
        set((state) => ({
          messages: [...state.messages, {
            id: newMsg.id || Date.now().toString(),
            senderId: newMsg.senderId || '',
            text: newMsg.text || text,
            createdAt: newMsg.createdAt || new Date().toISOString(),
            isSender: true,
          }],
        }));
      }
    } catch {
      // silently fail
    }
  },
}));
