'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Phone, ArrowRight, AlertCircle } from 'lucide-react';

export default function CourierPhonePage() {
  const router = useRouter();
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [noAccount, setNoAccount] = useState(false);

  const fullPhone = `+250${phoneDigits.replace(/\D/g, '')}`;

  const handleCheckPhone = async () => {
    const digits = phoneDigits.replace(/\D/g, '');
    if (digits.length < 9) return;

    setChecking(true);
    setError('');
    setNoAccount(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/courier/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      if (!res.ok) throw new Error('Check failed');

      const data = await res.json();

      if (!data.exists) {
        setNoAccount(true);
        return;
      }

      await sendOtp();
    } catch {
      setError('Failed to verify phone. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/courier/request-otp', { phone: fullPhone });
      router.push(`/auth/courier/verify?phone=${encodeURIComponent(fullPhone)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Logo size="md" />
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 mb-2">
            Courier sign in
          </h1>
          <p className="text-gray-500">
            Enter your phone number to sign in
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-stretch">
            <div className="flex items-center h-12 px-3.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-md text-gray-700 font-semibold text-sm select-none">
              +250
            </div>
            <div className="flex-1">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="7XX XXX XXX"
                value={phoneDigits}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 9) setPhoneDigits(val);
                  setNoAccount(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckPhone();
                }}
                className="h-12 w-full bg-bg-card border border-gray-200 rounded-r-md px-[14px] text-data text-gray-950 placeholder:text-gray-400 outline-none transition-colors duration-150 focus:border-2 focus:border-red-600 border-l-0"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger font-medium text-center">{error}</p>
          )}

          {noAccount && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-950">No account found</p>
                <p className="text-sm text-gray-600 mt-1">
                  This phone number is not registered. Please{' '}
                  <Link href="/auth/courier" className="font-semibold text-red-600 hover:underline">
                    create an account
                  </Link>{' '}
                  first.
                </p>
              </div>
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handleCheckPhone}
            loading={checking || loading}
            disabled={phoneDigits.replace(/\D/g, '').length < 9}
          >
            {checking ? 'Checking...' : 'Sign in'} <ArrowRight size={18} />
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sender/signup" className="font-semibold text-red-600 hover:text-red-800 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
