'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    switch (user.role) {
      case 'SENDER':
        router.replace('/sender/dashboard');
        break;
      case 'COURIER':
        if (user.courierProfile && !user.courierProfile.isApprovedByAdmin) {
          router.replace('/auth/courier/pending');
        } else {
          router.replace('/courier/dashboard');
        }
        break;
      case 'ADMIN':
        router.replace('/admin/dashboard');
        break;
      default:
        router.replace('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return null;
}
