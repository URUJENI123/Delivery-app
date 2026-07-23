'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { AlertTriangle } from 'lucide-react';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/admin/disputes').then((res) => {
      setDisputes(Array.isArray(res) ? res : res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>;

  return (
    <div>
      <AnimatedHero title="Disputes" subtitle={`${disputes.length} open`} fullBleed />

      <div className="px-4 md:px-6">
      {disputes.length === 0 ? (
        <Card><div className="text-center py-16"><div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5"><AlertTriangle size={28} className="text-neutral-400" /></div><h3 className="font-display text-xl font-bold mb-2">No disputes</h3><p className="text-neutral-500">All deliveries running smoothly.</p></div></Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-sm">Delivery #{d.delivery?.trackingCode || d.deliveryId}</h3>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-sm text-neutral-600">{d.reason}</p>
                  <p className="text-xs text-neutral-400 mt-1.5">{new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <Button variant="secondary" size="sm">Review</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
