'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="w-full bg-white border-b border-gray-150 px-4 py-4">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-display text-sm transition-all duration-200',
                    isActive && 'bg-red-600 text-white font-semibold',
                    isCompleted && 'bg-red-600 text-white',
                    isUpcoming && 'bg-gray-150 text-gray-400',
                  )}
                >
                  {isCompleted ? <Check size={16} className="text-white" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-tiny mt-1 font-medium',
                    isActive && 'text-red-600',
                    isCompleted && 'text-red-600',
                    isUpcoming && 'text-gray-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-[1px] mx-2 mt-[-20px]',
                    isCompleted ? 'bg-red-600' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
