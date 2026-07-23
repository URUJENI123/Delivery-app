import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, selected, hoverable, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-gray-200 rounded-lg transition-all duration-150',
          hoverable && 'hover:border-gray-300 cursor-pointer',
          selected && 'border-2 border-red-600 bg-red-50',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  link?: string;
  trend?: { value: string; positive: boolean };
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, link, trend }: StatCardProps) {
  return (
    <Card className="p-5 min-h-[100px]">
      <div className="flex items-start justify-between">
        <span className="text-label text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="font-display text-h2 md:text-stat font-bold text-gray-950">{value}</p>
          {link && (
            <span className="text-tiny text-red-600 hover:underline cursor-pointer">{link}</span>
          )}
        </div>
        {trend && (
          <span className={cn('text-tiny font-semibold flex items-center gap-1', trend.positive ? 'text-success' : 'text-danger')}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}

export { Card, StatCard };
