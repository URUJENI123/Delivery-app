'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function CourierPendingPage() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      if (user.role === 'COURIER' && user.courierProfile) {
        if (user.courierProfile.isApprovedByAdmin) {
          setStatus('approved');
        } else {
          setStatus('pending');
        }
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkStatus = async () => {
    setChecking(true);
    await fetchProfile();
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%] mx-auto" />
            <div className="h-7 w-48 mx-auto bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
            <div className="h-4 w-full bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
            <div className="h-4 w-3/4 mx-auto bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-200 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                  <div className="h-4 flex-1 bg-gray-200 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'approved') {
    router.replace('/courier/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Logo size="md" />
          </Link>
        </div>

        <Card className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-warning" />
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 mb-3">
            Application under review
          </h1>

          <p className="text-gray-500 mb-6">
            We&apos;re reviewing your documents and information. This usually takes
            24-48 hours. We&apos;ll send you a notification once your account is approved.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={14} className="text-success" />
              </div>
              <span className="text-sm text-gray-700">Application submitted</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Clock size={14} className="text-warning" />
              </div>
              <span className="text-sm text-gray-700">Document verification in progress</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <XCircle size={14} className="text-gray-400" />
              </div>
              <span className="text-sm text-gray-400">Admin approval</span>
            </div>
          </div>

          <Button variant="secondary" fullWidth onClick={checkStatus} loading={checking}>
            <RefreshCw size={16} /> Check status
          </Button>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? <Link href="/support" className="font-semibold text-red-600 hover:text-red-800">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
