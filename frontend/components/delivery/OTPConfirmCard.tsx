'use client';

import { useState, useEffect } from 'react';
import { OTPInput } from '@/components/ui/OTPInput';
import { Button } from '@/components/ui/button';

interface OTPConfirmCardProps {
  title?: string;
  subtitle?: string;
  onConfirm: (otp: string) => void;
  expiresIn?: number;
  loading?: boolean;
}

export function OTPConfirmCard({
  title = 'Confirm Package Handover',
  subtitle = 'Share this code with the courier',
  onConfirm,
  expiresIn = 1800,
  loading,
}: OTPConfirmCardProps) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleComplete = (value: string) => {
    setOtp(value);
    setError(false);
  };

  const handleConfirm = () => {
    if (otp.length < 6) {
      setError(true);
      return;
    }
    onConfirm(otp);
  };

  return (
    <div className="border-2 border-red-600 bg-white rounded-lg p-5">
      <h3 className="font-display text-h4 font-semibold text-gray-950">{title}</h3>
      <p className="text-caption text-gray-500 mt-1">{subtitle}</p>

      <div className="mt-5">
        <OTPInput
          length={6}
          onComplete={handleComplete}
          error={error}
        />
      </div>

      <p className="text-center text-caption text-gray-500 mt-4">
        Code expires in {minutes}:{seconds.toString().padStart(2, '0')}
      </p>

      <Button
        variant="primary"
        fullWidth
        className="mt-4 !h-13 !text-btn-md"
        loading={loading}
        disabled={otp.length < 6}
        onClick={handleConfirm}
      >
        I&apos;ve handed over the package
      </Button>
    </div>
  );
}
