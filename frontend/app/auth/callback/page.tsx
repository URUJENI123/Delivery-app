'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

function getTokensFromHash(): { accessToken: string; refreshToken: string | null } | null {
  const { hash } = window.location;
  if (!hash || !hash.includes('access_token')) return null;
  const params = new URLSearchParams(hash.replace('#', '?'));
  const accessToken = params.get('access_token');
  if (!accessToken) return null;
  return { accessToken, refreshToken: params.get('refresh_token') };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      const tokens = getTokensFromHash();

      if (tokens) {
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
      } else {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          setError('Authentication failed. Please try again.');
          return;
        }
        accessToken = data.session.access_token;
        refreshToken = data.session.refresh_token;
      }

      if (!accessToken) {
        setError('Authentication failed. Please try again.');
        return;
      }

      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      try {
        const userData: any = await api.post('/auth/google/callback', { accessToken, refreshToken });
        setUser(userData);

        const rolePath =
          userData.role === 'COURIER' ? '/courier/dashboard' :
          userData.role === 'ADMIN' ? '/admin/dashboard' :
          '/sender/dashboard';
        router.replace(rolePath);
        return;
      } catch (err) {
        console.error('Google callback failed:', err);
        router.replace('/auth/signin');
      }
    };

    handleCallback();
  }, [router, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
        <div className="text-center">
          <p className="text-danger font-semibold mb-4">{error}</p>
          <a href="/auth/sender/signin" className="text-red-600 hover:underline font-semibold">
            Try signing in again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-xl bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%] mx-auto" />
        <div className="h-4 w-32 mx-auto bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
        <div className="h-3 w-48 mx-auto bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
