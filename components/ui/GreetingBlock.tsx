'use client';

import { Bell, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GreetingBlockProps {
  firstName: string;
  role?: 'SENDER' | 'COURIER';
  activeDeliveries?: number;
  isOnline?: boolean;
  onToggleOnline?: () => void;
  onAvatarTap?: () => void;
  avatarUrl?: string | null;
  className?: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Hello';
}

export function GreetingBlock({
  firstName,
  role,
  activeDeliveries,
  isOnline,
  onToggleOnline,
  onAvatarTap,
  avatarUrl,
  className,
}: GreetingBlockProps) {
  const greeting = getGreeting();

  return (
    <div className={cn('relative px-4 pt-4 pb-3 lg:px-6 lg:pt-5 lg:pb-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-body text-sm text-gray-500">{greeting},</p>
            <button
              onClick={onAvatarTap}
              className="lg:hidden w-10 h-10 rounded-full overflow-hidden bg-red-600 flex-shrink-0 -mr-2"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-sm font-bold text-white flex items-center justify-center h-full">
                  {firstName.charAt(0)}
                </span>
              )}
            </button>
          </div>
          <h1 className="font-display text-[28px] font-bold text-gray-950 leading-tight">{firstName}</h1>

          {role === 'SENDER' && (
            <p className="font-body text-sm text-gray-500 mt-1">
              You have {activeDeliveries ?? 0} active {activeDeliveries === 1 ? 'delivery' : 'deliveries'}
            </p>
          )}

          {role === 'COURIER' && (
            <button
              onClick={onToggleOnline}
              className={cn(
                'inline-flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors duration-200',
                isOnline
                  ? 'bg-success-bg border-success/30 text-success font-body'
                  : 'bg-gray-100 border-gray-200 text-gray-500 font-body',
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isOnline ? 'bg-success animate-green-pulse' : 'bg-gray-400',
                )}
              />
              {isOnline ? 'Online \u00B7 accepting jobs' : 'Offline \u00B7 tap to go online'}
            </button>
          )}
        </div>

        <button
          onClick={onAvatarTap}
          className="hidden lg:flex w-12 h-12 rounded-full overflow-hidden bg-red-600 flex-shrink-0 items-center justify-center"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-lg font-bold text-white">{firstName.charAt(0)}</span>
          )}
        </button>
      </div>
    </div>
  );
}
