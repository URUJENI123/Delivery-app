'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import {
  Bike, Package, DollarSign, Activity, RefreshCw,
  CheckCircle, AlertTriangle, ChevronRight,
  TrendingUp, Shield, LogOut, LayoutDashboard,
  Users, BarChart2, UserCheck, Menu, Bell, Settings, HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MapWidget } from '@/components/map/MapWidget';

// ── constants ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/couriers', label: 'Fleet', icon: Bike },
  { href: '/admin/deliveries', label: 'Logistics', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/disputes', label: 'Operations', icon: Shield, badge: true },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
];

const BOTTOM_LINKS = [
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/support', label: 'Help & Support', icon: HelpCircle },
];

const LIVE_FEED = [
  { id: 'KE-8821', msg: 'Picked up: Kimironko Hub', type: 'pickup', time: new Date(Date.now() - 120_000).toISOString() },
  { id: 'KE-8819', msg: 'Delivered: Nyarutarama', type: 'delivered', time: new Date(Date.now() - 300_000).toISOString() },
  { id: 'KE-8790', msg: 'Delay: Heavy Traffic (CBD)', type: 'alert', time: new Date(Date.now() - 720_000).toISOString() },
  { id: 'KE-8825', msg: 'New Dispatch: Gikondo', type: 'dispatch', time: new Date(Date.now() - 10_000).toISOString() },
];

const HUB_DATA = [
  { name: 'Kacyiru Main Hub', pct: 88 },
  { name: 'Remera Distribution', pct: 62 },
  { name: 'Nyamirambo Micro-Hub', pct: 94 },
  { name: 'Gisozi Hub', pct: 45 },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'JUST NOW';
  if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
  return `${Math.floor(diff / 3600)}H AGO`;
}

function HubBar({ name, pct }: { name: string; pct: number }) {
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#e11d28';
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-gray-300">{name}</span>
        <span className="text-[12px] text-gray-400">{pct}% Capacity</span>
      </div>
      <div className="h-[6px] rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── sidebar ───────────────────────────────────────────────────────────────────

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const sidebarContent = (
    <aside className={cn(
      'flex flex-col w-[240px] h-screen bg-[#1a0505] border-r border-white/10',
      // desktop: fixed, always visible
      'lg:fixed lg:left-0 lg:top-0 lg:z-40',
      // mobile: fixed overlay, toggled
      'fixed left-0 top-0 z-50 transition-transform duration-200',
      open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    )}>
      {/* logo */}
      <div className="h-20 flex items-center justify-center px-4 border-b border-white/10 flex-shrink-0">
        <img src="/logo.png" alt="Delivery" className="h-14 w-auto object-contain" />
        {/* close button — mobile only */}
        <button onClick={onClose} className="lg:hidden ml-auto p-1 text-white/40 hover:text-white">
          ✕
        </button>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto pt-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center h-11 px-3 transition-all duration-150 mb-0.5',
                active
                  ? 'bg-black/25 text-white font-semibold border-l-4 border-red-500'
                  : 'rounded-md text-white/55 hover:bg-white/8 hover:text-white',
              )}
            >
              <Icon size={19} className={cn('mr-3 flex-shrink-0', active ? 'text-red-400' : 'text-white/45')} />
              <span className="text-[13.5px]">{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-[18px] h-[18px] rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">
                  1
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* bottom links */}
      <div className="border-t border-white/10 px-3 pt-3 space-y-0.5">
        {BOTTOM_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center h-10 px-3 rounded-md text-white/45 hover:bg-white/8 hover:text-white transition-all duration-150"
            >
              <Icon size={17} className="mr-3 text-white/35 flex-shrink-0" />
              <span className="text-[13px]">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={async () => { await logout(); router.push('/admin/auth'); }}
          className="flex items-center h-10 px-3 rounded-md text-white/45 hover:bg-white/8 hover:text-white transition-all duration-150 w-full"
        >
          <LogOut size={17} className="mr-3 text-white/35 flex-shrink-0" />
          <span className="text-[13px]">Logout</span>
        </button>
      </div>

      {/* user profile strip */}
      <div className="border-t border-white/10 p-3 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-red-800 border border-red-600/60 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">{user?.fullName || 'Admin'}</p>
          <p className="text-[11px] text-white/40">Administrator</p>
        </div>
        <ChevronRight size={14} className="text-white/25 flex-shrink-0" />
      </div>
    </aside>
  );

  return (
    <>
      {/* mobile backdrop */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      )}
      {sidebarContent}
    </>
  );
}

