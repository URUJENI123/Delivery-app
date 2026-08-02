'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { ChevronLeft, ChevronRight, CheckCircle, Upload } from 'lucide-react';
import Link from 'next/link';

export default function CourierOnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: '', nationalIdNumber: '', motorcyclePlate: '', associationCode: '',
    operatingZone: '', emergencyContactName: '', emergencyContactPhone: '',
    momoNumber: '', momoProvider: 'MTN',
  });

  const update = (partial: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...partial }));
  const docUploads = ['Selfie', 'National ID', 'Vehicle front', 'Vehicle rear', 'License'];

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/couriers/register', form);
      setUser({ ...user!, role: 'COURIER' });
      setSubmitted(true);
    } catch {} finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <Card className="max-w-md w-full text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-success flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 mb-2">Application received!</h1>
          <p className="text-gray-500 mb-8">We&apos;ll review your documents within 24-48 hours.</p>
          <Button onClick={() => router.push('/courier/dashboard')}>Go to dashboard</Button>
        </Card>
      </div>
    );
  }

  const steps = ['Personal info', 'Vehicle', 'Documents', 'Payout'];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6 group">
            <Logo size="md" />
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-950 mb-2">Become a courier</h1>
          <p className="text-gray-500">Join our network of trusted motorcycle couriers in Kigali</p>
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
              {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-red-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <Card>
            <h2 className="font-display text-lg font-bold mb-5">Personal information</h2>
            <div className="space-y-4">
              <Input label="Full name" value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} />
              <Input label="Phone" value={user?.phone || ''} disabled />
              <Input label="National ID number" value={form.nationalIdNumber} onChange={(e) => update({ nationalIdNumber: e.target.value })} placeholder="e.g. 1199881234567890" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Emergency contact" value={form.emergencyContactName} onChange={(e) => update({ emergencyContactName: e.target.value })} />
                <Input label="Emergency phone" value={form.emergencyContactPhone} onChange={(e) => update({ emergencyContactPhone: e.target.value })} placeholder="+250 7XX XXX XXX" />
              </div>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <h2 className="font-display text-lg font-bold mb-5">Vehicle information</h2>
            <div className="space-y-4">
              <Input label="Motorcycle plate number" value={form.motorcyclePlate} onChange={(e) => update({ motorcyclePlate: e.target.value })} placeholder="e.g. RAC 123 A" />
              <Input label="Association / Zone code" value={form.associationCode} onChange={(e) => update({ associationCode: e.target.value })} placeholder="Optional" />
              <Input label="Operating zone" value={form.operatingZone} onChange={(e) => update({ operatingZone: e.target.value })} placeholder="e.g. Kigali - Nyarugenge" />
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <h2 className="font-display text-lg font-bold mb-2">Document uploads</h2>
            <p className="text-sm text-gray-500 mb-5">Upload clear photos of each document.</p>
            <div className="space-y-3">
              {docUploads.map((doc) => (
                <div key={doc} className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-red-600 hover:bg-red-100/20 transition-all duration-200 cursor-pointer">
                  <Upload size={22} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-bold">{doc}</p>
                  <p className="text-xs text-gray-400 mt-1">Tap to upload</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h2 className="font-display text-lg font-bold mb-5">Payout details</h2>
            <div className="space-y-4">
              <Input label="Mobile money number" value={form.momoNumber} onChange={(e) => update({ momoNumber: e.target.value })} placeholder="+250 7XX XXX XXX" />
              <div>
                <label className="text-sm font-bold text-gray-950 block mb-2">Provider</label>
                <div className="flex gap-3">
                  {['MTN', 'Airtel'].map((p) => (
                    <button key={p} onClick={() => update({ momoProvider: p })}
                      className={`flex-1 p-3.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${form.momoProvider === p ? 'border-red-600 bg-red-100 text-red-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 mt-4 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 mt-0.5 rounded border-gray-200 text-red-600 focus:ring-red-600" />
                <span className="text-sm text-gray-600 font-medium">I agree to the Terms of Service.</span>
              </label>
            </div>
          </Card>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ChevronLeft size={16} />Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Next<ChevronRight size={16} /></Button>
          ) : (
            <Button onClick={submit} loading={loading}>Submit for review</Button>
          )}
        </div>
      </div>
    </div>
  );
}
