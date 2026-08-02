'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DoubleDeckHeader } from '@/components/ui/DoubleDeckHeader';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { DeliveryRow } from '@/components/delivery/DeliveryRow';
import { Button } from '@/components/ui/button';
import { Bike, Clock, Star } from 'lucide-react';
import { useDeliveriesStore } from '@/stores/deliveries';
import { useWalletStore } from '@/stores/wallet';
import { api } from '@/lib/api';

export default function CourierEarningsPage() {
  const router = useRouter();
  const { deliveries, fetchDeliveries } = useDeliveriesStore();
  const { balance, fetchWallet } = useWalletStore();
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDeliveries('courier'),
      fetchWallet(),
      api.get<any>('/couriers/me/earnings').then(setEarnings).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [fetchDeliveries, fetchWallet]);

  const totalTrips = earnings?.totalDeliveries || deliveries.length;
  const completedTrips = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const avgRating = earnings?.avgRating || 0;
  const completionRate = earnings?.completionRate || (totalTrips > 0 ? completedTrips / totalTrips : 0);

  return (
    <div className="min-h-screen bg-bg-page">
      <AnimatedHero title="Earnings" subtitle="Track your income and performance" fullBleed />

      <div className="px-4 pb-4 lg:px-6 lg:pb-6 space-y-4">
        <div className="bg-bg-card border border-gray-200 rounded-xl p-5">
          <p className="font-body text-xs text-gray-400">Wallet Balance</p>
          <p className="font-display text-[36px] font-bold text-red-600 mt-1.5">
            RWF {(balance || 0).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: completedTrips, label: 'Deliveries', icon: Bike },
            { value: `${(completionRate * 100).toFixed(0)}%`, label: 'Completion', icon: Clock },
            { value: avgRating ? avgRating.toFixed(1) : '—', label: 'Rating', icon: Star },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-bg-card border border-gray-200 rounded-lg p-4 text-center">
                <p className="font-display text-xl font-bold text-gray-950">{item.value}</p>
                <p className="font-body text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                  <Icon className="w-3 h-3" />
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>

        <DoubleDeckHeader prefix="Recently" title="Completed" />
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-bg-card border border-gray-200 rounded-xl overflow-hidden">
                <div className="h-[76px] bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-bg-card border border-gray-200 rounded-xl overflow-hidden">
            {deliveries.filter(d => d.status === 'DELIVERED').length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Bike className="w-8 h-8 text-gray-300 mb-2" />
                <p className="font-body text-sm text-gray-400">No completed deliveries yet</p>
              </div>
            ) : (
              deliveries.filter(d => d.status === 'DELIVERED').slice(0, 5).map((d) => (
                <DeliveryRow
                  key={d.id}
                  id={d.trackingCode}
                  from={d.pickupAddress}
                  to={d.dropoffAddress}
                  status={d.status}
                  timestamp={new Date(d.createdAt).toLocaleDateString()}
                  amount={d.quotedPriceRwf}
                />
              ))
            )}
          </div>
        )}

        <Button variant="primary" fullWidth className="!h-12" onClick={() => router.push('/courier/dashboard')}>
          View Dashboard
        </Button>
      </div>
    </div>
  );
}
