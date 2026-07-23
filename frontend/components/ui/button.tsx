'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline-red' | 'danger' | 'ghost' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-btn-sm',
  md: 'h-10 px-6 text-btn-md',
  lg: 'h-12 px-8 text-btn-lg',
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-red-600 text-white hover:bg-red-800 active:bg-red-900',
  secondary:
    'bg-white text-gray-950 border border-gray-200 hover:bg-gray-100 hover:border-gray-300',
  'outline-red':
    'bg-transparent text-red-600 border border-red-600 hover:bg-red-50',
  danger:
    'bg-danger text-white hover:bg-red-700',
  ghost:
    'bg-transparent text-red-600 hover:bg-red-50',
  icon: 'w-10 h-10 rounded-full bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-display font-semibold rounded-md transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 active:scale-[0.98]',
          variant !== 'icon' && 'rounded-md',
          sizeStyles[size],
          variants[variant],
          (loading || disabled) && 'opacity-50 cursor-not-allowed',
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button, type ButtonVariant, type ButtonSize };
