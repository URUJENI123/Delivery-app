'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { OTPInput } from '@/components/ui/OTPInput';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/stores/auth';
import { api } from '@/lib/api';
import { Phone } from 'lucide-react';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const mode = searchParams.get('mode') || 'signin';
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!phone) router.replace('/auth/signin');
  }, [phone, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerifyOtp = useCallback(async (otp: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.post<any>('/auth/courier/verify-otp', { phone, token: otp });

      if (data.user) setUser(data.user);

      const profile: User = await api.get('/auth/me');
      setUser(profile);

      if (mode === 'signup') {
        router.replace('/auth/courier/onboarding');
      } else {
        if (profile?.onboardingSession && !profile.onboardingSession.isSubmitted) {
          router.replace('/auth/courier/onboarding');
        } else if (profile?.courierProfile && !profile.courierProfile.isApprovedByAdmin) {
          router.replace('/auth/courier/pending');
        } else {
          router.replace('/courier/dashboard');
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [phone, mode, router, setUser]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(60);
    try {
      await api.post('/auth/courier/request-otp', { phone });
    } catch {
      // Silently fail - user will see countdown reset
    }
  };

  if (!phone) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Logo size="md" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Phone size={24} className="text-red-600" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 mb-2">
            {mode === 'signup' ? 'Verify your phone' : 'Welcome back'}
          </h1>
          <p className="text-gray-500">
            Enter the code sent to <span className="font-semibold text-gray-950">{phone}</span>
          </p>
        </div>

        <div className="space-y-6">
          <OTPInput length={6} onComplete={handleVerifyOtp} error={error} disabled={loading} />

          {error && (
            <p className="text-sm text-danger font-medium text-center">Incorrect code. Try again.</p>
          )}

          <Button fullWidth size="lg" loading={loading}>Verify</Button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-400">Resend code in <span className="font-semibold text-gray-950">{countdown}s</span></p>
            ) : (
              <button onClick={handleResend} className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center">Resend code</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourierVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg-page"><div className="text-center space-y-4"><div className="w-16 h-16 rounded-xl bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%] mx-auto" /><div className="h-4 w-32 mx-auto bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" /><div className="h-3 w-48 mx-auto bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" /></div></div>}>
      <VerifyForm />
    </Suspense>
  );
}
