'use client';

import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import {
  LayoutDashboard, Package, Users, UserCheck, AlertTriangle, BarChart2,
  Settings, HelpCircle, LogOut, ChevronRight,
} from 'lucide-react';

export const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/couriers', label: 'Fleet', icon: Users },
  { href: '/admin/deliveries', label: 'Logistics', icon: Package },
  { href: '/admin/users', label: 'Users', icon: UserCheck },
  { href: '/admin/disputes', label: 'Operations', icon: AlertTriangle, badge: true },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
];

export const sidebarBottomLinks = [
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/support', label: 'Help & Support', icon: HelpCircle },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen bg-red-600 fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
        <Logo size="md" className="brightness-0 invert" />
      </div>

      <nav className="flex-1 overflow-y-auto pt-4 px-3">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center h-11 px-3 rounded-md transition-all duration-150 mb-1',
                active
                  ? 'bg-black/20 text-white font-semibold border-l-4 border-white rounded-none'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon size={20} className={cn('mr-3 flex-shrink-0', active ? 'text-white' : 'text-white/60')} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-[18px] h-[18px] rounded-full bg-white text-red-600 flex items-center justify-center text-micro font-bold">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {sidebarBottomLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center h-11 px-3 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150 mb-0.5"
            >
              <Icon size={20} className="mr-3 text-white/60 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={async () => { await logout(); router.push('/auth/signin'); }}
          className="flex items-center h-11 px-3 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150 w-full mb-0.5"
        >
          <LogOut size={20} className="mr-3 text-white/60 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      <div className="border-t border-white/10 p-3 flex items-center">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-display font-semibold text-base flex-shrink-0">
          {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        <div className="ml-2.5 flex-1 min-w-0">
          <p className="text-body-sm font-semibold text-white truncate">{user?.fullName || 'Admin'}</p>
          <p className="text-tiny text-white/60">Administrator</p>
        </div>
        <ChevronRight size={16} className="text-white/40 flex-shrink-0" />
      </div>
    </aside>
  );
}
