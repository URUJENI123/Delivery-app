'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/stores/auth';
import { SenderSidebar, CourierSidebar, AdminSidebar, senderNav, courierNav, adminNav, sidebarBottomLinks } from './Sidebar';
import { SenderBottomNav, CourierBottomNav, AdminBottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { ToastProvider } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { X, LogOut, Gift, ChevronRight } from 'lucide-react';

function isPublicRoute(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/onboarding') || pathname.startsWith('/track') || pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/support') || pathname.startsWith('/terms') || pathname.startsWith('/privacy');
}

function isActive(href: string, current: string) {
  return current === href || current.startsWith(href + '/');
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, fetchProfile, logout } = useAuthStore();
  const [mobileDrawer, setMobileDrawer] = useState(false);

  useEffect(() => {
    if (!user) {
      fetchProfile();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setMobileDrawer(false);
  }, [pathname]);

  if (isPublicRoute(pathname)) {
    return (
      <ToastProvider>
        <main className="min-h-screen">{children}</main>
      </ToastProvider>
    );
  }

  if (loading) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-bg-page flex">
          <aside className="hidden lg:flex flex-col w-[240px] bg-red-600 h-screen flex-shrink-0 p-4 space-y-4">
            <div className="h-10 w-24 bg-white/20 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-11 bg-white/10 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              ))}
            </div>
          </aside>
          <div className="flex-1 flex flex-col">
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
              <div className="lg:hidden w-8 h-8 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              <div className="h-5 w-32 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              <div className="ml-auto w-10 h-10 rounded-full bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
            </div>
            <div className="flex-1 p-4 md:p-6 lg:pt-20 space-y-4">
              <div className="h-8 w-48 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              <div className="h-64 bg-gray-150 rounded-xl relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-gray-150 rounded-xl relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                <div className="h-32 bg-gray-150 rounded-xl relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
              </div>
            </div>
          </div>
        </div>
      </ToastProvider>
    );
  }

  const role = user?.role || 'SENDER';
  const navItems = role === 'ADMIN' ? adminNav : role === 'COURIER' ? courierNav : senderNav;

  return (
    <ToastProvider>
      {role === 'SENDER' && <SenderSidebar />}
      {role === 'COURIER' && <CourierSidebar />}
      {role === 'ADMIN' && <AdminSidebar />}

      <TopBar onMenuToggle={() => setMobileDrawer(true)} />

      {mobileDrawer && (
        <>
          <div className="lg:hidden fixed inset-0 bg-gray-950/50 z-50" onClick={() => setMobileDrawer(false)} />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 z-50 animate-slide-in-left flex flex-col w-[240px] bg-red-600">
            <div className="flex items-center justify-between h-14 px-4 border-b border-white/10 flex-shrink-0">
              <Logo size="md" className="brightness-0 invert" />
              <button onClick={() => setMobileDrawer(false)} className="p-1 text-white/70">
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center h-11 px-3 rounded-md transition-all duration-150',
                      active
                        ? 'bg-black/20 text-white font-semibold border-l-4 border-white rounded-none'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon size={20} className={cn('mr-3 flex-shrink-0', active ? 'text-white' : 'text-white/60')} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto w-[18px] h-[18px] rounded-full bg-white text-red-600 flex items-center justify-center text-micro font-bold">3</span>
                    )}
                  </Link>
                );
              })}

              <hr className="my-4 border-white/10" />

              {sidebarBottomLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center h-11 px-3 rounded-md transition-all duration-150 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Icon size={20} className="mr-3 text-white/60 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Invite & Earn — Sender only */}
              {role === 'SENDER' && (
                <div className="p-3">
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
                </div>
              )}

              <button
                onClick={async () => { await logout(); router.push('/auth/signin'); }}
                className="flex items-center h-11 px-3 rounded-md transition-all duration-150 w-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={20} className="mr-3 text-white/60 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </nav>

            {/* User profile — Sender & Courier only */}
            {role !== 'ADMIN' && (
              <div className="border-t border-white/10 p-3 flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-display font-semibold text-base flex-shrink-0">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="ml-2.5 flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-white truncate">{user?.fullName || 'User'}</p>
                  <p className="text-tiny text-white/60">{role === 'COURIER' ? 'Courier' : 'Sender'}</p>
                </div>
                <ChevronRight size={16} className="text-white/40 flex-shrink-0" />
              </div>
            )}
          </aside>
        </>
      )}

      <main className={cn(
        'min-h-screen',
        'lg:ml-[240px]',
        'pt-14 lg:pt-0',
        'pb-28 lg:pb-0',
      )}>
        <div className={cn(
          'p-4 md:p-6',
          'lg:pt-20',
        )}>
          {children}
        </div>
      </main>

      {role === 'SENDER' && <SenderBottomNav />}
      {role === 'COURIER' && <CourierBottomNav />}
      {role === 'ADMIN' && <AdminBottomNav />}
    </ToastProvider>
  );
}
