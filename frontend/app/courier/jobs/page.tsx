'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Package } from 'lucide-react';

export default function CourierJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/deliveries').then((res) => {
      setJobs(Array.isArray(res) ? res : res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;

  const activeJobs = jobs.filter((j) => ['PICKUP_EN_ROUTE','ARRIVED_PICKUP','PICKED_UP','IN_TRANSIT','ARRIVED_DROPOFF'].includes(j.status));
  const pastJobs = jobs.filter((j) => ['DELIVERED','CANCELLED','FAILED'].includes(j.status));

  return (
    <div className="space-y-8">
      <AnimatedHero title="My jobs" subtitle={`${jobs.length} total deliveries`} fullBleed />

      <div className="px-4 md:px-6">
      {jobs.length === 0 ? (
        <Card><div className="text-center py-16"><div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5"><Package size={28} className="text-gray-400" /></div><h2 className="font-display text-xl font-extrabold tracking-tight mb-2">No jobs yet</h2><p className="text-gray-500">Go online to receive delivery jobs.</p></div></Card>
      ) : (
        <>
          {activeJobs.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-4">Active &mdash; {activeJobs.length}</h2>
              <div className="space-y-3">
                {activeJobs.map((job) => (
                  <Link key={job.id} href={`/courier/jobs/${job.id}`}>
                    <Card className="cursor-pointer hover:bg-gray-50 transition-all duration-200 !border-red-600 !border-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{job.pickupAddress} &rarr; {job.dropoffAddress}</p>
                          <p className="text-sm text-gray-500 mt-1">{job.recipientName}</p>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {pastJobs.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-4">Completed &mdash; {pastJobs.length}</h2>
              <div className="space-y-2">
                {pastJobs.slice(0, 20).map((job) => (
                  <Link key={job.id} href={`/courier/jobs/${job.id}`}>
                    <Card className="cursor-pointer hover:bg-gray-50 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{job.pickupAddress} &rarr; {job.dropoffAddress}</p>
                          <p className="text-sm text-gray-500 mt-1">{job.quotedPriceRwf?.toLocaleString()} RWF</p>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
