'use client';

import { cn } from '@/lib/utils';

interface Step {
  label: string;
  key: string;
}

interface ProgressDotTrackProps {
  steps: Step[];
  currentStep: string;
  terminalStatus?: 'CANCELLED' | 'DISPUTED' | 'FAILED' | null;
}

const statusOrder = ['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'ARRIVED_PICKUP', 'ARRIVED_DROPOFF'];

function getStepIndex(key: string): number {
  const idx = statusOrder.indexOf(key);
  return idx >= 0 ? idx : 0;
}

export function ProgressDotTrack({ steps, currentStep, terminalStatus }: ProgressDotTrackProps) {
  if (terminalStatus) {
    const badgeMap: Record<string, { label: string; class: string }> = {
      CANCELLED: { label: 'Cancelled', class: 'bg-danger-bg text-danger border border-danger/20' },
      DISPUTED: { label: 'Disputed', class: 'bg-warning-bg text-warning border border-warning/20' },
      FAILED: { label: 'Failed', class: 'bg-danger-bg text-danger border border-danger/20' },
    };
    const b = badgeMap[terminalStatus] || { label: terminalStatus, class: 'bg-gray-100 text-gray-600' };
    return (
      <div className="flex items-center justify-end">
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', b.class)}>
          {b.label}
        </span>
      </div>
    );
  }

  const currentIdx = getStepIndex(currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center w-full gap-0 relative">
        {steps.map((step, i) => {
          const stepIdx = getStepIndex(step.key);
          const isCompleted = stepIdx <= currentIdx && step.key !== currentStep;
          const isActive = step.key === currentStep;
          const isFuture = stepIdx > currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors duration-300',
                      isCompleted && 'bg-red-600',
                      isActive && 'bg-red-600',
                      isFuture && 'bg-gray-200',
                    )}
                  />
                  {isActive && (
                    <div className="absolute -inset-[3px] rounded-full border-2 border-red-600 animate-dot-pulse" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] leading-none whitespace-nowrap transition-colors duration-200',
                    isActive && 'text-red-600 font-semibold font-display',
                    isCompleted && 'text-gray-400',
                    isFuture && 'text-gray-300',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-1 mt-[-12px]">
                  <div
                    className={cn(
                      'h-full rounded-full transition-colors duration-500',
                      stepIdx < currentIdx ? 'bg-red-600' : stepIdx === currentIdx ? 'bg-red-600' : 'bg-gray-200',
                    )}
                  />
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      stepIdx < currentIdx ? 'w-0' : 'w-full bg-gray-200',
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
