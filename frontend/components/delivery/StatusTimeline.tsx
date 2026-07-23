'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TimelineStep {
  label: string;
  timestamp?: string;
  status: 'completed' | 'active' | 'upcoming';
}

interface StatusTimelineProps {
  steps: TimelineStep[];
}

export function StatusTimeline({ steps }: StatusTimelineProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <div key={step.label} className={cn('flex items-start', !isLast && 'pb-5')}>
            {/* Left column: circle + connector */}
            <div className="flex flex-col items-center w-7 flex-shrink-0">
              <div className="relative">
                {step.status === 'completed' && (
                  <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
                {step.status === 'active' && (
                  <>
                    <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="absolute -inset-1 rounded-full border-2 border-red-600 opacity-30 animate-pulse-ring" />
                  </>
                )}
                {step.status === 'upcoming' && (
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-200" />
                )}
              </div>
              {!isLast && (
                <div className={cn(
                  'w-[2px] flex-1 min-h-[20px] mt-1',
                  step.status === 'completed' ? 'bg-red-600' : 'bg-gray-200',
                )} />
              )}
            </div>

            {/* Right column: text */}
            <div className="ml-3 flex-1 pb-0">
              <p className={cn(
                'text-body-sm font-semibold',
                step.status === 'completed' && 'text-gray-950',
                step.status === 'active' && 'text-gray-950',
                step.status === 'upcoming' && 'text-gray-400',
              )}>
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-tiny text-gray-400 mt-0.5">{step.timestamp}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
