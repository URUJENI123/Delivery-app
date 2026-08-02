import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-150 rounded-md relative overflow-hidden',
        'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]',
        className,
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 min-h-[100px]">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function DeliveryRowSkeleton() {
  return (
    <div className="flex items-center px-4 py-3 border-b border-gray-150">
      <Skeleton className="w-9 h-9 rounded-md flex-shrink-0" />
      <div className="ml-3 flex-1">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex flex-col items-end gap-1">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function MapSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-gray-150 rounded-lg relative overflow-hidden', className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-gray-300 text-tiny font-semibold">Loading map...</div>
      </div>
    </div>
  );
}
