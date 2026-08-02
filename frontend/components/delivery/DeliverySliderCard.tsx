'use client';

import { cn } from '@/lib/utils';
import { Bike, ChevronRight, MapPin } from 'lucide-react';

interface DeliverySliderCardProps {
  trackingCode: string;
  status: string;
  pickup: string;
  dropoff: string;
  pickupTime?: string;
  dropoffTime?: string;
  eta?: string;
  progressPercent: number;
  courierName?: string;
  courierPhoto?: string;
  courierInitials?: string;
  onTrack?: () => void;
  className?: string;
}

export function DeliverySliderCard({
  trackingCode,
  status,
  pickup,
  dropoff,
  pickupTime,
  dropoffTime,
  eta,
  progressPercent,
  courierName,
  courierPhoto,
  courierInitials,
  onTrack,
  className,
}: DeliverySliderCardProps) {
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  return (
    <div className={cn('bg-white border-2 border-red-600 rounded-xl p-4 md:p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[11px] md:text-xs font-semibold text-gray-500 truncate">#{trackingCode}</span>
        <span className="font-display text-[11px] md:text-xs font-semibold text-red-600 whitespace-nowrap">{status}</span>
      </div>

      <div className="mt-3 flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
        <div className="flex-shrink-0 space-y-2 md:space-y-3 min-w-0">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0 hidden md:block" />
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-gray-950 truncate">{pickup}</p>
              {pickupTime && <p className="font-body text-[11px] text-gray-400">{pickupTime}</p>}
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <div className="w-3.5 flex-shrink-0 hidden md:flex justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-gray-950 truncate">{dropoff}</p>
              {dropoffTime && <p className="font-body text-[11px] text-gray-400">{dropoffTime}</p>}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 md:ml-4">
          <div className="relative w-full h-[6px] bg-gray-200 rounded-full overflow-visible">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-800 ease-in-out"
              style={{ width: `${clampedProgress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-red-600 border-[3px] border-white rounded-full flex items-center justify-center transition-all duration-800 ease-in-out"
              style={{ left: `calc(${clampedProgress}% - 10px)` }}
            >
              <Bike className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-success" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-600" />
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="font-body text-[10px] text-gray-400">Pickup</span>
            {eta && (
              <span className="inline-flex items-center px-2.5 py-[3px] bg-red-100 text-red-600 font-display text-xs font-semibold rounded-full">
                ~{eta}
              </span>
            )}
            <span className="font-body text-[10px] text-gray-400">Drop-off</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-150 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-red-600 flex-shrink-0 flex items-center justify-center">
            {courierPhoto ? (
              <img src={courierPhoto} alt={courierName || ''} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-xs md:text-sm font-semibold text-white">
                {courierInitials || 'C'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-[11px] md:text-xs font-semibold text-gray-950 truncate">{courierName || 'Courier'}</p>
            <span className="inline-flex items-center text-[10px] font-body text-success font-medium">
              <MapPin className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
              Verified
            </span>
          </div>
        </div>
        {onTrack && (
          <button
            onClick={onTrack}
            className="inline-flex items-center gap-1 text-red-600 font-display text-[11px] md:text-xs font-semibold hover:underline whitespace-nowrap flex-shrink-0"
          >
            Track live
            <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
