'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { VerificationBadge } from '@/components/ui/badge';
import type { VerificationTier } from '@/components/ui/badge';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { Star, Calendar, Bike, ShieldCheck, Clock, Package } from 'lucide-react';

export default function CourierProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/auth/me').then((res) => {
      setProfile(res.data || res);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4"><Skeleton className="h-96" /></div>;

  const fullName = profile?.fullName || user?.fullName || 'Courier';
  const deliveries = profile?.courier?.totalDeliveries || 0;
  const rating = profile?.courier?.avgRating || 0;
  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';
  const vehiclePlate = profile?.courier?.motorcyclePlate || 'N/A';
  const vehicleBrand = profile?.courier?.motorcycleBrand || '';
  const vehicleModel = profile?.courier?.motorcycleModel || '';
  const vehicleColor = profile?.courier?.motorcycleColor || '';
  const verifications = [];
  if (profile?.courier?.isVerified) verifications.push('Identity');
  if (profile?.courier?.motorcyclePlate) verifications.push('Vehicle');
  if (profile?.courier?.verificationTier === 'trusted') verifications.push('Trusted');

  return (
    <div className="space-y-6">
      <AnimatedHero title={fullName} subtitle={`${deliveries} deliveries`} fullBleed />

      <div className="px-4 md:px-6">
      <Card className="p-6 text-center">
        <Avatar name={fullName} size="xl" />
        <h1 className="font-display text-h2 font-extrabold text-gray-950 mt-4">{fullName}</h1>
        <div className="flex items-center justify-center gap-0.5 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < Math.floor(rating) ? 'text-warning fill-warning' : 'text-gray-300 fill-gray-300'}
            />
          ))}
          <span className="text-body-sm text-gray-500 ml-1">{rating || '—'}</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-tiny text-gray-500">Joined {joinDate}</span>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <Package size={20} className="text-red-600 mx-auto" />
          <p className="font-display text-h3 font-extrabold text-gray-950 mt-1">{deliveries}</p>
          <p className="text-tiny text-gray-500">Deliveries</p>
        </Card>
        <Card className="p-4 text-center">
          <Star size={20} className="text-warning mx-auto" />
          <p className="font-display text-h3 font-extrabold text-gray-950 mt-1">{rating || '—'}</p>
          <p className="text-tiny text-gray-500">Rating</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock size={20} className="text-info mx-auto" />
          <p className="font-display text-h3 font-extrabold text-gray-950 mt-1">&lt;2min</p>
          <p className="text-tiny text-gray-500">Response</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Bike size={20} className="text-gray-600" />
          <h2 className="font-display text-h4 font-bold text-gray-950">Vehicle Information</h2>
        </div>
        <div className="space-y-2 text-body-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Plate</span>
            <span className="font-semibold text-gray-950">{vehiclePlate}</span>
          </div>
          {vehicleBrand && (
          <div className="flex justify-between">
            <span className="text-gray-500">Brand</span>
            <span className="font-semibold text-gray-950">{vehicleBrand} {vehicleModel}</span>
          </div>
          )}
          {vehicleColor && (
          <div className="flex justify-between">
            <span className="text-gray-500">Color</span>
            <span className="font-semibold text-gray-950">{vehicleColor}</span>
          </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck size={20} className="text-success" />
          <h2 className="font-display text-h4 font-bold text-gray-950">Verification</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {verifications.length === 0 ? (
            <span className="text-body-sm text-gray-400">No verifications yet</span>
          ) : (
            verifications.map((tier) => (
              <VerificationBadge key={tier} tier={tier as VerificationTier} />
            ))
          )}
        </div>
      </Card>

      <Button variant="primary" fullWidth className="!h-16 !text-[18px] !font-bold font-display">
        Select Courier
      </Button>
      </div>
    </div>
  );
}
