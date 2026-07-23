'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Bell, Phone, MessageSquare, Clock, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { OTPInput } from '@/components/ui/OTPInput';
import { MapWidget } from '@/components/map/MapWidget';
import { ProgressDotTrack } from '@/components/delivery/ProgressDotTrack';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const deliverySteps = [
  { label: 'Created', key: 'CREATED' },
  { label: 'Assigned', key: 'ASSIGNED' },
  { label: 'Picked Up', key: 'PICKED_UP' },
  { label: 'In Transit', key: 'IN_TRANSIT' },
  { label: 'Delivered', key: 'DELIVERED' },
];

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOTP, setShowOTP] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<any>(`/track/${id}`).then(setDelivery).catch(() => setDelivery(null)).finally(() => setLoading(false));
  }, [id]);

  const handleOTPComplete = (otp: string) => {
    api.post(`/track/${id}/confirm-otp`, { otp }).then(() => {
      window.location.reload();
    });
  };

  if (loading) {
    return <div className="p-4"><Skeleton className="h-[80vh]" /></div>;
  }

  const courierName = delivery?.courier?.fullName || delivery?.courier?.user?.fullName || 'Courier';
  const courierInitials = (courierName || 'C').charAt(0).toUpperCase();

  const statusKey = delivery?.status === 'DELIVERED' ? 'DELIVERED'
    : delivery?.status === 'IN_TRANSIT' || delivery?.status === 'PICKED_UP' || delivery?.status === 'ARRIVED_DROPOFF' ? 'IN_TRANSIT'
    : delivery?.status === 'PICKUP_EN_ROUTE' || delivery?.status === 'ARRIVED_PICKUP' || delivery?.status === 'COURIER_CONFIRMED' || delivery?.status === 'COURIER_ASSIGNED' ? 'ASSIGNED'
    : 'CREATED';

  const sheetContent = (
    <>
      <div className="px-4 pt-1 pb-3 flex flex-col items-center">
        <div className="-mt-8 w-14 h-14 rounded-full overflow-hidden bg-red-600 border-[3px] border-white flex items-center justify-center">
          <span className="font-display text-lg font-bold text-white">{courierInitials}</span>
        </div>
        <p className="font-display text-base font-semibold text-gray-950 mt-2">{courierName}</p>
        <span className="inline-flex items-center gap-1 font-body text-xs font-medium text-success">
          <CheckCircle className="w-3 h-3" />
          Verified Courier
        </span>
      </div>

      <div className="mx-4 bg-gray-50 rounded-lg p-3 flex items-center justify-around">
        <div className="text-center">
          <p className="font-display text-sm font-semibold text-gray-950">{delivery?.courier?.avgRating ? Number(delivery.courier.avgRating).toFixed(1) : '—'}</p>
          <p className="font-body text-[11px] text-gray-400">Stars</p>
        </div>
        <div className="text-center">
          <p className="font-display text-sm font-semibold text-gray-950">{delivery?.courier?.totalDeliveries || 0}</p>
          <p className="font-body text-[11px] text-gray-400">Trips</p>
        </div>
        <div className="text-center">
          <p className="font-display text-sm font-semibold text-gray-950">{delivery?.courier?.yearsActive || '—'}</p>
          <p className="font-body text-[11px] text-gray-400">Active</p>
        </div>
      </div>

      <div className="flex gap-2 px-4 mt-3">
        <Button variant="outline-red" size="md" className="flex-1 !h-11">
          <Phone className="w-4 h-4" />
          Call
        </Button>
        <Button variant="secondary" size="md" className="flex-1 !h-11">
          <MessageSquare className="w-4 h-4" />
          Message
        </Button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-150 px-4">
        <p className="font-body text-xs text-gray-400 mb-2 text-center">Status</p>
        <ProgressDotTrack steps={deliverySteps} currentStep={statusKey} />
      </div>

      {showOTP && (
        <div className="mx-4 mt-3 p-4 border-2 border-red-600 bg-red-50 rounded-lg">
          <p className="font-display text-sm font-semibold text-gray-950">Confirm handover</p>
          <p className="font-body text-xs text-gray-500 mt-1">Show this code to the courier</p>
          <div className="mt-3">
            <OTPInput length={6} onComplete={handleOTPComplete} />
          </div>
        </div>
      )}

      <div className="px-4 py-3 mt-2 border-t border-gray-150 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="font-body text-[11px] text-gray-400">Estimated arrival</span>
        </div>
        {delivery?.deliveredAt ? (
          <span className="font-display text-lg font-bold text-success">Delivered</span>
        ) : (
          <span className="font-display text-xl font-bold text-gray-950">{delivery?.estimatedEta || '—'}</span>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      <div className="lg:hidden relative h-screen">
        <MapWidget height={1000} showCourier showRoute interactive className="absolute inset-0" />
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-950" />
          </button>
          <span className="font-display text-sm font-semibold text-white bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
            Live Tracking
          </span>
          <button className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-950" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-white rounded-t-[20px] border-t border-gray-200 max-h-[60vh] overflow-y-auto">
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-8 h-1 rounded-full bg-gray-200" />
            </div>
            {sheetContent}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex h-screen">
        <div className="w-[380px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto pt-4">
          {sheetContent}
        </div>
        <div className="flex-1 relative">
          <MapWidget height={1000} showCourier showRoute interactive className="absolute inset-0" />
          <div className="absolute top-4 left-4 z-10">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-gray-950" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
