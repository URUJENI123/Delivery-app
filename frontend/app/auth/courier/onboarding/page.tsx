'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, CheckCircle, Upload, User, Mail, Phone, Lock, Eye, EyeOff, CreditCard, Truck, Shirt } from 'lucide-react';

interface OnboardingData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  nationalIdNumber: string;
  vehiclePlate: string;
  jacketSerialNumber: string;
  selfieUrl: string;
  idPhotoUrl: string;
  vehiclePhotoFrontUrl: string;
  vehiclePhotoRearUrl: string;
  jacketPhotoUrl: string;
}

const defaultData: OnboardingData = {
  fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  nationalIdNumber: '', vehiclePlate: '', jacketSerialNumber: '',
  selfieUrl: '', idPhotoUrl: '', vehiclePhotoFrontUrl: '', vehiclePhotoRearUrl: '', jacketPhotoUrl: '',
};

const steps = ['Personal info', 'Credentials', 'Documents'];

const uploadFields: { key: keyof OnboardingData; label: string }[] = [
  { key: 'selfieUrl', label: 'Selfie portrait' },
  { key: 'idPhotoUrl', label: 'National ID picture' },
  { key: 'vehiclePhotoFrontUrl', label: 'Vehicle front view' },
  { key: 'vehiclePhotoRearUrl', label: 'Vehicle rear view' },
  { key: 'jacketPhotoUrl', label: 'Jacket picture' },
];

