'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OTPInput } from '@/components/ui/OTPInput';
import { api } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/stores/auth';
import { Phone } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, user } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (user) {
      if (user.role === 'COURIER' && user.courierProfile && !user.courierProfile.isApprovedByAdmin) {
        router.replace('/auth/courier/pending');
      } else {
        const rolePath =
          user.role === 'COURIER' ? '/courier/dashboard' :
          user.role === 'ADMIN' ? '/admin/dashboard' :
          '/sender/dashboard';
        router.replace(rolePath);
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = useCallback(async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/request-otp', { phone });
      setStep('otp');
      setCountdown(60);
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      setLoading(true);
      setOtpError(false);
      try {
        const res = await api.post<any>('/auth/verify-otp', { phone, otp });
        if (res.accessToken) {
          localStorage.setItem('access_token', res.accessToken);
        }
        const u = res.user || res;
        setUser(u);
        if (u.role === 'COURIER' && u.courierProfile && !u.courierProfile.isApprovedByAdmin) {
          router.replace('/auth/courier/pending');
        } else {
          router.replace(
            u.role === 'COURIER' ? '/courier/dashboard' : '/sender/dashboard',
          );
        }
      } catch {
        setOtpError(true);
      } finally {
        setLoading(false);
      }
    },
    [phone, router, setUser],
  );

  const handleResend = useCallback(() => {
    if (countdown > 0) return;
    handleSendOtp();
  }, [countdown, handleSendOtp]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Logo size="md" />
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 mb-2">
            Sign in
          </h1>
          <p className="text-gray-500">Enter your phone to receive a code</p>
        </div>

        <div className="relative">
          <div
            className={`transition-all duration-300 ${
              step === 'phone'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
            }`}
          >
            {step === 'phone' && (
              <div className="space-y-5">
                <Input
                  label="Phone number"
                  placeholder="+250 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone size={18} />}
                  type="tel"
                />
                {error && (
                  <p className="text-sm text-danger font-medium text-center">
                    {error}
                  </p>
                )}
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleSendOtp}
                  loading={loading}
                  disabled={phone.replace(/\D/g, '').length < 10}
                >
                  Send OTP
                </Button>
              </div>
            )}
          </div>

          <div
            className={`transition-all duration-300 ${
              step === 'otp'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
            }`}
          >
            {step === 'otp' && (
              <div className="space-y-6">
                <p className="text-center text-sm text-gray-500">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-semibold text-gray-950">{phone}</span>
                </p>
                <OTPInput
                  length={6}
                  onComplete={handleVerifyOtp}
                  error={otpError}
                  disabled={loading}
                />
                {otpError && (
                  <p className="text-sm text-danger font-medium text-center">
                    Incorrect code. Try again.
                  </p>
                )}
                <Button fullWidth size="lg" loading={loading}>
                  Verify
                </Button>
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-400">
                      Resend code in{' '}
                      <span className="font-semibold text-gray-950">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
