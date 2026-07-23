import { cn } from '@/lib/utils';

export function Logo({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-auto', md: 'h-9 w-auto', lg: 'h-10 w-auto' };
  return (
    <img
      src="/logo.png"
      alt="Delivery"
      className={cn(sizes[size], className)}
    />
  );
}
