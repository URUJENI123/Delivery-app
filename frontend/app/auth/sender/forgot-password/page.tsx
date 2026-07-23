'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/password/reset', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-success" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 mb-2">
            Check your email
          </h1>
          <p className="text-gray-500 mb-8">
            We&apos;ve sent a password reset link to{' '}
            <span className="font-semibold text-gray-950">{email}</span>
          </p>
          <Link
            href="/auth/sender/signin"
            className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
          >
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
            Reset password
          </h1>
          <p className="text-gray-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="space-y-5">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
          />

          {error && (
            <p className="text-sm text-danger font-medium text-center">{error}</p>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handleReset}
            loading={loading}
            disabled={!email}
          >
            Send reset link
          </Button>

          <div className="text-center">
            <Link
              href="/auth/sender/signin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
