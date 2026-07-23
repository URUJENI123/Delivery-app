'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Phone, MessageSquare, CheckCircle, Clock, Star,
  CreditCard, Play, Navigation, MapPin, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapWidget } from '@/components/map/MapWidget';
import { ProgressDotTrack } from '@/components/delivery/ProgressDotTrack';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const steps = [
  { label: 'Accepted', key: 'COURIER_ASSIGNED' },
  { label: 'Confirmed', key: 'COURIER_CONFIRMED' },
  { label: 'En Route', key: 'PICKUP_EN_ROUTE' },
  { label: 'Arrived', key: 'ARRIVED_PICKUP' },
  { label: 'Delivered', key: 'DELIVERED' },
];

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [agreedPrice, setAgreedPrice] = useState('');
  const [agreedDeliveryTime, setAgreedDeliveryTime] = useState('');
  const [startOtp, setStartOtp] = useState('');
  const [completeOtp, setCompleteOtp] = useState('');
  const [stars, setStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittedRating, setSubmittedRating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!authUser) { router.push('/auth/signin'); return; }
    api.get<any>(`/deliveries/${id}`).then((res) => {
      const d = res.data || res;
      setDelivery(d);
      if (d.agreedPriceRwf) setAgreedPrice(String(d.agreedPriceRwf));
      if (d.agreedDeliveryTime) setAgreedDeliveryTime(String(d.agreedDeliveryTime));
    }).finally(() => setLoading(false));
  }, [id, router, authUser]);

  const isSender = authUser && delivery?.senderId === authUser.id;
  const isCourier = authUser && delivery?.courier?.user?.id === authUser.id;

  const refresh = () => {
    api.get<any>(`/deliveries/${id}`).then((res) => {
      const d = res.data || res;
      setDelivery(d);
      if (d.agreedPriceRwf) setAgreedPrice(String(d.agreedPriceRwf));
    });
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

  const handleRate = async () => {
    if (stars === 0) { alert('Select a rating'); return; }
    setActionLoading(true);
    try {
      await api.post(`/deliveries/${id}/rate`, { deliveryId: id, stars, comment: ratingComment });
      setSubmittedRating(true);
      refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to submit rating');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    setActionLoading(true);
    try {
      await api.post(`/deliveries/${id}/pay`, {
        agreedDeliveryTime: agreedDeliveryTime ? Number(agreedDeliveryTime) : undefined,
      });
      setPaymentSuccess(true);
      refresh();
    } catch (e: any) {
      alert(e.message || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartDelivery = async () => {
    setActionLoading(true);
    try {
      const res = await api.post<any>(`/deliveries/${id}/start-delivery`);
      const otp = res.pickupOtp;
      setStartOtp(otp || '');
      alert(`Pickup OTP: ${otp || 'N/A'} — share with sender to confirm handover`);
      refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to start delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrived = async () => {
    setActionLoading(true);
    try {
      const res = await api.post<any>(`/deliveries/${id}/arrived`);
      const dropoffOtp = res.dropoffOtp;
      setCompleteOtp(dropoffOtp || '');
      alert(`Dropoff OTP sent to recipient. OTP: ${dropoffOtp || 'N/A'} — ask recipient for it`);
      refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to mark arrived');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-64" />
      <Skeleton className="h-32" />
    </div>
  );
  if (!delivery) return (
    <div className="flex items-center justify-center py-24">
      <p className="font-body text-base text-gray-500">Delivery not found</p>
    </div>
  );

  const isTerminal = ['CANCELLED', 'DISPUTED', 'FAILED', 'DELIVERED'].includes(delivery.status);
  const showFloatingConfirm = delivery.status === 'COURIER_ASSIGNED' && (isSender || isCourier);
  const showPaymentSection = delivery.status === 'COURIER_CONFIRMED' && isSender && delivery.paymentStatus !== 'HELD';
  const showPaymentHeld = delivery.status === 'COURIER_CONFIRMED' && delivery.paymentStatus === 'HELD';
  const showStartDelivery = delivery.status === 'COURIER_CONFIRMED' && isCourier && delivery.paymentStatus === 'HELD';
  const showArrivedPickup = delivery.status === 'PICKUP_EN_ROUTE' && isCourier;
  const showCompleteDelivery = delivery.status === 'ARRIVED_PICKUP' && isCourier;
  const showArrivedDropoff = delivery.status === 'IN_TRANSIT' && isCourier;
  const showFinalizeDelivery = delivery.status === 'ARRIVED_DROPOFF' && isCourier;
  const showRateDelivery = delivery.status === 'DELIVERED' && isSender && !delivery.rating && !submittedRating;

  return (
    <div className="pb-24">
      <div className="max-w-3xl mx-auto p-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 font-body text-sm text-gray-500 mb-4 hover:text-gray-950 transition-colors h-11">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* STATUS CARD */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-display text-lg font-bold text-gray-950">Delivery</p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">#{delivery.trackingCode || delivery.id?.slice(0, 8)}</p>
                </div>
                <StatusBadge status={delivery.status} />
              </div>
              {!isTerminal && delivery.status !== 'BROADCAST' && (
                <ProgressDotTrack steps={steps} currentStep={delivery.status} />
              )}
              {delivery.status === 'BROADCAST' && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-amber-50 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <p className="font-body text-sm text-amber-700">Finding a courier nearby...</p>
                </div>
              )}
            </div>

            {/* COURIER INFO */}
            {delivery.courier && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="font-display text-sm font-semibold text-gray-950 mb-3">
                  {isCourier ? 'You' : 'Courier'}
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={delivery.courier.user?.fullName} size="lg" />
                  <div className="flex-1">
                    <p className="font-display text-sm font-semibold text-gray-950">
                      {delivery.courier.user?.fullName || 'Courier'}
                    </p>
                    <p className="font-body text-xs text-gray-400">{delivery.courier.motorcyclePlate || ''}</p>
                    {delivery.agreedDeliveryTime && (
                      <p className="font-body text-[11px] text-gray-400 mt-0.5">
                        Agreed delivery: {delivery.agreedDeliveryTime} min
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SENDER INFO FOR COURIER */}
            {isCourier && delivery.sender && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="font-display text-sm font-semibold text-gray-950 mb-3">Sender</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-display text-sm font-semibold text-gray-600">
                    {delivery.sender.fullName?.[0] || 'S'}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-gray-950">{delivery.sender.fullName || 'Sender'}</p>
                    <p className="font-body text-xs text-gray-400">{delivery.sender.phone || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* CALL / CHAT BUTTONS */}
            {(delivery.status === 'COURIER_ASSIGNED' || delivery.status === 'COURIER_CONFIRMED' || delivery.status === 'PICKUP_EN_ROUTE' || delivery.status === 'ARRIVED_PICKUP' || delivery.status === 'IN_TRANSIT' || delivery.status === 'ARRIVED_DROPOFF') && (
              <div className="flex gap-3">
                <Button
                  variant="outline-red"
                  className="flex-1 !h-11"
                  onClick={() => {
                    const phone = isCourier ? delivery.sender?.phone : delivery.courier?.user?.phone;
                    if (phone) window.location.href = `tel:${phone}`;
                    else alert('Contact not available');
                  }}
                >
                  <Phone className="w-4 h-4" /> Call
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 !h-11"
                  onClick={() => router.push(`/chat/${id}`)}
                >
                  <MessageSquare className="w-4 h-4" /> Chat
                </Button>
              </div>
            )}

            {/* PICKUP OTP ENTRY (COURIER) */}
            {showArrivedPickup && (
              <div className="p-4 border-2 border-blue-600 bg-blue-50 rounded-xl">
                <p className="font-display text-sm font-semibold text-gray-950">Confirm pickup</p>
                <p className="font-body text-xs text-gray-500 mt-1">Enter the pickup OTP shown on your screen</p>
                <input
                  type="text"
                  value={startOtp}
                  onChange={(e) => setStartOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  className="w-full h-11 mt-3 px-3 bg-white border border-gray-200 rounded-lg font-body text-sm text-center tracking-[8px]"
                  maxLength={6}
                />
                <Button
                  fullWidth
                  size="lg"
                  className="mt-3"
                  disabled={startOtp.length !== 6 || actionLoading}
                  onClick={() => {
                    act('/arrived-pickup', { otp: startOtp });
                    setStartOtp('');
                  }}
                >
                  Confirm Arrival
                </Button>
              </div>
            )}

            {/* ARRIVED AT DROPOFF — courier clicks Arrived, OTP sent to recipient */}
            {showArrivedDropoff && (
              <div className="p-4 border-2 border-green-600 bg-green-50 rounded-xl">
                <p className="font-display text-sm font-semibold text-gray-950">Arrived at drop-off</p>
                <p className="font-body text-xs text-gray-500 mt-1">
                  Click to confirm you&apos;ve arrived. An OTP will be sent to the recipient.
                </p>
                <Button
                  fullWidth
                  size="lg"
                  className="mt-3"
                  loading={actionLoading}
                  onClick={handleArrived}
                >
                  <MapPin className="w-4 h-4" /> I&apos;ve Arrived
                </Button>
              </div>
            )}

            {/* FINALIZE DELIVERY — enter OTP from recipient */}
            {showFinalizeDelivery && (
              <div className="p-4 border-2 border-green-600 bg-green-50 rounded-xl">
                <p className="font-display text-sm font-semibold text-gray-950">Complete delivery</p>
                <p className="font-body text-xs text-gray-500 mt-1">Enter the OTP sent to the recipient</p>
                <input
                  type="text"
                  value={completeOtp}
                  onChange={(e) => setCompleteOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  className="w-full h-11 mt-3 px-3 bg-white border border-gray-200 rounded-lg font-body text-sm text-center tracking-[8px]"
                  maxLength={6}
                />
                <Button
                  fullWidth
                  size="lg"
                  className="mt-3"
                  disabled={completeOtp.length !== 6 || actionLoading}
                  onClick={() => {
                    act('/complete', { otp: completeOtp });
                    setCompleteOtp('');
                  }}
                >
                  Mark as delivered
                </Button>
              </div>
            )}

            {/* START DELIVERY BUTTON (COURIER) — only after payment held */}
            {showStartDelivery && (
              <Button
                fullWidth
                size="lg"
                className="!h-14"
                loading={actionLoading}
                onClick={handleStartDelivery}
              >
                <Play className="w-5 h-5" /> Start Delivery
              </Button>
            )}

            {/* SENDER PAYMENT SECTION */}
            {showPaymentSection && (
              <div className="bg-white border-2 border-red-600 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <p className="font-display text-base font-bold text-gray-950">Confirm Payment</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-body text-sm text-gray-500">Agreed amount</span>
                    <span className="font-display text-lg font-bold text-gray-950">
                      RWF {delivery.agreedPriceRwf?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div>
                    <label className="font-body text-xs text-gray-500 mb-1 block">
                      Agreed delivery time (minutes) — optional
                    </label>
                    <input
                      type="number"
                      value={agreedDeliveryTime}
                      onChange={(e) => setAgreedDeliveryTime(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm"
                      min={1}
                    />
                  </div>
                  <Button
                    fullWidth
                    size="lg"
                    loading={actionLoading}
                    onClick={handlePay}
                    disabled={!delivery.agreedPriceRwf || delivery.agreedPriceRwf <= 0}
                  >
                    <DollarSign className="w-5 h-5" /> Pay RWF {delivery.agreedPriceRwf?.toLocaleString() || '0'}
                  </Button>
                  <p className="font-body text-xs text-gray-400 text-center">
                    Your payment will be held securely until delivery is completed
                  </p>
                </div>
              </div>
            )}

            {/* PAYMENT HELD (waiting for sender view) */}
            {showPaymentHeld && isSender && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-body text-sm text-green-700">
                    Payment of RWF {delivery.agreedPriceRwf?.toLocaleString() || '0'} held securely. Waiting for the courier to start the delivery.
                  </p>
                </div>
              </div>
            )}

            {/* PAYMENT HELD (courier sees this) */}
            {showPaymentHeld && isCourier && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-body text-sm text-green-700">
                    Payment secured! You can now start the delivery.
                  </p>
                </div>
              </div>
            )}

            {/* DELIVERY STARTED (SENDER) */}
            {(delivery.status === 'PICKUP_EN_ROUTE' || delivery.status === 'ARRIVED_PICKUP') && isSender && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <p className="font-body text-sm text-blue-700">
                    {delivery.status === 'PICKUP_EN_ROUTE' ? 'Courier is on the way!' : 'Courier has arrived at pickup point.'}
                  </p>
                </div>
              </div>
            )}

            {/* RATING SECTION (SENDER) */}
            {showRateDelivery && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="font-display text-sm font-semibold text-gray-950 mb-3">Rate your courier</p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStars(s)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        stars >= s ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Star size={18} fill={stars >= s ? 'white' : 'none'} />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Add a comment (optional)"
                  className="w-full h-10 px-3 bg-gray-100 rounded-lg font-body text-sm text-gray-950 placeholder:text-gray-400 outline-none mb-3"
                />
                <Button fullWidth size="lg" loading={actionLoading} disabled={stars === 0} onClick={handleRate}>
                  Submit Rating
                </Button>
              </div>
            )}

            {submittedRating && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-body text-sm text-green-700">Thank you for your feedback!</p>
                </div>
              </div>
            )}

            {/* DELIVERY DETAILS */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-display text-sm font-semibold text-gray-950 mb-3">Details</p>
              <div className="space-y-3 font-body text-sm">
                <div className="flex justify-between py-2 border-b border-gray-150">
                  <span className="text-gray-400">Pickup</span>
                  <span className="font-medium text-right max-w-[55%] text-gray-950">{delivery.pickupAddress}</span>
                </div>
                {delivery.pickupNotes && (
                  <div className="flex justify-between py-2 border-b border-gray-150">
                    <span className="text-gray-400">Pickup notes</span>
                    <span className="font-medium text-right max-w-[55%] text-gray-500">{delivery.pickupNotes}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-150">
                  <span className="text-gray-400">Drop-off</span>
                  <span className="font-medium text-right max-w-[55%] text-gray-950">{delivery.dropoffAddress}</span>
                </div>
                {delivery.dropoffNotes && (
                  <div className="flex justify-between py-2 border-b border-gray-150">
                    <span className="text-gray-400">Dropoff notes</span>
                    <span className="font-medium text-right max-w-[55%] text-gray-500">{delivery.dropoffNotes}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-150">
                  <span className="text-gray-400">Category</span>
                  <span className="font-medium text-gray-950">{delivery.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-150">
                  <span className="text-gray-400">Size</span>
                  <span className="font-medium text-gray-950">{delivery.size}</span>
                </div>
                {(delivery.agreedPriceRwf || delivery.finalPriceRwf || delivery.quotedPriceRwf) && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Amount</span>
                    <span className="font-display font-bold text-red-600">
                      RWF {(delivery.agreedPriceRwf || delivery.finalPriceRwf || delivery.quotedPriceRwf || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {delivery.agreedDeliveryTime && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Agreed delivery time</span>
                    <span className="font-medium text-gray-950">{delivery.agreedDeliveryTime} min</span>
                  </div>
                )}
                {delivery.paymentStatus === 'HELD' && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Payment status</span>
                    <span className="font-medium text-green-600">Held in escrow</span>
                  </div>
                )}
                {delivery.paymentStatus === 'RELEASED' && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Payment status</span>
                    <span className="font-medium text-green-600">Released to courier</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Recipient</span>
                  <span className="font-medium text-right max-w-[55%] text-gray-950">
                    {delivery.recipientName} ({delivery.recipientPhone})
                  </span>
                </div>
                {delivery.dropoffEmail && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Recipient email</span>
                    <span className="font-medium text-gray-950">{delivery.dropoffEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MAP */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-[400px] lg:h-[600px] relative">
              <MapWidget height={600} showCourier={!!delivery.courier} showRoute interactive />
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING CONFIRM BUTTON */}
      {showFloatingConfirm && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="number"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                placeholder="Agreed price (RWF)"
                className="flex-1 h-12 px-3 bg-gray-100 rounded-lg font-body text-sm font-medium text-gray-950 placeholder:text-gray-400 outline-none"
              />
              <input
                type="number"
                value={agreedDeliveryTime}
                onChange={(e) => setAgreedDeliveryTime(e.target.value)}
                placeholder="Time (min)"
                className="w-24 h-12 px-3 bg-gray-100 rounded-lg font-body text-sm font-medium text-gray-950 placeholder:text-gray-400 outline-none"
              />
              <Button
                size="lg"
                className="!h-12 !px-8"
                loading={actionLoading}
                disabled={!agreedPrice || Number(agreedPrice) <= 0}
                onClick={() => act('/confirm-agreement', {
                  agreedPriceRwf: Number(agreedPrice),
                  agreedDeliveryTime: agreedDeliveryTime ? Number(agreedDeliveryTime) : undefined,
                })}
              >
                <CheckCircle className="w-5 h-5" /> Confirm
              </Button>
            </div>
            <p className="font-body text-xs text-gray-400 text-center">
              Both you and the courier can click Confirm once the price is agreed
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
