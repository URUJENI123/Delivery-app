'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: boolean;
  className?: string;
  disabled?: boolean;
}

export function OTPInput({ length = 6, onComplete, error, className, disabled }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const [shake, setShake] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (error) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }, [error]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);
    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    const otp = newValues.join('');
    if (otp.length === length) {
      onComplete(otp);
    }
  }, [values, length, onComplete]);

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }, [values]);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newValues = [...values];
    pasted.split('').forEach((char, i) => {
      if (i < length) newValues[i] = char;
    });
    setValues(newValues);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
    if (pasted.length === length) {
      onComplete(pasted);
    }
  }, [values, length, onComplete]);

  return (
    <div className={cn('flex gap-2 justify-center', shake && 'animate-otp-shake', className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={values[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={cn(
            'w-[52px] h-[58px] text-center font-display text-2xl font-bold text-gray-950',
            'border rounded-xl outline-none transition-all duration-150',
            error ? 'border-danger' : values[i] ? 'border-red-600 bg-white' : 'border-gray-200',
            'focus:border-2 focus:border-red-600 focus:bg-red-50',
            disabled && 'opacity-50 bg-gray-100',
          )}
        />
      ))}
    </div>
  );
}
