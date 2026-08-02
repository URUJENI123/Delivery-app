'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Phone, MoreVertical, CheckCheck, Package } from 'lucide-react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { getSocket, disconnectSocket } from '@/lib/socket';

interface ChatMessage {
  id: string;
  text: string;
  isSender: boolean;
  timestamp: string;
  read: boolean;
  senderId: string;
  createdAt: string;
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!id || !user || loaded.current) return;
    loaded.current = true;

    Promise.all([
      api.get<any>(`/deliveries/${id}`),
      api.get<any>(`/deliveries/${id}/chat`),
    ]).then(([deliveryRes, chatRes]) => {
      const deliveryData = deliveryRes.data || deliveryRes;
      setDelivery(deliveryData);

      const msgs = chatRes || [];
      setMessages(msgs.map((m: any) => ({
        id: m.id,
        text: m.body || '',
        isSender: m.sender_id === user.id || m.sender?.id === user.id,
        timestamp: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        read: true,
        senderId: m.sender_id || m.sender?.id,
        createdAt: m.sent_at,
      })));
    }).catch(() => {}).finally(() => setLoading(false));

    const socket = getSocket();
    socket.emit('join:delivery', id);

    const handleNewMessage = (msg: any) => {
      if (msg.sender_id === user.id || msg.sender?.id === user.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, {
          id: msg.id,
          text: msg.body || '',
          isSender: false,
          timestamp: msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: true,
          senderId: msg.sender_id || msg.sender?.id,
          createdAt: msg.sent_at,
        }];
      });
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.emit('leave:delivery', id);
      socket.off('message:new', handleNewMessage);
    };
  }, [id, user]);

  const handleSend = async (text: string) => {
    if (sending) return;
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      text,
      isSender: true,
      timestamp: 'Just now',
      read: false,
      senderId: user?.id || '',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await api.post<any>(`/deliveries/${id}/chat`, { body: text });
      const saved = res.data || res;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? {
          id: saved.id,
          text: saved.body || text,
          isSender: true,
          timestamp: saved.sent_at ? new Date(saved.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: true,
          senderId: user?.id || '',
          createdAt: saved.sent_at,
        } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, text: `${text} (failed)` } : m))
      );
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (text: string) => {
    handleSend(text);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-68px)] lg:h-screen">
        <div className="bg-red-600 h-[60px] lg:h-16 flex items-center px-3 flex-shrink-0 gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-white/20 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
            <div className="h-3 w-16 bg-white/20 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
          </div>
        </div>
        <div className="flex-1 bg-gray-50 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`${i % 2 === 0 ? 'w-3/5' : 'w-2/5'} h-10 bg-gray-200 rounded-xl relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isCourierViewing = user?.role === 'COURIER';
  const otherParty = isCourierViewing
    ? delivery?.sender
    : delivery?.courier?.user;
  const otherPartyName = otherParty?.fullName || otherParty?.phone || (isCourierViewing ? 'Sender' : 'Courier');
  const otherPartyInitial = otherPartyName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] lg:h-screen">
      <div className="bg-red-600 h-[60px] lg:h-16 flex items-center px-3 flex-shrink-0">
        <button onClick={() => router.back()} className="p-1 text-white mr-2">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center flex-1 ml-1 gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-display font-semibold text-sm border-2 border-white/50">
            {otherPartyInitial}
          </div>
          <div>
            <p className="font-display text-base font-semibold text-white">{otherPartyName}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-body text-[11px] text-white/70">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={22} className="text-white" />
          <MoreVertical size={22} className="text-white" />
        </div>
      </div>

      <div className="flex items-center h-12 px-4 bg-bg-card border-b border-gray-150 flex-shrink-0 gap-2">
        <Package size={16} className="text-gray-400" />
        <span className="font-body text-xs text-gray-600">
          {delivery?.trackingCode ? `#${delivery.trackingCode}` : `#${id?.slice(0, 8)}`}
          {delivery?.pickupAddress && ` · ${delivery.pickupAddress} → ${delivery.dropoffAddress}`}
        </span>
        <span className="ml-auto inline-flex items-center px-2 py-0.5 bg-red-100 text-red-600 font-display text-[10px] font-semibold rounded-full">
          {delivery?.status?.replace(/_/g, ' ') || ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3 space-y-1 pb-20">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="font-body text-sm text-gray-400">No messages yet. Start a conversation!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = i > 0 ? messages[i - 1] : null;
          const showAvatar = !prev || prev.isSender !== msg.isSender;
          return (
            <ChatBubble
              key={msg.id}
              message={msg.text}
              timestamp={msg.timestamp}
              isSender={msg.isSender}
              read={msg.read}
              showAvatar={showAvatar}
              avatar={msg.isSender ? 'You' : otherPartyInitial}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0">
        <QuickReplies onSelect={handleQuickReply} />
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
