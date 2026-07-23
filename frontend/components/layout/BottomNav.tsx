'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Package, Plus, MessageSquare, User, MapPin, Bike, TrendingUp, Users, UserCheck, AlertTriangle } from 'lucide-react';

const senderTabs = [
  { href: '/sender/dashboard', label: 'Home', icon: Home },
  { href: '/deliveries', label: 'Deliveries', icon: Package },
  { href: '/send', label: 'Create', icon: Plus, center: true },
  { href: '/messages', label: 'Messages', icon: MessageSquare, badge: true },
  { href: '/profile', label: 'Profile', icon: User },
];

const courierTabs = [
  { href: '/courier/dashboard', label: 'Home', icon: Home },
  { href: '/courier/jobs', label: 'Jobs', icon: MapPin },
  { href: '/courier/jobs', label: 'Online', icon: Bike, center: true },
  { href: '/courier/earnings', label: 'Earnings', icon: TrendingUp },
  { href: '/courier/profile', label: 'Profile', icon: User },
];

const adminTabs = [
  { href: '/admin/dashboard', label: 'Home', icon: Home },
  { href: '/admin/couriers', label: 'Couriers', icon: Users },
  { href: '/admin/deliveries', label: 'Deliveries', icon: Package, center: true },
  { href: '/admin/users', label: 'Users', icon: UserCheck },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, badge: true },
];

function NavTabs({ tabs, isCourierOnline }: { tabs: typeof senderTabs; isCourierOnline?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-around h-[72px] px-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

        if (tab.center) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center"
              style={{ width: '20%' }}
            >
              <div
                className={cn(
                  'w-[58px] h-[58px] rounded-full flex items-center justify-center -mt-4 shadow-xl transition-transform duration-300 active:scale-95',
                  'ring-[5px] ring-red-500/25',
                  isCourierOnline ? 'bg-success ring-success/20' : 'bg-white',
                )}
              >
                <Icon size={24} className={cn(isCourierOnline ? 'text-white' : 'text-red-600')} />
                {isCourierOnline && (
                  <span className="absolute inset-0 rounded-full animate-green-pulse" />
                )}
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'group relative flex items-center justify-center transition-all duration-300',
              'hover:scale-105',
            )}
            style={{ width: '20%' }}
          >
            {isActive ? (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full pl-3 pr-4 py-2 transition-all duration-300 ease-out">
                <Icon size={18} className="text-white flex-shrink-0" />
                <span className="font-display text-xs font-semibold tracking-wide text-white whitespace-nowrap">
                  {tab.label}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center w-10 h-10 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5">
                <Icon size={22} className="text-white/50 transition-colors duration-300 group-hover:text-white/80" />
              </div>
            )}
            {tab.badge && !isActive && (
              <span className="absolute -top-0.5 -right-0.5 w-[20px] h-[20px] rounded-full bg-white text-red-600 flex items-center justify-center text-[11px] font-bold shadow-lg shadow-red-600/30">
                3
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function FloatingNav({ children }: { children: React.ReactNode }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 pb-6">
      <div className="rounded-[32px] bg-gradient-to-b from-red-500 to-red-700 shadow-[0_-12px_40px_rgba(220,38,38,0.30)] border border-white/10 pointer-events-auto">
        {children}
      </div>
    </nav>
  );
}

export function SenderBottomNav() {
  return (
    <FloatingNav>
      <NavTabs tabs={senderTabs} />
    </FloatingNav>
  );
}

export function CourierBottomNav() {
  return (
    <FloatingNav>
      <NavTabs tabs={courierTabs} isCourierOnline={false} />
    </FloatingNav>
  );
}

export function AdminBottomNav() {
  return (
    <FloatingNav>
      <NavTabs tabs={adminTabs} />
    </FloatingNav>
  );
}
