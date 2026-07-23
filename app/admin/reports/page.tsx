'use client';

import { useEffect, useState } from 'react';
import { Card, StatCard } from '@/components/ui/card';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminStore } from '@/stores/admin';
import { useDeliveriesStore } from '@/stores/deliveries';
import { Users, Bike, Package, DollarSign, Award, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AdminReportsPage() {
  const { stats, fetchStats } = useAdminStore();
  const { deliveries, fetchDeliveries } = useDeliveriesStore();

  useEffect(() => {
    fetchStats();
    fetchDeliveries('admin');
  }, [fetchStats, fetchDeliveries]);

  const kpis = [
    { label: 'Total Revenue', value: stats?.totalRevenue ? `RWF ${(stats.totalRevenue / 1000000).toFixed(1)}M` : '—', icon: DollarSign, iconBg: 'bg-success-bg', iconColor: 'text-success' },
    { label: 'Avg. Delivery Value', value: deliveries.length > 0 ? `RWF ${Math.round((stats?.totalRevenue || 0) / deliveries.length / 1000)}K` : '—', icon: TrendingUp, iconBg: 'bg-info-bg', iconColor: 'text-info' },
    { label: 'Avg. Rating', value: stats?.avgRating ? stats.avgRating.toFixed(1) : '—', icon: Award, iconBg: 'bg-warning-bg', iconColor: 'text-warning' },
    { label: 'Total Deliveries', value: deliveries.length.toLocaleString(), icon: Package, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <AnimatedHero title="Reports" subtitle="Platform analytics and insights" fullBleed />

      <div className="px-4 md:px-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} iconBg={kpi.iconBg} iconColor={kpi.iconColor} />
          ))}
        </div>

          <Card className="p-4">
            <p className="text-label text-neutral-500 uppercase tracking-wide mb-4">Delivery Breakdown</p>
            <div className="h-48 flex items-center justify-center">
              <div className="space-y-4 w-full max-w-xs">
                <div className="flex items-center justify-between py-2 border-b border-neutral-150">
                  <span className="text-body-sm text-neutral-600">Today</span>
                  <span className="font-display text-h4 font-bold text-neutral-900">{deliveries.filter(d => new Date(d.createdAt).toDateString() === new Date().toDateString()).length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-150">
                  <span className="text-body-sm text-neutral-600">This Week</span>
                  <span className="font-display text-h4 font-bold text-neutral-900">{deliveries.filter(d => { const w = new Date(); w.setDate(w.getDate() - w.getDay()); return new Date(d.createdAt) >= w; }).length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-body-sm text-neutral-600">Total</span>
                  <span className="font-display text-h4 font-bold text-neutral-900">{deliveries.length}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-label text-neutral-500 uppercase tracking-wide mb-4">Platform Summary</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-neutral-150">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-info" />
                  <span className="text-body-sm text-neutral-600">Total Users</span>
                </div>
                <span className="font-display text-h4 font-bold text-neutral-900">{stats?.totalUsers?.toLocaleString() || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-neutral-150">
                <div className="flex items-center gap-3">
                  <Bike size={18} className="text-success" />
                  <span className="text-body-sm text-neutral-600">Active Couriers</span>
                </div>
                <span className="font-display text-h4 font-bold text-neutral-900">{stats?.totalCouriers?.toLocaleString() || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-neutral-150">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-warning" />
                  <span className="text-body-sm text-neutral-600">Total Deliveries</span>
                </div>
                <span className="font-display text-h4 font-bold text-neutral-900">{deliveries.length.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <DollarSign size={18} className="text-success" />
                  <span className="text-body-sm text-neutral-600">Total Revenue</span>
                </div>
                <span className="font-display text-h4 font-bold text-success">RWF {stats?.totalRevenue?.toLocaleString() || '—'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}
