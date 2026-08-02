'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface Conversation {
  deliveryId: string;
  trackingCode: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  otherParty: {
    id: string;
    fullName: string;
    phone: string;
    profilePhotoUrl: string | null;
  };
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
}

export default function SenderMessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get<Conversation[]>('/chat/conversations')
      .then((res) => setConversations(res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page">
        <div className="px-4 pb-4 lg:px-6 lg:pb-6">
          <div className="bg-bg-card border border-gray-200 rounded-xl overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 h-[76px] border-b border-gray-150 last:border-b-0">
                <div className="w-11 h-11 rounded-full bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                    <div className="h-3 w-12 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                  </div>
                  <div className="h-3 w-48 bg-gray-100 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="px-4 pb-4 lg:px-6 lg:pb-6">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-gray-400" />
            </div>
            <p className="font-display text-base font-semibold text-gray-950">No conversations yet</p>
            <p className="font-body text-sm text-gray-400 mt-2 max-w-[240px]">
              Your messages with couriers will appear here
            </p>
          </div>
        ) : (
          <div className="bg-bg-card border border-gray-200 rounded-xl overflow-hidden">
            {conversations.map((conv) => (
              <Link
                key={conv.deliveryId}
                href={`/chat/${conv.deliveryId}`}
                className="flex items-center gap-3 px-4 h-[76px] border-b border-gray-150 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <Avatar name={conv.otherParty.fullName || conv.otherParty.phone || '?'} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-semibold text-gray-950 truncate">{conv.otherParty.fullName || conv.otherParty.phone || 'Unknown'}</p>
                    <span className="font-body text-[11px] text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="font-body text-xs text-gray-500 truncate pr-2">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-display text-[10px] font-bold flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
