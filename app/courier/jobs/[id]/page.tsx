'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import {
  MapPin, ChevronLeft, Navigation, Phone, MessageSquare,
  CheckCircle, Clock, DollarSign,
} from 'lucide-react';

export default function CourierJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get<any>(`/deliveries/${id}`).then((res) => {
      setJob(res.data || res);
    }).finally(() => setLoading(false));
  }, [id]);

  const refresh = () => {
    api.get<any>(`/deliveries/${id}`).then((res) => setJob(res.data || res));
  };

  const act = async (endpoint: string, body?: any) => {
    setActionLoading(true);
    try {
      await api.post(`/deliveries/${id}${endpoint}`, body);
      refresh();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTakeJob = async () => {
    setActionLoading(true);
    try {
      await api.post(`/deliveries/${id}/take-job`, {});
      refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to take job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrived = async () => {
    setActionLoading(true);
    try {
      const res = await api.post<any>(`/deliveries/${id}/arrived`);
      setOtp(res.dropoffOtp || '');
      alert(`Dropoff OTP sent to recipient. OTP: ${res.dropoffOtp || 'N/A'}`);
      refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to mark arrived');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await api.post(`/deliveries/${id}/complete`, { otp });
      setOtp('');
      refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to complete delivery');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="space-y-6 p-4"><Skeleton className="h-72" /><Skeleton className="h-48" /></div>;
  if (!job) return <div className="text-center py-24"><p className="text-gray-500 text-lg">Job not found</p></div>;

  const isTaken = job.status !== 'BROADCAST' && job.courierId;

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-gray-950 transition-colors cursor-pointer font-medium">
        <ChevronLeft size={16} />Back
      </button>
      <div className="space-y-5">
        {/* Map placeholder */}
        <Card className="!p-0 overflow-hidden">
          <div className="h-[200px] bg-gray-100 flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg-card border border-gray-200 flex items-center justify-center mx-auto mb-2">
                <MapPin size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-800">{job.pickupAddress}</p>
              <p className="text-xs text-gray-400 mt-1">&rarr; {job.dropoffAddress}</p>
            </div>
          </div>
        </Card>

        {/* Job Details */}
        <Card>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight text-gray-950">Job details</h1>
              <p className="text-xs font-mono text-gray-400 mt-1">#{job.trackingCode}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2.5 border-b border-gray-100">
              <span className="text-gray-500">Pickup</span>
              <span className="font-bold text-right max-w-[55%]">{job.pickupAddress}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-100">
              <span className="text-gray-500">Drop-off</span>
              <span className="font-bold text-right max-w-[55%]">{job.dropoffAddress}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-100">
              <span className="text-gray-500">Item</span>
              <span className="font-bold">{job.itemDescription} ({job.category})</span>
            </div>
            {job.recipientName && (
              <div className="flex justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500">Recipient</span>
                <span className="font-bold">{job.recipientName} &middot; {job.recipientPhone}</span>
              </div>
            )}
            {job.estimatedDistance && (
              <div className="flex justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500">Distance</span>
                <span className="font-bold">{job.estimatedDistance} km</span>
              </div>
            )}
            <div className="flex justify-between py-2.5">
              <span className="text-gray-500">Earnings</span>
              <span className="font-extrabold text-red-600 text-lg">
                RWF {(job.agreedPriceRwf || job.finalPriceRwf || job.quotedPriceRwf || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* JOB IS AVAILABLE - Take it */}
        {job.status === 'BROADCAST' && !job.courierId && (
          <Button
            fullWidth
            size="lg"
            className="!h-14 !text-base font-bold"
            loading={actionLoading}
            onClick={handleTakeJob}
          >
            <CheckCircle className="w-5 h-5" /> Take the Job
          </Button>
        )}

        {/* JOB WAS TAKEN BY SOMEONE ELSE */}
        {job.status === 'BROADCAST' && !isTaken && (
          <Card className="p-6 text-center border-2 border-amber-200 bg-amber-50">
            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="font-bold text-gray-950">Job was taken</p>
            <p className="text-sm text-gray-500 mt-1">Another courier has already accepted this delivery.</p>
          </Card>
        )}

        {/* CALL / CHAT (when assigned or later) */}
        {isTaken && job.status !== 'DELIVERED' && job.status !== 'CANCELLED' && (
          <div className="flex gap-3">
            <Button
              variant="outline-red"
              className="flex-1 !h-11"
              onClick={() => {
                const phone = job.sender?.phone;
                if (phone) window.location.href = `tel:${phone}`;
                else alert('Sender contact not available');
              }}
            >
              <Phone className="w-4 h-4" /> Call Sender
            </Button>
            <Button
              variant="secondary"
              className="flex-1 !h-11"
              onClick={() => router.push(`/chat/${id}`)}
            >
              <MessageSquare className="w-4 h-4" /> Chat Sender
            </Button>
          </div>
        )}

        {/* ARRIVED AT DROPOFF */}
        {job.status === 'IN_TRANSIT' && (
          <Button
            fullWidth
            size="lg"
            className="!h-14 !text-base font-bold"
            loading={actionLoading}
            onClick={handleArrived}
          >
            <Navigation className="w-5 h-5" /> I&apos;ve Arrived at Drop-off
          </Button>
        )}

        {/* COMPLETE DELIVERY - OTP SECTION */}
        {job.status === 'ARRIVED_DROPOFF' && (
          <Card className="!border-2 !border-green-600">
            <h2 className="font-display text-lg font-bold text-center text-gray-950 mb-2">Enter recipient OTP</h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              Ask the recipient for the code sent to their phone/email/WhatsApp
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg font-body text-lg text-center tracking-[10px]"
              maxLength={6}
            />
            <Button
              fullWidth
              size="lg"
              className="mt-4"
              disabled={otp.length !== 6 || actionLoading}
              loading={actionLoading}
              onClick={handleComplete}
            >
              <CheckCircle className="w-5 h-5" /> Confirm Delivery
            </Button>
          </Card>
        )}

        {/* DELIVERED */}
        {job.status === 'DELIVERED' && (
          <Card className="p-6 text-center border-2 border-green-200 bg-green-50">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <p className="font-bold text-lg text-gray-950">Delivery completed</p>
            <p className="text-sm text-gray-500 mt-1">
              RWF {((job.agreedPriceRwf || job.finalPriceRwf || job.quotedPriceRwf || 0) - 100).toLocaleString()} credited to your wallet
            </p>
          </Card>
        )}

        {/* Sender Info */}
        {job.sender && (
          <Card>
            <h3 className="font-display text-base font-extrabold tracking-tight mb-4">Sender</h3>
            <div className="flex items-center gap-4">
              <Avatar name={job.sender.fullName} size="md" />
              <div className="flex-1">
                <p className="font-extrabold text-sm">{job.sender.fullName || 'Sender'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{job.sender.phone || ''}</p>
              </div>
              <Button
                variant="outline-red"
                className="!h-10 !w-10 !p-0"
                onClick={() => {
                  if (job.sender.phone) window.location.href = `tel:${job.sender.phone}`;
                  else alert('Phone not available');
                }}
              >
                <Phone size={16} />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
