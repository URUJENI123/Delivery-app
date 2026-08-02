'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { MapWidget } from '@/components/map/MapWidget';
import {
  Bike, Package, LayoutDashboard, Users, BarChart2, Shield,
  LogOut, Settings, HelpCircle, ChevronRight, Menu, Bell,
  Star, AlertTriangle, Wrench, Search, ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

// ── nav ───────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/admin/dashboard',   label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/couriers',    label: 'Fleet',      icon: Bike },
  { href: '/admin/deliveries',  label: 'Logistics',  icon: Package },
  { href: '/admin/users',       label: 'Users',      icon: Users },
  { href: '/admin/disputes',    label: 'Operations', icon: Shield, badge: true },
  { href: '/admin/reports',     label: 'Reports',    icon: BarChart2 },
];
const BOTTOM_LINKS = [
  { href: '/admin/settings', label: 'Settings',      icon: Settings  },
  { href: '/admin/support', label: 'Help & Support', icon: HelpCircle },
];

// ── mock data ─────────────────────────────────────────────────────────────────

const TOP_PERFORMERS = [
  { initials: 'JP', name: 'Jean-Pierre Kagabo', id: 'KE-4029', earnings: 'FRW 45,200', rating: 4.9, status: 'IN TRANSIT',  statusColor: 'bg-red-900/50 border-red-600/50 text-red-300' },
  { initials: 'DU', name: 'Divine Umutoni',    id: 'KE-1108', earnings: 'FRW 38,900', rating: 5.0, status: 'ON DUTY',     statusColor: 'bg-white/10 border-white/20 text-white/60'    },
  { initials: 'AN', name: 'Aimable Nshuti',    id: 'KE-0042', earnings: 'FRW 22,100', rating: 4.7, status: 'BREAK',       statusColor: 'bg-white/10 border-white/20 text-white/60'    },
];

const HUB_CAPS = [
  { hub: 'Nyarugenge Hub', pct: 88, color: 'bg-red-500'    },
  { hub: 'Gasabo Hub',     pct: 42, color: 'bg-red-800'    },
  { hub: 'Kicukiro Hub',   pct: 65, color: 'bg-red-600'    },
];

const URGENT_ALERTS = [
  { id: 'KE-904', issue: 'Low Oil Pressure',  sub: 'Assigned: Kimihurura Sector', icon: AlertTriangle },
  { id: 'KE-112', issue: 'Brake Pad Wear',    sub: 'Scheduled: Tomorrow 09:00',   icon: Wrench        },
];