// ── mobile top bar ────────────────────────────────────────────────────────────

function AdminMobileTopBar({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#1a0505] border-b border-white/10 flex items-center px-4 gap-3">
      <button onClick={onSidebarToggle} className="p-1.5 text-white/60 hover:text-white -ml-1">
        <Menu size={21} />
      </button>
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Delivery" className="h-11 w-auto object-contain" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="relative p-1.5 text-white/50 hover:text-white">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashData, setDashData] = useState<any>(null);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const tickRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => { tickRef.current++; setTick(tickRef.current); }, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [dashboard, c] = await Promise.all([
          api.get<any>('/admin/dashboard'),
          api.get<any>('/admin/couriers'),
        ]);
        setDashData(dashboard);
        setCouriers(Array.isArray(c) ? c : c.data || []);
      } catch (e) {
        console.error('Failed to load admin dashboard', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const s = dashData;
  const pendingCount = couriers.filter((c: any) => !c.isApprovedByAdmin).length;
  const disputesOpen = s?.disputesOpen || 0;

  const kpis = [
    { label: 'Active Couriers', value: (s?.onlineCouriers ?? 1402).toLocaleString(), sub: '+12% vs last hour', subOk: true, icon: Bike, live: true },
    { label: 'Daily Deliveries', value: (s?.completedToday ?? 8291).toLocaleString(), sub: '98% on-time rate', subOk: true, icon: Package },
    { label: 'Gross Revenue', value: s?.revenueToday ? `RWF ${(s.revenueToday / 1000).toFixed(0)}K` : 'RWF 4.2M', sub: 'Target: RWF 5.0M', subOk: null, icon: DollarSign },
    { label: 'System Uptime', value: '99.98%', sub: 'All nodes operational', subOk: true, icon: Activity, dot: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120808] flex items-center justify-center">
        <div className="space-y-3 w-64">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#120808] text-white flex">

      {/* ── SIDEBAR ── */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── MOBILE TOP BAR ── */}
      <AdminMobileTopBar onSidebarToggle={() => setSidebarOpen(true)} />

      {/* ── MAIN CONTENT (offset by sidebar width on desktop) ── */}
      <div className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-w-0">

        {/* desktop page header */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-white/10 bg-[#1a0505]/60 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h1 className="font-display text-lg font-bold text-white">Dashboard</h1>
            <p className="text-[12px] text-white/35">Platform overview and real-time analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-white/40 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={() => router.push('/admin/couriers')}
              className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <UserCheck size={14} />
              Verify Couriers
            </button>
          </div>
        </div>

        {/* scrollable content */}
        <div className="px-4 lg:px-6 pb-10">

          {/* ── KPI ROW ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="relative bg-[#1e0e0e] border border-white/10 rounded-xl p-4 overflow-hidden">
                  {k.live && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 bg-red-600/20 border border-red-600/40 rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-red-400 tracking-wider">LIVE</span>
                    </span>
                  )}
                  {k.dot && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]" />
                  )}
                  <Icon size={20} className="text-white/40 mb-3" />
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">{k.label}</p>
                  <p className="font-display text-2xl lg:text-3xl font-bold text-white leading-none">{k.value}</p>
                  {k.sub && (
                    <p className={cn(
                      'text-[11px] mt-1.5 flex items-center gap-1',
                      k.subOk === true ? 'text-green-400' : k.subOk === false ? 'text-red-400' : 'text-white/30',
                    )}>
                      {k.subOk === true && <TrendingUp size={10} />}
                      {k.sub}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid lg:grid-cols-[320px_1fr] gap-4 mt-4">

            {/* Live Feed */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl flex flex-col">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
                <h2 className="text-sm font-semibold text-white">Live Feed</h2>
                <button onClick={() => setTick(t => t + 1)} className="p-1 text-white/30 hover:text-white/70 transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="flex-1 divide-y divide-white/5">
                {LIVE_FEED.map((item) => {
                  const isAlert = item.type === 'alert';
                  const isDelivered = item.type === 'delivered';
                  const isDispatch = item.type === 'dispatch';
                  return (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3.5">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        isAlert ? 'bg-red-900/60 border border-red-700/40' :
                        isDelivered ? 'bg-green-900/40 border border-green-700/30' :
                        isDispatch ? 'bg-blue-900/40 border border-blue-700/30' :
                        'bg-white/5 border border-white/10',
                      )}>
                        {isAlert ? <AlertTriangle size={14} className="text-red-400" /> :
                         isDelivered ? <CheckCircle size={14} className="text-green-400" /> :
                         isDispatch ? <Package size={14} className="text-blue-400" /> :
                         <Bike size={14} className="text-white/50" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white">Order #{item.id}</p>
                        <p className={cn('text-[12px] mt-0.5', isAlert ? 'text-red-400' : 'text-white/40')}>{item.msg}</p>
                      </div>
                      <span className="text-[10px] text-white/25 flex-shrink-0 mt-0.5 font-mono">{timeAgo(item.time)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/10 px-4 py-3">
                <button
                  onClick={() => router.push('/admin/deliveries')}
                  className="w-full text-[12px] text-red-400 hover:text-red-300 flex items-center justify-center gap-1 transition-colors"
                >
                  View all deliveries <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">

              {/* Hub Capacity */}
              <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-white">Kigali Hub Capacity</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/40 border border-white/15 rounded-full px-2.5 py-0.5">Real-time</span>
                    <span className="text-[11px] font-semibold text-white bg-red-600 rounded-full px-2.5 py-0.5">Optimized</span>
                  </div>
                </div>
                {HUB_DATA.map((h) => <HubBar key={h.name} name={h.name} pct={h.pct} />)}
              </div>

              {/* Fleet Health + Urban Coverage */}
              <div className="grid sm:grid-cols-2 gap-4">

                {/* Fleet Health */}
                <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Bike size={16} className="text-red-500" />
                    <h3 className="text-sm font-semibold text-white">Fleet Health</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mt-3 mb-4">
                    <span className="font-display text-4xl font-bold text-red-400">94</span>
                    <span className="text-white/30 text-base">/100</span>
                    <span className="ml-2 text-[12px] text-white/30">Overall maintenance score</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#120808] border border-white/8 rounded-lg p-3">
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">E-Bikes</p>
                      <p className="font-display text-lg font-bold text-white">120 <span className="text-[11px] font-normal text-white/40">Active</span></p>
                    </div>
                    <div className="bg-[#120808] border border-white/8 rounded-lg p-3">
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Trucks</p>
                      <p className="font-display text-lg font-bold text-white">45 <span className="text-[11px] font-normal text-white/40">Active</span></p>
                    </div>
                  </div>
                </div>

                {/* Urban Coverage — real map */}
                <div className="relative bg-[#1e0e0e] border border-white/10 rounded-xl overflow-hidden min-h-[220px]">
                  <div className="absolute inset-0">
                    <MapWidget height="100%" className="!rounded-none" interactive={false} showCourier={false} showRoute={false} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a0808]/90 via-[#1a0808]/40 to-transparent pointer-events-none" />
                  </div>
                  <div className="relative z-10 p-5 flex flex-col h-full justify-between min-h-[220px]">
                    <div>
                      <p className="text-[11px] text-red-400 font-semibold uppercase tracking-wider drop-shadow">Urban Coverage</p>
                      <p className="font-display text-3xl font-bold text-white mt-1 drop-shadow-lg">18 Districts</p>
                      <p className="text-[12px] text-white/60 mt-1 drop-shadow">Expanding to Bugesera next month</p>
                    </div>
                    <button
                      onClick={() => router.push('/admin/deliveries')}
                      className="mt-4 w-full h-9 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-lg transition-colors"
                    >
                      View Logistics Map
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── ALERTS ── */}
          {pendingCount > 0 && (
            <div className="mt-4 bg-[#1e0e0e] border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-900/40 border border-orange-700/30 flex items-center justify-center flex-shrink-0">
                  <UserCheck size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{pendingCount} courier{pendingCount > 1 ? 's' : ''} awaiting verification</p>
                  <p className="text-[12px] text-white/35 mt-0.5">Review and approve pending applications</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/couriers')}
                className="flex-shrink-0 h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                Review <ChevronRight size={14} />
              </button>
            </div>
          )}

          {disputesOpen > 0 && (
            <div className="mt-3 bg-red-950/50 border border-red-700/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">
                  <span className="font-bold">{disputesOpen} open dispute{disputesOpen > 1 ? 's' : ''}</span> require your review
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/disputes')}
                className="flex-shrink-0 h-8 px-3 border border-red-600/50 text-red-400 hover:bg-red-900/40 text-[12px] font-semibold rounded-lg transition-colors"
              >
                View disputes
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
