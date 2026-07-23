'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useDeliveriesStore, type Delivery } from '@/stores/deliveries';
import { GreetingBlock } from '@/components/ui/GreetingBlock';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { DoubleDeckHeader } from '@/components/ui/DoubleDeckHeader';
import { DeliverySliderCard } from '@/components/delivery/DeliverySliderCard';
import { AvailableJobCard } from '@/components/delivery/AvailableJobCard';
import { Card, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  Bike, TrendingUp, DollarSign, Package, Star, MapPin,
  Phone, MessageCircle, ChevronRight, Clock, CheckCircle, Award,
} from 'lucide-react';

export default function CourierDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dashData, setDashData] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [dash, jobs] = await Promise.all([
        api.get<any>('/couriers/dashboard'),
        api.get<any>('/deliveries/available'),
      ]);
      setDashData(dash);
      setAvailableJobs(Array.isArray(jobs) ? jobs : jobs.data || []);
      if (dash.courier?.isOnline !== undefined) {
        setIsOnline(dash.courier.isOnline);
      }
    } catch (e) {
      console.error('Failed to load courier dashboard', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleOnline = useCallback(async () => {
    setOnlineLoading(true);
    const next = !isOnline;
    try {
      await api.put('/couriers/me/online', { isOnline: next });
      setIsOnline(next);
    } catch {}
    setOnlineLoading(false);
  }, [isOnline]);

  const courier = dashData?.courier;
  const activeJob = dashData?.activeJob;
  const todayEarnings = dashData?.todayEarnings || 0;
  const monthEarnings = dashData?.monthEarnings || 0;
  const todayDeliveries = dashData?.todayDeliveries || 0;
  const weekDeliveries = dashData?.weekDeliveries || 0;
  const monthDeliveries = dashData?.monthDeliveries || 0;
  const avgRating = dashData?.avgRating || 0;
  const totalRatings = dashData?.totalRatings || 0;

  const completionRate = courier?.completionRate || 0;
  const totalDeliveries = courier?.totalDeliveries || 0;
  const totalEarnings = courier?.totalEarnings || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page">
        <div className="px-4 pt-4 space-y-4">
          <div className="h-10 w-48 bg-gray-150 rounded-lg animate-pulse" />
          <div className="h-8 w-64 bg-gray-150 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 bg-gray-150 rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-150 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page pb-6">
      <AnimatedHero title="Dashboard" subtitle="Manage your jobs and earnings" fullBleed />
      <GreetingBlock
        firstName={user?.fullName?.split(' ')[0] || 'Courier'}
        role="COURIER"
        isOnline={isOnline}
        onToggleOnline={toggleOnline}
        avatarUrl={user?.profilePhotoUrl}
      />

      <div className="px-4 lg:px-6 space-y-4">
        {/* Active Job */}
        {activeJob ? (
          <div>
            <DeliverySliderCard
              trackingCode={activeJob.trackingCode}
              status={activeJob.status.replace(/_/g, ' ')}
              pickup={activeJob.pickupAddress}
              dropoff={activeJob.dropoffAddress}
              progressPercent={activeJob.status === 'PICKUP_EN_ROUTE' ? 30 : activeJob.status === 'ARRIVED_PICKUP' ? 50 : activeJob.status === 'PICKED_UP' ? 70 : activeJob.status === 'IN_TRANSIT' ? 85 : activeJob.status === 'ARRIVED_DROPOFF' ? 95 : 20}
              eta={activeJob.status === 'PICKUP_EN_ROUTE' ? 'Heading to pickup' : activeJob.status === 'ARRIVED_PICKUP' ? 'At pickup' : activeJob.status === 'PICKED_UP' ? 'En route to drop-off' : activeJob.status === 'IN_TRANSIT' ? 'In transit' : 'Processing'}
              courierName={user?.fullName || 'You'}
              onTrack={() => router.push(`/deliveries/${activeJob.id}`)}
            />
            <div className="flex gap-2 mt-2">
              <Button
                variant="primary"
                className="flex-1 h-12 !rounded-lg font-display text-sm font-bold"
                onClick={() => router.push(`/deliveries/${activeJob.id}`)}
              >
                View Job Details
              </Button>
              <button
                className="h-12 w-12 rounded-lg bg-success-bg border border-success/30 flex items-center justify-center"
                onClick={() => router.push(`/chat/${activeJob.id}`)}
              >
                <MessageCircle className="w-5 h-5 text-success" />
              </button>
              <button
                className="h-12 w-12 rounded-lg bg-info-bg border border-info/30 flex items-center justify-center"
                onClick={() => {
                  const phone = activeJob.sender?.phone;
                  if (phone) window.location.href = `tel:${phone}`;
                  else alert('Sender contact not available');
                }}
              >
                <Phone className="w-5 h-5 text-info" />
              </button>
            </div>
          </div>
        ) : (
          /* Earnings spotlight (when no active job) */
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-5 bg-gradient-to-br from-red-600 to-red-800 border-none">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-white/80" />
                <p className="font-body text-[11px] text-white/80 uppercase tracking-wide">Today</p>
              </div>
              <p className="font-display text-2xl font-bold text-white">RWF {todayEarnings.toLocaleString()}</p>
              <p className="font-body text-[11px] text-white/60 mt-1">{todayDeliveries} delivery{todayDeliveries !== 1 ? 'ies' : 'y'}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <p className="font-body text-[11px] text-gray-400 uppercase tracking-wide">This Month</p>
              </div>
              <p className="font-display text-2xl font-bold text-gray-950">RWF {monthEarnings.toLocaleString()}</p>
              <p className="font-body text-[11px] text-gray-400 mt-1">{monthDeliveries} delivery{monthDeliveries !== 1 ? 'ies' : 'y'}</p>
            </Card>
          </div>
        )}

        {/* Delivery Stats */}
        <div>
          <DoubleDeckHeader prefix="Your stats" title="Deliveries" className="mb-3" />
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Today', value: todayDeliveries },
              { label: 'Week', value: weekDeliveries },
              { label: 'Month', value: monthDeliveries },
              { label: 'Rate', value: `${completionRate ? (completionRate * 100).toFixed(0) : 0}%` },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                <p className="font-display text-lg font-bold text-gray-950">{s.value}</p>
                <p className="font-body text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance + Rating */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-warning" />
              <p className="font-display text-xs font-semibold text-gray-950">Rating</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold text-gray-950">{avgRating.toFixed(1)}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${star <= Math.round(avgRating) ? 'text-warning fill-warning' : 'text-gray-200'}`}
                  />
                ))}
              </div>
            </div>
            <p className="font-body text-[11px] text-gray-400 mt-1">{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bike className="w-4 h-4 text-red-600" />
              <p className="font-display text-xs font-semibold text-gray-950">Total</p>
            </div>
            <p className="font-display text-2xl font-bold text-gray-950">{totalDeliveries}</p>
            <p className="font-body text-[11px] text-gray-400 mt-1">Lifetime deliveries</p>
          </Card>
        </div>

        {/* Available Jobs (when online) */}
        {isOnline && (
          <div>
            <DoubleDeckHeader
              prefix="Near you in Kigali"
              title="Available Jobs"
              onViewAll={() => router.push('/courier/jobs')}
              className="mb-3"
            />
            {availableJobs.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Bike className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-display text-sm font-semibold text-gray-950">No jobs near you right now</p>
                <p className="font-body text-xs text-gray-400 mt-1 max-w-[220px] mx-auto">
                  We&apos;ll notify you the moment a delivery comes in
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {availableJobs.slice(0, 3).map((job: any) => (
                  <AvailableJobCard
                    key={job.id}
                    distance={job.distance ? `${job.distance.toFixed(1)} km` : 'Nearby'}
                    price={job.quotedPriceRwf || 0}
                    pickup={job.pickupAddress}
                    dropoff={job.dropoffAddress}
                    pickupEta={job.pickupEta || 'ASAP'}
                    weight={job.itemDescription || 'Small'}
                    onAccept={async () => {
                      try {
                        await api.post(`/deliveries/${job.id}/take-job`, {});
                        router.push(`/deliveries/${job.id}`);
                      } catch (e: any) {
                        alert(e.message || 'Failed to take job');
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Offline prompt */}
        {!isOnline && !activeJob && (
          <Card className="p-6 bg-gradient-to-br from-gray-50 to-white border-dashed border-gray-300">
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-display text-sm font-semibold text-gray-950">You&apos;re offline</p>
              <p className="font-body text-xs text-gray-400 mt-1 max-w-[240px] mx-auto">
                Tap &quot;Go Online&quot; above to start receiving delivery opportunities
              </p>
              <button
                onClick={toggleOnline}
                className="mt-4 h-11 px-6 bg-red-600 text-white font-display text-sm font-semibold rounded-full hover:bg-red-800 transition-colors inline-flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-green-pulse" />
                Go Online
              </button>
            </div>
          </Card>
        )}

        {/* Earnings Breakdown */}
        <Card className="p-4">
          <DoubleDeckHeader prefix="Total" title="Earnings Breakdown" className="mb-3" />
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-body text-sm text-gray-600">Today</span>
              <span className="font-display text-sm font-bold text-gray-950">RWF {todayEarnings.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-body text-sm text-gray-600">This Month</span>
              <span className="font-display text-sm font-bold text-gray-950">RWF {monthEarnings.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-body text-sm font-semibold text-gray-950">All Time</span>
              <span className="font-display text-sm font-bold text-red-600">RWF {totalEarnings.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Quick action: View all jobs */}
        <Button
          variant="secondary"
          fullWidth
          className="!h-14 !rounded-xl font-display text-sm font-bold"
          onClick={() => router.push('/courier/jobs')}
        >
          View All Jobs
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
