'use client';

import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import {
  LayoutDashboard, Package, MapPin, MessageSquare, Wallet, BookOpen,
  CreditCard, BarChart2, Settings, HelpCircle, LogOut, TrendingUp,
  User, Users, UserCheck, AlertTriangle, Gift, ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

export const senderNav = [
  { href: '/sender/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sender/deliveries', label: 'Deliveries', icon: Package },
  { href: '/sender/track', label: 'Tracking', icon: MapPin },
  { href: '/sender/messages', label: 'Messages', icon: MessageSquare, badge: true },
  { href: '/sender/wallet', label: 'Wallet', icon: Wallet },
  { href: '/sender/address-book', label: 'Address Book', icon: BookOpen },
  { href: '/sender/payments', label: 'Payments', icon: CreditCard },
  { href: '/sender/reports', label: 'Reports', icon: BarChart2 },
];

export const courierNav = [
  { href: '/courier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courier/jobs', label: 'Deliveries', icon: Package },
  { href: '/courier/earnings', label: 'Earnings', icon: TrendingUp },
  { href: '/courier/messages', label: 'Messages', icon: MessageSquare, badge: true },
  { href: '/courier/profile', label: 'Profile', icon: User },
];

export const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/couriers', label: 'Couriers', icon: Users },
  { href: '/admin/deliveries', label: 'Deliveries', icon: Package },
  { href: '/admin/users', label: 'Users', icon: UserCheck },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, badge: true },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
];

export const sidebarBottomLinks = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Help & Support', icon: HelpCircle },
];

const SidebarLogo = ({ className }: { className?: string }) => (
  <Logo className={className} />
);

export function SenderSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen bg-red-600 fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
        <SidebarLogo className="brightness-0 invert" />
      </div>

      <nav className="flex-1 overflow-y-auto pt-4 px-3">
        {senderNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center h-11 px-3 rounded-md transition-all duration-150 mb-0.5',
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
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-white flex-shrink-0" />
            <div>
              <p className="text-body-sm font-semibold text-white">Invite & Earn</p>
              <p className="text-micro text-white/70">Invite friends and earn rewards</p>
            </div>
          </div>
          <button className="mt-2 w-full h-8 bg-white text-red-600 rounded-md text-btn-sm font-semibold hover:bg-white/90 transition-colors">
            Invite Now
          </button>
        </div>

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
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="ml-2.5 flex-1 min-w-0">
          <p className="text-body-sm font-semibold text-white truncate">{user?.fullName || 'User'}</p>
          <p className="text-tiny text-white/60">Sender</p>
        </div>
        <ChevronRight size={16} className="text-white/40 flex-shrink-0" />
      </div>
    </aside>
  );
}

export function CourierSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen bg-red-600 fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
        <SidebarLogo className="brightness-0 invert" />
      </div>

      <nav className="flex-1 overflow-y-auto pt-4 px-3">
        {courierNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center h-11 px-3 rounded-md transition-all duration-150 mb-0.5',
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
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="ml-2.5 flex-1 min-w-0">
          <p className="text-body-sm font-semibold text-white truncate">{user?.fullName || 'Courier'}</p>
          <p className="text-tiny text-white/60">Courier</p>
        </div>
        <ChevronRight size={16} className="text-white/40 flex-shrink-0" />
      </div>
    </aside>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/couriers', label: 'Couriers', icon: Users },
    { href: '/admin/deliveries', label: 'Deliveries', icon: Package },
    { href: '/admin/users', label: 'Users', icon: UserCheck },
    { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, badge: true },
    { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen bg-red-600 fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
        <Logo size="md" className="brightness-0 invert" />
      </div>

      <nav className="flex-1 overflow-y-auto pt-4 px-3">
        {adminNavItems.map((item) => {
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
        <button
          onClick={async () => { await logout(); router.push('/auth/signin'); }}
          className="flex items-center h-11 px-3 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150 w-full"
        >
          <LogOut size={20} className="mr-3 text-white/60 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
