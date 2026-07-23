'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { hash } = window.location;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        setReady(true);
        return;
      }
    }
    setError('Invalid or expired reset link. Please request a new one.');
  }, []);

  const handleUpdate = async () => {
    if (!password || password.length < 6) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/password/update', { newPassword: password });
      await supabase.auth.signOut();
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-success" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 mb-2">Password updated</h1>
          <p className="text-gray-500 mb-8">Your password has been reset successfully.</p>
          <Link href="/auth/sender/signin" className="font-semibold text-red-600 hover:text-red-800 transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Logo size="md" />
          </Link>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 mb-2">
            Set new password
          </h1>
          <p className="text-gray-500">Choose a new password for your account</p>
        </div>

        <div className="space-y-5">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {error && <p className="text-sm text-danger font-medium text-center">{error}</p>}

          {ready ? (
            <Button fullWidth size="lg" onClick={handleUpdate} loading={loading} disabled={!password || password.length < 6}>
              Update password
            </Button>
          ) : (
            <Link
              href="/auth/sender/signin"
              className="block text-center font-semibold text-red-600 hover:text-red-800 transition-colors"
            >
              Request a new reset link
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
