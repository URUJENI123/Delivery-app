'use client';

import { cn } from '@/lib/utils';
import { CheckCheck } from 'lucide-react';

interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isSender: boolean;
  read?: boolean;
  showAvatar?: boolean;
  avatar?: React.ReactNode;
}

export function ChatBubble({ message, timestamp, isSender, read, showAvatar, avatar }: ChatBubbleProps) {
  return (
    <div className={cn('flex items-end gap-2 mb-3', isSender ? 'flex-row-reverse' : 'flex-row')}>
      {showAvatar ? (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-red-600 flex items-center justify-center text-white font-display font-semibold text-xs">
          {avatar || 'J'}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      <div className={cn('max-w-[75%]', isSender ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3.5 py-2.5 text-body-sm',
            isSender
              ? 'bg-red-600 text-white rounded-[16px_16px_4px_16px]'
              : 'bg-white border border-gray-200 text-gray-950 rounded-[16px_16px_16px_4px]',
          )}
        >
          {message}
        </div>
        <div className={cn('flex items-center gap-1 mt-0.5', isSender ? 'justify-end' : 'justify-start')}>
          <span className="text-micro text-gray-400">{timestamp}</span>
          {isSender && (
            <CheckCheck size={12} className={read ? 'text-white' : 'text-gray-400'} />
          )}
        </div>
      </div>
    </div>
  );
}
