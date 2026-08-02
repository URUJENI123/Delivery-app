'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useDeliveriesStore, type Delivery } from '@/stores/deliveries';
import { useWalletStore } from '@/stores/wallet';
import { GreetingBlock } from '@/components/ui/GreetingBlock';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { DoubleDeckHeader } from '@/components/ui/DoubleDeckHeader';
import { DeliverySliderCard } from '@/components/delivery/DeliverySliderCard';
import { DeliveryRow } from '@/components/delivery/DeliveryRow';
import { Card, StatCard } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  Package, Clock, CheckCircle, TrendingUp, Plus, Navigation,
  History, MapPin, Heart, Wallet, Bell, ChevronRight,
} from 'lucide-react';

const activeStatuses = ['BROADCAST', 'COURIER_ASSIGNED', 'COURIER_CONFIRMED', 'PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF'];

export default function SenderDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { deliveries, fetchDeliveries, loading: deliveriesLoading } = useDeliveriesStore();
  const { balance, fetchWallet } = useWalletStore();
  const [dashData, setDashData] = useState<any>(null);

  useEffect(() => {
    fetchDeliveries('sender');
    fetchWallet();
    api.get<any>('/sender/dashboard').then(setDashData).catch(() => {});
  }, [fetchDeliveries, fetchWallet]);

  const activeDeliveries = deliveries.filter((d) => activeStatuses.includes(d.status));
  const recentDeliveries = deliveries.slice(0, 5);
  const completedCount = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const activeCount = activeDeliveries.length;
  const totalSpent = dashData?.totalSpent || 0;
  const savedAddress = dashData?.savedAddresses;

  const quickActions = [
    { label: 'New Delivery', icon: Plus, href: '/send', desc: 'Send a package' },
    { label: 'Track Package', icon: Navigation, href: '/track', desc: 'Live tracking' },
    { label: 'History', icon: History, href: '/deliveries', desc: 'Past deliveries' },
  ];

  return (
    <div className="min-h-screen bg-bg-page pb-6">
      <AnimatedHero title="Dashboard" subtitle="Overview of your deliveries and account" fullBleed />
      <GreetingBlock
        firstName={user?.fullName?.split(' ')[0] || 'User'}
        role="SENDER"
        activeDeliveries={activeCount}
        avatarUrl={user?.profilePhotoUrl}
      />

      <div className="px-4 lg:px-6 space-y-4">
        {/* Active delivery card */}
        {activeCount > 0 && (
          <DeliverySliderCard
            trackingCode={activeDeliveries[0].trackingCode}
            status={activeDeliveries[0].status.replace(/_/g, ' ')}
            pickup={activeDeliveries[0].pickupAddress}
            dropoff={activeDeliveries[0].dropoffAddress}
            progressPercent={activeDeliveries[0].status === 'PICKUP_EN_ROUTE' ? 30 : activeDeliveries[0].status === 'ARRIVED_PICKUP' ? 50 : activeDeliveries[0].status === 'PICKED_UP' ? 70 : activeDeliveries[0].status === 'IN_TRANSIT' ? 85 : 20}
            eta={activeDeliveries[0].status === 'BROADCAST' ? 'Finding courier' : activeDeliveries[0].status === 'COURIER_ASSIGNED' ? 'Courier assigned' : activeDeliveries[0].status === 'COURIER_CONFIRMED' ? 'Confirmed' : activeDeliveries[0].status === 'PICKUP_EN_ROUTE' ? 'Heading to pickup' : activeDeliveries[0].status === 'ARRIVED_PICKUP' ? 'At pickup' : 'In transit'}
            courierName={activeDeliveries[0].courier?.fullName || 'Courier'}
            courierInitials={(activeDeliveries[0].courier?.fullName || 'C').charAt(0)}
            onTrack={() => router.push(`/tracking/${activeDeliveries[0].trackingCode}`)}
          />
        )}

        {/* Quick action buttons */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => router.push(a.href)}
                className="flex flex-col items-center justify-center gap-2 h-24 bg-bg-card border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                  <Icon size={22} className="text-red-600" />
                </div>
                <span className="font-body text-xs font-semibold text-gray-800">{a.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Active" value={activeCount} icon={Clock} iconBg="bg-warning-bg" iconColor="text-warning" />
          <StatCard label="Completed" value={completedCount} icon={CheckCircle} iconBg="bg-success-bg" iconColor="text-success" />
          <StatCard label="Total Spent" value={`RWF ${totalSpent.toLocaleString()}`} icon={TrendingUp} iconBg="bg-info-bg" iconColor="text-info" />
          <StatCard label="Wallet" value={`RWF ${balance.toLocaleString()}`} icon={Wallet} iconBg="bg-purple-50" iconColor="text-purple-600" link="Top up" />
        </div>

        {/* Main grid: Recent deliveries + Right sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent deliveries */}
          <div className="lg:col-span-2">
            <DoubleDeckHeader
              prefix="Your recent"
              title="Deliveries"
              onViewAll={() => router.push('/deliveries')}
              className="mb-3"
            />
            <div className="bg-bg-card border border-gray-200 rounded-lg overflow-hidden">
              {recentDeliveries.length === 0 ? (
                <div className="flex flex-col items-center py-12 px-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                    <Package className="w-7 h-7 text-red-600" />
                  </div>
                  <p className="font-display text-base font-semibold text-gray-950">Nothing on the move yet</p>
                  <p className="font-body text-sm text-gray-400 mt-2 max-w-[240px]">
                    Request your first delivery and we&apos;ll find a verified courier near you
                  </p>
                  <button
                    onClick={() => router.push('/send')}
                    className="mt-5 h-11 px-6 bg-red-600 text-white font-display text-sm font-semibold rounded-full hover:bg-red-800 transition-colors"
                  >
                    Send a Package
                  </button>
                </div>
              ) : (
                recentDeliveries.map((d) => (
                  <DeliveryRow
                    key={d.id}
                    id={d.trackingCode}
                    from={d.pickupAddress}
                    to={d.dropoffAddress}
                    status={d.status}
                    timestamp={new Date(d.createdAt).toLocaleDateString()}
                    amount={d.quotedPriceRwf}
                    onClick={() => router.push(`/deliveries/${d.id}`)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Saved Address */}
            {savedAddress && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <p className="font-display text-xs font-semibold text-gray-950">Default Pickup</p>
                </div>
                <p className="font-body text-sm text-gray-600">{savedAddress}</p>
              </Card>
            )}

            {/* Notifications */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-red-600" />
                <p className="font-display text-xs font-semibold text-gray-950">Notifications</p>
              </div>
              <div className="flex flex-col items-center py-4 text-center">
                <p className="font-body text-xs text-gray-400">No new notifications</p>
              </div>
            </Card>

            {/* Wallet Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-success" />
                  <p className="font-display text-xs font-semibold text-gray-950">Wallet</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
              <p className="font-display text-xl font-bold text-gray-950 mt-2">RWF {balance.toLocaleString()}</p>
              <button
                onClick={() => router.push('/wallet')}
                className="mt-2 h-8 px-3 bg-red-600 text-white font-display text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors"
              >
                Top Up
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
