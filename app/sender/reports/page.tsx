'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { useDeliveriesStore } from '@/stores/deliveries';
import { useAuthStore } from '@/stores/auth';
import { BarChart2, Package, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const { deliveries, fetchDeliveries } = useDeliveriesStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    fetchDeliveries('sender').finally(() => setLoading(false));
  }, [user, fetchDeliveries]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-red-600 to-red-700 px-4 md:px-6 py-8 md:py-12">
          <div className="h-8 w-32 bg-white/20 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
          <div className="h-4 w-48 bg-white/20 rounded-md mt-2 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
        </div>
        <div className="px-4 md:px-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                  <div className="w-5 h-5 bg-gray-150 rounded relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                </div>
                <div className="h-9 w-16 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="h-6 w-40 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-150 last:border-b-0">
                <div className="h-4 w-24 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                <div className="h-5 w-12 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const failedDeliveries = deliveries.filter((d) => d.status === 'FAILED' || d.status === 'CANCELLED').length;
  const activeDeliveries = deliveries.filter((d) => !['DELIVERED', 'FAILED', 'CANCELLED', 'DISPUTED'].includes(d.status)).length;

  const metrics = [
    { label: 'Total Deliveries', value: totalDeliveries.toString(), icon: Package },
    { label: 'Active', value: activeDeliveries.toString(), icon: Clock },
    { label: 'Completed', value: completedDeliveries.toString(), icon: CheckCircle },
    { label: 'Failed/Cancelled', value: failedDeliveries.toString(), icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <AnimatedHero title="Reports" subtitle="Your delivery analytics" fullBleed />

      <div className="px-4 md:px-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-tiny text-gray-500 font-semibold uppercase tracking-wide">{m.label}</span>
                  <Icon size={18} className="text-gray-400" />
                </div>
                <p className="font-display text-h1 font-extrabold text-gray-950 leading-none">{m.value || '0'}</p>
              </Card>
            );
          })}
        </div>

        <Card className="p-5">
          <h3 className="font-display text-h4 font-bold text-gray-950 mb-4">Delivery Breakdown</h3>
          {totalDeliveries === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <BarChart2 className="w-8 h-8 text-gray-300 mb-2" />
              <p className="font-body text-sm text-gray-400">No delivery data yet. Create your first delivery to see stats here.</p>
              <Button variant="primary" className="mt-4" onClick={() => router.push('/send')}>
                Send a Package
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-150">
                <span className="text-body-sm text-gray-600">Total Deliveries</span>
                <span className="font-display text-h4 font-bold text-gray-950">{totalDeliveries}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-150">
                <span className="text-body-sm text-gray-600">Completed</span>
                <span className="font-display text-h4 font-bold text-success">{completedDeliveries}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-150">
                <span className="text-body-sm text-gray-600">Active</span>
                <span className="font-display text-h4 font-bold text-warning">{activeDeliveries}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-body-sm text-gray-600">Failed / Cancelled</span>
                <span className="font-display text-h4 font-bold text-danger">{failedDeliveries}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
