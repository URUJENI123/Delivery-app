'use client';

import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface LocationPickerProps {
  type: 'pickup' | 'dropoff';
  value?: string;
  placeholder?: string;
  onClick?: () => void;
}

export function LocationPicker({ type, value, placeholder, onClick }: LocationPickerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full h-[52px] border rounded-lg px-3.5 bg-white transition-colors duration-150',
        value ? 'border-gray-200' : 'border-gray-200',
        'hover:border-gray-300',
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          type === 'pickup' ? 'bg-success' : 'bg-red-600',
        )}
      />
      <span className={cn(
        'flex-1 text-left text-body-sm',
        value ? 'text-gray-950 font-medium' : 'text-gray-400',
      )}>
        {value || placeholder || (type === 'pickup' ? 'Pickup location' : 'Drop-off location')}
      </span>
      <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
    </button>
  );
}
