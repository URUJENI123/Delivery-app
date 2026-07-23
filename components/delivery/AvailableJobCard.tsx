'use client';

import { cn } from '@/lib/utils';
import { Bike, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvailableJobCardProps {
  distance: string;
  price: number;
  pickup: string;
  dropoff: string;
  pickupEta: string;
  weight: string;
  onAccept?: () => void;
}

export function AvailableJobCard({
  distance, price, pickup, dropoff, pickupEta, weight, onAccept,
}: AvailableJobCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-full text-tiny text-gray-600 font-medium font-body">
            {distance} away
          </span>
          <span className="font-display text-base font-bold text-gray-950">
            RWF {price.toLocaleString()}
          </span>
        </div>

        <div className="mt-4">
          <div className="relative w-full h-1 bg-gray-200 rounded-full">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-success flex items-center justify-center">
              <MapPin className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-600 flex items-center justify-center">
              <MapPin className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <div>
              <p className="font-body text-xs text-gray-950">{pickup}</p>
              <p className="font-body text-[10px] text-gray-400">{pickupEta}</p>
            </div>
            <div className="text-right">
              <p className="font-body text-xs text-gray-950">{dropoff}</p>
              <p className="font-body text-[10px] text-gray-400">{weight}</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        className="!h-12 !rounded-none !text-btn-md font-display font-semibold"
        onClick={onAccept}
      >
        Accept Delivery
      </Button>
    </div>
  );
}
