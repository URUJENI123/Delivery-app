'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function MessagesRedirectPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'COURIER') {
      router.replace('/courier/messages');
    } else {
      router.replace('/sender/messages');
    }
  }, [user, router]);

  return null;
}
