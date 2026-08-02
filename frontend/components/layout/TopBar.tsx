'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { Bell, ChevronLeft, MoreVertical, Phone, ChevronDown, Menu, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onMenuToggle?: () => void;
  stepIndicator?: string;
  variant?: 'default' | 'back' | 'create' | 'chat' | 'admin';
  action?: React.ReactNode;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored ? stored === 'dark' : true;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors dark:text-gray-400 dark:hover:bg-white/10"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function TopBar({ title, subtitle, showBack, onBack, onMenuToggle, stepIndicator, variant = 'default', action }: TopBarProps) {
  const pathname = usePathname();

  if (variant === 'admin') {
    return (
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-red-600 text-white flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button className="p-1 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <Logo size="sm" className="brightness-0 invert" />
        </div>
        <div className="flex items-center gap-2 text-white/80 text-caption">
          <span>This Month</span>
          <ChevronDown size={14} />
        </div>
      </header>
    );
  }

  if (variant === 'chat') {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 h-14 lg:h-16 bg-red-600 flex items-center px-3">
        <Link href="/messages" className="p-1 text-white">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex items-center flex-1 ml-2">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-display font-semibold text-sm border-2 border-white">
            J
          </div>
          <div className="ml-2">
            <p className="text-body-sm font-semibold text-white">Jean Claude</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-tiny text-white/80">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={20} className="text-white" />
          <MoreVertical size={20} className="text-white" />
        </div>
      </header>
    );
  }

  const isPublicRoute = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/onboarding') || pathname.startsWith('/track');

  if (isPublicRoute) {
    return null;
  }

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-bg-card border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="p-1 text-gray-950 -ml-1">
            <Menu size={24} />
          </button>
        )}
        {showBack && (
          <button onClick={onBack} className="p-1 text-gray-950">
            <ChevronLeft size={24} />
          </button>
        )}
        <div>
          {title && (
            <h1 className={cn('font-display font-semibold', stepIndicator ? 'text-h3' : 'text-h3')}>{title}</h1>
          )}
          {subtitle && <p className="text-tiny text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {stepIndicator && (
          <span className="text-caption text-gray-500">{stepIndicator}</span>
        )}
        {variant === 'default' && (
          <>
            <ThemeToggle />
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full" />
            </button>
          </>
        )}
        {action}
      </div>
    </header>
  );
}

export function DesktopTopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/onboarding') || pathname.startsWith('/track');

  if (isPublicRoute) return null;

  return (
    <header className="hidden lg:flex h-16 sticky top-0 z-30 bg-bg-card border-b border-gray-200 items-center justify-between px-6">
      <div>
        <h1 className="font-display text-h2 font-bold text-gray-950">{title || 'Dashboard'}</h1>
        {subtitle && <p className="text-caption text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 h-10 px-3 border border-gray-200 rounded-md text-body-sm text-gray-700">
          <span>≡ƒîÉ EN</span>
          <ChevronDown size={14} />
        </div>
        <ThemeToggle />
        <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={22} className="text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full" />
        </button>
      </div>
    </header>
  );
}
