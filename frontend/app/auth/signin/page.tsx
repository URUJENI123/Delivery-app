'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminSignInPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'ADMIN') router.replace('/admin/dashboard');
  }, [user, router]);

  const handleSignin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.post<any>('/auth/admin/signin', { email, password });
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      setUser(data.user);
      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Logo size="md" />
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 mb-2">Admin sign in</h1>
          <p className="text-gray-500 text-sm">Authorized personnel only</p>
        </div>

        <div className="space-y-5">
          <Input label="Email address" type="email" placeholder="admin@delivery.rw" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail size={18} />} />
          <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<Lock size={18} />} rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 cursor-pointer" tabIndex={-1}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />

          {error && <p className="text-sm text-danger font-medium text-center">{error}</p>}

          <Button fullWidth size="lg" onClick={handleSignin} loading={loading} disabled={!email || !password}>
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