// ── sidebar ───────────────────────────────────────────────────────────────────

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const initials  = user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
  const isActive  = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={onClose} />}
      <aside className={cn(
        'flex flex-col w-[240px] h-screen bg-[#1a0505] border-r border-white/10',
        'lg:fixed lg:left-0 lg:top-0 lg:z-40',
        'fixed left-0 top-0 z-50 transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className="h-20 flex items-center justify-center px-4 border-b border-white/10 flex-shrink-0">
          <img src="/logo.png" alt="Delivery" className="h-14 w-auto object-contain" />
          <button onClick={onClose} className="lg:hidden ml-auto p-1 text-white/40 hover:text-white">✕</button>
        </div>
        <nav className="flex-1 overflow-y-auto pt-4 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn(
                  'flex items-center h-11 px-3 transition-all duration-150 mb-0.5',
                  active ? 'bg-black/25 text-white font-semibold border-l-4 border-red-500'
                         : 'rounded-md text-white/55 hover:bg-white/8 hover:text-white',
                )}>
                <Icon size={19} className={cn('mr-3 flex-shrink-0', active ? 'text-red-400' : 'text-white/45')} />
                <span className="text-[13.5px]">{item.label}</span>
                {item.badge && <span className="ml-auto w-[18px] h-[18px] rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">1</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-3 pt-3 space-y-0.5">
          {BOTTOM_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={onClose}
              className="flex items-center h-10 px-3 rounded-md text-white/45 hover:bg-white/8 hover:text-white transition-all duration-150">
              <Icon size={17} className="mr-3 text-white/35 flex-shrink-0" />
              <span className="text-[13px]">{label}</span>
            </Link>
          ))}
          <button onClick={async () => { await logout(); router.push('/admin/auth'); }}
            className="flex items-center h-10 px-3 rounded-md text-white/45 hover:bg-white/8 hover:text-white transition-all duration-150 w-full">
            <LogOut size={17} className="mr-3 text-white/35 flex-shrink-0" />
            <span className="text-[13px]">Logout</span>
          </button>
        </div>
        <div className="border-t border-white/10 p-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-red-800 border border-red-600/60 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-[11px] text-white/40">Administrator</p>
          </div>
          <ChevronRight size={14} className="text-white/25 flex-shrink-0" />
        </div>
      </aside>
    </>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function FleetPerformancePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#120808] text-white flex">

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#1a0505] border-b border-white/10 flex items-center px-4 gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-white/60 hover:text-white -ml-1"><Menu size={21} /></button>
        <img src="/logo.png" alt="Delivery" className="h-8 w-auto object-contain" />
        <div className="ml-auto"><button className="relative p-1.5 text-white/50 hover:text-white"><Bell size={18} /><span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" /></button></div>
      </header>

      {/* main */}
      <div className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-w-0">

        {/* desktop header */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-white/10 bg-[#1a0505]/60 backdrop-blur-sm sticky top-0 z-20">
          <button onClick={() => router.back()} className="p-1.5 text-white/40 hover:text-white transition-colors mr-2">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1" />
          <button className="relative p-1.5 text-white/40 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
        </div>

        <div className="px-4 lg:px-8 pb-10 mt-6">

          {/* ── PAGE TITLE + SEARCH ── */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] text-red-400 uppercase tracking-widest font-semibold mb-1">Operations Control</p>
              <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-white leading-tight">Fleet Intelligence</h1>
            </div>
            {/* search */}
            <div className="relative w-full lg:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search couriers or vehicle IDs..."
                className="w-full h-10 bg-[#1e0e0e] border border-white/10 rounded-xl pl-9 pr-3 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-red-800/60 transition-colors"
              />
            </div>
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-5">

            {/* ── LEFT COLUMN ── */}
            <div className="space-y-5">

              {/* Top Performers */}
              <div className="bg-[#1e0e0e] border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-red-400" />
                    <h2 className="text-sm font-semibold text-white">Top Performers</h2>
                  </div>
                  <button
                    onClick={() => router.push('/admin/fleet-performance')}
                    className="text-[12px] text-white/35 hover:text-white transition-colors flex items-center gap-1"
                  >
                    VIEW ALL <ChevronRight size={13} />
                  </button>
                </div>

                <div className="divide-y divide-white/5">
                  {TOP_PERFORMERS.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors">
                      {/* avatar */}
                      <div className="w-11 h-11 rounded-xl bg-red-900/60 border border-red-700/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {c.initials}
                      </div>
                      {/* name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{c.name}</p>
                        <p className="text-[11px] text-white/35 mt-0.5">Rider ID: {c.id}</p>
                      </div>
                      {/* earnings */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-semibold text-white">{c.earnings}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">Today's Earnings</p>
                      </div>
                      {/* rating */}
                      <div className="flex-shrink-0 text-center w-14">
                        <div className="flex items-center justify-center gap-0.5">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-[13px] font-semibold text-white">{c.rating}</span>
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5">Rating</p>
                      </div>
                      {/* status badge */}
                      <span className={cn(
                        'flex-shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide',
                        c.statusColor,
                      )}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hub Capacity cards */}
              <div className="grid grid-cols-3 gap-3">
                {HUB_CAPS.map((h) => (
                  <div key={h.hub} className="bg-[#1e0e0e] border border-white/10 rounded-xl p-4">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2">{h.hub}</p>
                    <p className="font-display text-2xl font-extrabold text-white">{h.pct}%<span className="text-base font-normal text-white/40 ml-1">Capacity</span></p>
                    <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-700', h.color)} style={{ width: `${h.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-4">

              {/* Live Metrics */}
              <div className="bg-red-900/50 border border-red-700/40 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={16} className="text-red-300" />
                  <h3 className="text-sm font-semibold text-white">Live Metrics</h3>
                </div>

                {/* Avg Engine Temp */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-red-200/50 uppercase tracking-widest">Avg Engine Temp</p>
                    <span className="font-display text-xl font-bold text-white">94°C</span>
                  </div>
                  {/* segmented bar */}
                  <div className="flex gap-0.5 h-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className={cn(
                        'flex-1 rounded-sm',
                        i < 8 ? 'bg-red-400/60' : i < 10 ? 'bg-red-300' : 'bg-white/10',
                      )} />
                    ))}
                  </div>
                  <p className="text-[10px] text-red-200/40 mt-1.5">Normal Operating Range: 85°C – 105°C</p>
                </div>

                {/* Urgent alerts */}
                <div>
                  <p className="text-[10px] text-red-200/50 uppercase tracking-widest mb-2">
                    Urgent Alerts ({URGENT_ALERTS.length})
                  </p>
                  <div className="space-y-2">
                    {URGENT_ALERTS.map((a) => {
                      const Icon = a.icon;
                      return (
                        <div key={a.id} className="flex items-start gap-2.5 bg-red-950/60 border border-red-800/40 rounded-lg px-3 py-2.5">
                          <Icon size={14} className="text-red-300 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-white">{a.id}: {a.issue}</p>
                            <p className="text-[10px] text-red-200/40 mt-0.5">{a.sub}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Fleet Map */}
              <div className="bg-[#1e0e0e] border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white">Fleet Map</h3>
                </div>

                {/* map */}
                <div className="relative" style={{ height: 200 }}>
                  <MapWidget
                    height={200}
                    className="!rounded-none"
                    interactive={false}
                    showCourier
                    showRoute={false}
                  />
                  {/* label overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-white/20 font-medium tracking-wide">Fleet Performance &amp; Health</p>
                  </div>
                </div>

                <div className="p-3">
                  <button
                    onClick={() => router.push('/admin/fleet-monitor')}
                    className="w-full h-10 border border-white/15 rounded-lg text-[11px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:border-white/30 transition-colors"
                  >
                    Expand Fleet View
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
