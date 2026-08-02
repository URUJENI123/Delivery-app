'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GroupedFormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function GroupedFormSection({ title, children, className }: GroupedFormSectionProps) {
  return (
    <div className={cn('mb-6', className)}>
      <p className="font-body text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">
        {title}
      </p>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

interface FormRowProps {
  icon?: ReactNode;
  label: string;
  value?: ReactNode;
  chevron?: boolean;
  focused?: boolean;
  className?: string;
  onClick?: () => void;
}

export function FormRow({
  icon,
  label,
  value,
  chevron = false,
  focused = false,
  className,
  onClick,
}: FormRowProps) {
  const RowTag = onClick ? 'button' : 'div';

  return (
    <RowTag
      onClick={onClick}
      className={cn(
        'flex items-center h-14 px-4 border-b border-gray-150 last:border-b-0 w-full text-left transition-colors duration-150',
        focused && 'bg-red-50',
        onClick && 'hover:bg-red-50 cursor-pointer',
        className,
      )}
    >
      {icon && (
        <span className={cn('flex-shrink-0 mr-3', focused ? 'text-red-600' : 'text-gray-400')}>
          {icon}
        </span>
      )}
      <span
        className={cn(
          'font-body text-sm font-medium flex-shrink-0',
          focused ? 'text-red-600' : 'text-gray-950',
        )}
      >
        {label}
      </span>
      <div className="flex-1 flex items-center justify-end gap-2">
        {typeof value === 'string' ? (
          <span className="font-body text-sm text-right truncate max-w-[180px]">{value}</span>
        ) : (
          value
        )}
        {chevron && (
          <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
        )}
      </div>
    </RowTag>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export { ChevronRightIcon };
