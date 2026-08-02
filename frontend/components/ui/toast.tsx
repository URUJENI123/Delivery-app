'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColors = {
  success: 'bg-success-bg text-success',
  error: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  info: 'bg-info-bg text-info',
};

const durations: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 4000,
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = nextId++;
    const duration = durations[type];
    const toast: Toast = { id, type, title, message, duration };
    setToasts((prev) => [...prev, toast]);
    const timer = setTimeout(() => removeToast(id), duration);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[360px] w-full pointer-events-none">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          const progressRef = useRef<HTMLDivElement>(null);
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto bg-white border border-gray-200 rounded-lg p-[14px] flex items-start gap-[10px] animate-slide-in-right relative overflow-hidden',
              )}
            >
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', iconColors[t.type])}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold text-gray-950">{t.title}</p>
                {t.message && (
                  <p className="text-caption text-gray-500 mt-0.5">{t.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
              <div
                ref={progressRef}
                className="absolute bottom-0 left-0 h-[3px] bg-red-600 animate-progress"
                style={{ animationDuration: `${t.duration}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
