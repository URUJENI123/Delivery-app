'use client';

import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface DoubleDeckHeaderProps {
  prefix: string;
  title: string;
  viewAllHref?: string;
  onViewAll?: () => void;
  className?: string;
}

export function DoubleDeckHeader({
  prefix,
  title,
  viewAllHref,
  onViewAll,
  className,
}: DoubleDeckHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between', className)}>
      <div>
        <p className="font-body text-xs text-gray-400 leading-none">{prefix}</p>
        <h2 className="font-display text-xl font-bold text-red-600 leading-tight mt-0.5">{title}</h2>
      </div>
      {(viewAllHref || onViewAll) && (
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-0.5 font-body text-xs text-red-600 hover:underline flex-shrink-0"
        >
          View all
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
