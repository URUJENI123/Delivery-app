'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { DeliveryRow } from '@/components/delivery/DeliveryRow';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Package, Plus } from 'lucide-react';

export default function DeliveriesListPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/deliveries').then((res) => {
      setDeliveries(Array.isArray(res) ? res : res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-page">
      <AnimatedHero title="Deliveries" subtitle="View and manage all your deliveries" fullBleed />

      <div className="px-4 pb-4 lg:px-6 lg:pb-6">
        <div className="flex justify-end mb-4">
          <Link href="/send">
            <Button size="sm" className="!h-10">
              <Plus className="w-4 h-4" />
              New Delivery
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="bg-bg-card border border-gray-200 rounded-xl overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] !rounded-none border-b border-gray-150 last:border-b-0" />
            ))}
          </div>
        ) : deliveries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
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
          <div className="bg-bg-card border border-gray-200 rounded-xl overflow-hidden">
            {deliveries.map((d) => (
              <Link key={d.id} href={`/deliveries/${d.id}`}>
                <DeliveryRow
                  id={d.trackingCode}
                  from={d.pickupAddress}
                  to={d.dropoffAddress}
                  status={d.status}
                  timestamp={new Date(d.createdAt).toLocaleDateString()}
                  amount={d.quotedPriceRwf}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
