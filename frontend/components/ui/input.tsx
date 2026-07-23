'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, required, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-caption font-medium text-gray-700">
            {label}
            {required && <span className="text-red-600 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'h-12 w-full bg-white border border-gray-200 rounded-md px-[14px] text-data text-gray-950 placeholder:text-gray-400 outline-none transition-colors duration-150',
              'focus:border-2 focus:border-red-600',
              error && '!border-2 !border-danger',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-tiny text-danger font-medium">{error}</span>
        )}
        {hint && !error && (
          <span className="text-tiny text-gray-400">{hint}</span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export { Input };
