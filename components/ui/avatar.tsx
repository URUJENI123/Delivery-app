import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  dot?: 'online' | 'offline' | 'verified' | 'none';
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-[52px] h-[52px] text-lg',
  xl: 'w-20 h-20 text-3xl',
};

const dotColors = {
  online: 'bg-success',
  offline: 'bg-gray-400',
  verified: 'bg-success',
  none: 'hidden',
};

const dotSizes = {
  sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  md: 'w-3 h-3 -bottom-0.5 -right-0.5',
  lg: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
  xl: 'w-4 h-4 bottom-0 -right-0.5',
};

export function Avatar({ src, name, size = 'md', className, dot = 'none' }: AvatarProps) {
  if (src) {
    return (
      <div className="relative inline-flex">
        <img
          src={src}
          alt={name || ''}
          className={cn('rounded-full object-cover', sizes[size], className)}
        />
        {dot !== 'none' && (
          <span className={cn('absolute rounded-full border-2 border-white', dotSizes[size], dotColors[dot])} />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex">
      <div className={cn(
        'rounded-full bg-red-600 text-white font-semibold flex items-center justify-center font-display',
        sizes[size],
        className,
      )}>
        {name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      {dot !== 'none' && (
        <span className={cn('absolute rounded-full border-2 border-white', dotSizes[size], dotColors[dot])} />
      )}
    </div>
  );
}
