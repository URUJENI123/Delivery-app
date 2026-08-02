'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Toggle({ checked, onChange, disabled, label, id }: ToggleProps) {
  const toggleId = id || 'toggle-' + Math.random().toString(36).slice(2);

  return (
    <div className="flex items-center gap-3">
      {label && (
        <label htmlFor={toggleId} className="text-body-sm text-gray-700 cursor-pointer select-none">
          {label}
        </label>
      )}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-[26px] w-[48px] rounded-full transition-colors duration-200',
          'focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2',
          checked ? 'bg-red-600' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'inline-block h-[22px] w-[22px] transform rounded-full bg-white transition-transform duration-200',
            checked ? 'translate-x-[24px]' : 'translate-x-[2px]',
          )}
        />
      </button>
    </div>
  );
}