export default function CourierOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  const update = (partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
    setError('');
  };

  const nextStep = () => {
    if (step === 0) {
      if (!data.fullName.trim()) { setError('Full name is required'); return; }
      if (!data.email.trim()) { setError('Email is required'); return; }
      if (!data.password) { setError('Password is required'); return; }
      if (data.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (data.password !== data.confirmPassword) { setError('Passwords do not match'); return; }
    }
    if (step === 1) {
      if (!data.nationalIdNumber.trim()) { setError('National ID number is required'); return; }
      if (!data.vehiclePlate.trim()) { setError('Vehicle plate number is required'); return; }
      if (!data.jacketSerialNumber.trim()) { setError('Jacket serial number is required'); return; }
    }
    setError('');
    setStep(s => Math.min(s + 1, 2));
  };

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 0));
    setError('');
  };

  const handlePhotoUpload = async (field: keyof OnboardingData) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(field);
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const { uploadUrl, publicUrl } = await api.post<any>('/storage/presigned-url', {
          fileName: `${field}.${ext}`,
          contentType: file.type,
          folder: 'courier-onboarding',
        });

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) throw new Error('Upload failed');

        update({ [field]: publicUrl });
      } catch (err: any) {
        setError(err.message || 'Upload failed. Please try again.');
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  const handleSubmit = () => {
    if (!agreeToTerms) { setError('You must agree to the terms and conditions'); return; }
    const missing = uploadFields.filter(f => !data[f.key]);
    if (missing.length > 0) {
      setError(`Please upload: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-page">
        <Card className="max-w-md w-full text-center py-16 px-8">
          <div className="w-16 h-16 rounded-2xl bg-success flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 mb-2">
            Application submitted!
          </h1>
          <p className="text-gray-500 mb-2">
            We&apos;ll review your information and documents.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            This usually takes 24-48 hours. We&apos;ll notify you once approved.
          </p>
          <Button onClick={() => router.push('/auth/courier/pending')}>
            Check status
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-bg-page">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Logo size="md" />
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 mb-2">
            Courier signup
          </h1>
          <p className="text-gray-500">Complete your registration to start delivering</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-red-600 text-white' :
                i === step ? 'bg-red-100 text-red-600 border-2 border-red-600' :
                'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? 'bg-red-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Section 1: Personal info */}
        {step === 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <User size={20} className="text-red-600" />
              <h2 className="font-display text-lg font-bold">Personal information</h2>
            </div>
            <div className="space-y-4">
              <Input
                label="Full name"
                value={data.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
                placeholder="Jean Baptiste"
                leftIcon={<User size={18} />}
              />
              <Input
                label="Email address"
                type="email"
                value={data.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="you@example.com"
                leftIcon={<Mail size={18} />}
              />
              <Input
                label="Phone number"
                value={data.phone || ''}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="+250 7XX XXX XXX"
                leftIcon={<Phone size={18} />}
              />
              <Input
                label="Create password"
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => update({ password: e.target.value })}
                placeholder="At least 6 characters"
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 cursor-pointer" tabIndex={-1}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <Input
                label="Confirm password"
                type={showConfirm ? 'text' : 'password'}
                value={data.confirmPassword}
                onChange={(e) => update({ confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600 cursor-pointer" tabIndex={-1}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>
          </Card>
        )}

        {/* Section 2: Credentials */}
        {step === 1 && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <CreditCard size={20} className="text-red-600" />
              <h2 className="font-display text-lg font-bold">Identity & Vehicle</h2>
            </div>
            <div className="space-y-4">
              <Input
                label="National ID number"
                value={data.nationalIdNumber}
                onChange={(e) => update({ nationalIdNumber: e.target.value })}
                placeholder="e.g. 1199881234567890"
                leftIcon={<CreditCard size={18} />}
              />
              <Input
                label="Vehicle plate number"
                value={data.vehiclePlate}
                onChange={(e) => update({ vehiclePlate: e.target.value })}
                placeholder="e.g. RAC 123 A"
                leftIcon={<Truck size={18} />}
              />
              <Input
                label="Jacket serial number"
                value={data.jacketSerialNumber}
                onChange={(e) => update({ jacketSerialNumber: e.target.value })}
                placeholder="e.g. JKT-2024-001234"
                leftIcon={<Shirt size={18} />}
              />
            </div>
          </Card>
        )}

        {/* Section 3: Documents */}
        {step === 2 && (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Upload size={20} className="text-red-600" />
                <h2 className="font-display text-lg font-bold">Document uploads</h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">Upload clear photos of each document</p>
              <div className="space-y-3">
                {uploadFields.map((doc) => (
                  <div
                    key={doc.key}
                    onClick={() => uploading ? null : handlePhotoUpload(doc.key)}
                    className={`border-2 border-dashed rounded-xl p-5 text-center hover:border-red-600 hover:bg-red-50/50 transition-all duration-200 cursor-pointer ${
                      uploading === doc.key ? 'opacity-50 cursor-wait' :
                      data[doc.key] ? 'border-success bg-success/5' : 'border-gray-200'
                    }`}
                  >
                    {uploading === doc.key ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                        <div className="h-4 w-24 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                      </div>
                    ) : data[doc.key] ? (
                      <>
                        <CheckCircle size={22} className="mx-auto text-success mb-2" />
                        <p className="text-sm font-bold text-gray-950">{doc.label}</p>
                        <p className="text-xs text-success mt-1">Uploaded</p>
                      </>
                    ) : (
                      <>
                        <Upload size={22} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-bold text-gray-950">{doc.label}</p>
                        <p className="text-xs text-gray-400 mt-1">Tap to upload</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-200 text-red-600 focus:ring-red-600"
                />
                <span className="text-sm text-gray-600 font-medium">
                  I confirm the information provided is accurate and I agree to the{' '}
                  <Link href="/terms" className="text-red-600 hover:underline">Terms of Service</Link>.
                </span>
              </label>
            </Card>
          </>
        )}

        {error && <p className="text-sm text-danger font-medium text-center mt-4">{error}</p>}

        <div className="flex justify-between mt-6">
          <Button variant="secondary" onClick={prevStep} disabled={step === 0}>
            <ChevronLeft size={16} /> Back
          </Button>
          {step < 2 ? (
            <Button onClick={nextStep}>
              Next <ChevronRight size={18} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!agreeToTerms}>
              Submit for review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
