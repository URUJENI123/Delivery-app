'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Package, Search, Filter } from 'lucide-react';

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get<any>('/admin/deliveries').then((res) => {
      setDeliveries(Array.isArray(res) ? res : res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter
    ? deliveries.filter((d) => d.status === statusFilter)
    : deliveries;

  if (loading) return <div className="space-y-4"><Skeleton className="h-72" /></div>;

  return (
    <div>
      <AnimatedHero title="Deliveries" subtitle={`${deliveries.length} total orders`} fullBleed />

      <div className="px-4 md:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className="input-base !w-full !pl-9 !h-10 text-sm" placeholder="Search deliveries..." />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base !h-10 text-sm"
          >
            <option value="">All statuses</option>
            {['BROADCAST', 'COURIER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Tracking</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Sender</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Route</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Status</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Amount</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-neutral-400">No deliveries found</td></tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-neutral-900">#{d.trackingCode || d.id?.slice(0, 8)}</td>
                      <td className="px-5 py-4 text-neutral-700">{d.sender?.fullName || d.sender?.email || '—'}</td>
                      <td className="px-5 py-4 text-neutral-700 max-w-[200px] truncate">{d.pickupAddress} → {d.dropoffAddress}</td>
                      <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                      <td className="px-5 py-4 font-semibold">RWF {(d.finalPriceRwf || d.quotedPriceRwf || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-neutral-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
