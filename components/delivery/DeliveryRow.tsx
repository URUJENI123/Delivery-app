'use client';

import { cn } from '@/lib/utils';
import { ProgressDotTrack } from './ProgressDotTrack';

const deliverySteps = [
  { label: 'Created', key: 'CREATED' },
  { label: 'Picked Up', key: 'PICKED_UP' },
  { label: 'In Transit', key: 'IN_TRANSIT' },
  { label: 'Delivered', key: 'DELIVERED' },
];

const terminalStatuses = ['CANCELLED', 'DISPUTED', 'FAILED'];

interface DeliveryRowProps {
  id: string;
  from: string;
  to: string;
  status: string;
  timestamp: string;
  amount?: number;
  onClick?: () => void;
}

export function DeliveryRow({ id, from, to, status, timestamp, amount, onClick }: DeliveryRowProps) {
  const isTerminal = terminalStatuses.includes(status);
  const normalizedStatus = status === 'ASSIGNED' || status === 'ARRIVED_PICKUP' ? 'CREATED' : status;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col justify-center px-3 md:px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-gray-150 last:border-b-0 min-h-[76px]',
        'hover:bg-gray-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xs font-semibold text-gray-950 flex-shrink-0">#{id}</span>
            <span className="font-body text-[11px] md:text-xs text-gray-400 hidden md:inline">·</span>
            <span className="font-body text-[11px] md:text-xs text-gray-500 truncate hidden md:block">{from} → {to}</span>
          </div>
          <div className="flex flex-col mt-1 md:hidden">
            <span className="font-body text-[11px] text-gray-500 truncate">From: {from}</span>
            <span className="font-body text-[11px] text-gray-500 truncate">To: {to}</span>
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          {amount != null && (
            <span className="font-display text-xs md:text-sm font-semibold text-gray-950 leading-none whitespace-nowrap">RWF {amount.toLocaleString()}</span>
          )}
          <span className="font-body text-[10px] md:text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">{timestamp}</span>
        </div>
      </div>
      <div className="mt-2">
        <ProgressDotTrack
          steps={deliverySteps}
          currentStep={isTerminal ? deliverySteps[deliverySteps.length - 1].key : normalizedStatus}
          terminalStatus={isTerminal ? status as 'CANCELLED' | 'DISPUTED' | 'FAILED' : null}
        />
      </div>
    </div>
  );
}
