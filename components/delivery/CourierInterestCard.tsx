'use client';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VerificationBadge } from '@/components/ui/badge';
import { Clock, Star } from 'lucide-react';

interface CourierInterestCardProps {
  name: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  plateNumber: string;
  eta: string;
  price: number;
  selected?: boolean;
  onSelect?: () => void;
}

export function CourierInterestCard({
  name, rating, reviewCount, verified, plateNumber, eta, price, selected, onSelect,
}: CourierInterestCardProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div
      className={cn(
        'p-4 rounded-lg transition-all duration-200 bg-white border',
        selected ? 'border-2 border-red-600 bg-red-50 border-l-4' : 'border border-gray-200',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar name={name} size="lg" />
          <span className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
            verified ? 'bg-success' : 'bg-gray-400',
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-semibold text-gray-950">{name}</p>

          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={cn(
                  i < fullStars ? 'fill-warning text-warning' : i === fullStars && hasHalf ? 'fill-warning/50 text-warning' : 'fill-none text-gray-300',
                )}
              />
            ))}
            <span className="text-body-sm font-semibold text-gray-950 ml-1">{rating}</span>
            <span className="text-tiny text-gray-400">({reviewCount})</span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <VerificationBadge tier={verified ? 'Verified' : 'Basic'} />
            <span className="text-tiny text-gray-400">{plateNumber}</span>
          </div>

          <div className="flex items-center gap-1 mt-1">
            <Clock size={14} className="text-gray-400" />
            <span className="text-caption text-gray-600">{eta}</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-h4 font-bold text-gray-950">RWF {price.toLocaleString()}</p>
          <Button
            variant={selected ? 'primary' : 'outline-red'}
            size="sm"
            className="mt-2 !h-9 !px-4"
            onClick={onSelect}
          >
            {selected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </div>
    </div>
  );
}
