import { cn } from '@/lib/utils';

type StatusKey =
  | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'PENDING' | 'BROADCAST'
  | 'ARRIVED' | 'PICKED_UP' | 'DISPUTED' | 'FAILED' | 'COURIER_ASSIGNED'
  | 'PICKUP_EN_ROUTE' | 'ARRIVED_PICKUP' | 'ARRIVED_DROPOFF'
  | 'DRAFT' | 'COURIER_CONFIRMED';

const statusStyles: Record<string, string> = {
  IN_TRANSIT: 'bg-red-600 text-white',
  DELIVERED: 'bg-success-bg text-[#166534]',
  CANCELLED: 'bg-danger-bg text-danger',
  PENDING: 'bg-warning-bg text-[#92400E]',
  BROADCAST: 'bg-warning-bg text-[#92400E]',
  ARRIVED: 'bg-info-bg text-[#1E40AF]',
  ARRIVED_DROPOFF: 'bg-info-bg text-[#1E40AF]',
  ARRIVED_PICKUP: 'bg-info-bg text-[#1E40AF]',
  PICKED_UP: 'bg-red-100 text-red-600',
  DISPUTED: 'bg-[#FEF2F2] text-danger',
  FAILED: 'bg-gray-100 text-gray-500',
  COURIER_ASSIGNED: 'bg-info-bg text-[#1E40AF]',
  COURIER_CONFIRMED: 'bg-info-bg text-[#1E40AF]',
  PICKUP_EN_ROUTE: 'bg-red-100 text-red-600',
  DRAFT: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  BROADCAST: 'Pending',
  ARRIVED: 'Arrived',
  ARRIVED_DROPOFF: 'Arrived',
  ARRIVED_PICKUP: 'Arrived',
  PICKED_UP: 'Picked Up',
  DISPUTED: 'Disputed',
  FAILED: 'Failed',
  COURIER_ASSIGNED: 'Assigned',
  COURIER_CONFIRMED: 'Confirmed',
  PICKUP_EN_ROUTE: 'En Route',
  DRAFT: 'Draft',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
  const label = statusLabels[status] || status.replace(/_/g, ' ');
  return (
    <span className={cn('inline-flex items-center px-[10px] py-[4px] rounded-full text-badge font-display font-semibold', style, className)}>
      {label}
    </span>
  );
}

export type VerificationTier = 'Verified' | 'Basic' | 'Identity' | 'Vehicle' | 'Trusted';

const verificationStyles: Record<VerificationTier, string> = {
  Verified: 'bg-success-bg text-[#166534]',
  Basic: 'bg-gray-100 text-gray-500 border border-gray-200',
  Identity: 'bg-info-bg text-[#1D4ED8] border border-[#BFDBFE]',
  Vehicle: 'bg-success-bg text-[#15803D] border border-[#BBF7D0]',
  Trusted: 'bg-red-100 text-red-600 border-2 border-red-600',
};

export function VerificationBadge({ tier, className }: { tier: VerificationTier; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-[10px] py-[4px] rounded-full text-badge font-display font-semibold', verificationStyles[tier], className)}>
      {tier}
    </span>
  );
}

export function Badge({ color = 'default', className, children }: { color?: string; className?: string; children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    default: 'bg-gray-100 text-gray-600',
    amber: 'bg-warning-bg text-[#92400E]',
    blue: 'bg-info-bg text-[#1E40AF]',
    red: 'bg-red-100 text-red-600',
    green: 'bg-success-bg text-[#166534]',
    gray: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={cn('inline-flex items-center px-[10px] py-[4px] rounded-full text-badge font-display font-semibold', colorMap[color] || colorMap.default, className)}>
      {children}
    </span>
  );
}
