'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Search, CheckCircle, XCircle } from 'lucide-react';

export default function AdminCouriersPage() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/admin/couriers').then((res) => {
      setCouriers(Array.isArray(res) ? res : res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const toggleVerify = async (id: string, approved: boolean) => {
    await api.put(`/admin/couriers/${id}/verify`, { approved, tier: 'VEHICLE' });
    setCouriers((prev) => prev.map((c) => c.id === id ? { ...c, isApprovedByAdmin: approved } : c));
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-72" /></div>;

  return (
    <div>
      <AnimatedHero title="Couriers" subtitle={`${couriers.length} registered`} fullBleed />

      <div className="px-4 md:px-6">
        <div className="flex justify-end mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className="input-base !w-64 !pl-9 !h-10 text-sm" placeholder="Search couriers..." />
          </div>
        </div>
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Name</th>
                <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Phone</th>
                <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Tier</th>
                <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Status</th>
                <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Deliveries</th>
                <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Rating</th>
                <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-4 font-bold">{c.user?.fullName || 'Unnamed'}</td>
                  <td className="px-5 py-4 text-neutral-500">{c.user?.phone}</td>
                  <td className="px-5 py-4"><Badge color={c.verificationTier === 'TRUSTED' ? 'green' : 'default'}>{c.verificationTier}</Badge></td>
                  <td className="px-5 py-4">
                    {c.isApprovedByAdmin ? (
                      <span className="flex items-center gap-1.5 text-success font-semibold"><CheckCircle size={14} /> Approved</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-warning font-semibold"><XCircle size={14} /> Pending</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold">{c.totalDeliveries}</td>
                  <td className="px-5 py-4 font-semibold">{c.avgRating?.toFixed(1) || '-'}</td>
                  <td className="px-5 py-4">
                    {!c.isApprovedByAdmin && (
                      <Button size="sm" onClick={() => toggleVerify(c.id, true)}>Approve</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  );
}
