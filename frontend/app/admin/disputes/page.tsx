'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { MapWidget } from '@/components/map/MapWidget';
import {
  Bike, Package, LayoutDashboard, Users, BarChart2, Shield,
  LogOut, Settings, HelpCircle, ChevronRight, Menu, Bell,
  AlertTriangle, ArrowLeft, Clock, Activity, Layers,
  Navigation, RefreshCw, MapPin,
} from 'lucide-react';
import Link from 'next/link';

// ΓöÇΓöÇ nav ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const NAV_ITEMS = [
  { href: '/admin/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/couriers',   label: 'Fleet',      icon: Bike },
  { href: '/admin/deliveries', label: 'Logistics',  icon: Package },
  { href: '/admin/users',      label: 'Users',      icon: Users },
  { href: '/admin/disputes',   label: 'Operations', icon: Shield, badge: true },
  { href: '/admin/reports',    label: 'Reports',    icon: BarChart2 },
];
const BOTTOM_LINKS = [
  { href: '/admin/settings', label: 'Settings',      icon: Settings   },
  { href: '/admin/support', label: 'Help & Support', icon: HelpCircle },
];

// ΓöÇΓöÇ mock data ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const PROBLEMATIC_HUBS = [
  {
    name: 'Kigali City Market',
    sub: 'Central Transit Hub',
    severity: 'CRITICAL',
    waitTime: '42m',
    congestion: '94%',
    congestColor: 'text-red-400',
    borderColor: 'border-red-700/50',
  },
  {
    name: 'Remera Hub',
    sub: 'Eastern District',
    severity: 'WARNING',
    waitTime: '18m',
    congestion: '62%',
    congestColor: 'text-amber-400',
    borderColor: 'border-amber-700/40',
  },
];

const SERVICE_INFRA = [
  { name: 'Fleet Tracking v2',  status: 'Stable',          color: 'text-green-400' },
  { name: 'Payment Gateway',    status: 'Stable',          color: 'text-green-400' },
  { name: 'Geo-Heatmap API',    status: 'Latency (140ms)', color: 'text-amber-400' },
];

const ACTIVE_QUEUE = [
  {
    tag: 'URGENT ΓÇó EXPRESS', id: '#KG-4921',
    title: 'Medical Supplies Delivery', route: 'CHUK Hospital ΓåÆ Nyarutarama',
    action: 'RE-ASSIGN', actionStyle: 'bg-red-600 hover:bg-red-700 text-white',
    extra: '+12', status: null,
  },
  {
    tag: 'STANDARD ΓÇó PENDING', id: '#KG-5012',
    title: 'Gourmet Catering Order', route: 'Kimihurura ΓåÆ Kiyovu',
    action: 'BOOST', actionStyle: 'bg-white/10 hover:bg-white/15 text-white/70 border border-white/15',
    sub: 'Finding nearby courier...',
  },
  {
    tag: 'STANDARD ΓÇó IN TRANSIT', id: '#KG-5033',
    title: 'E-commerce Bulk Pack', route: 'Warehousing ΓåÆ Kacyiru',
    action: null,
    badge: 'Picked Up', eta: 'ETA: 12:40',
  },
  {
    tag: 'ECONOMY ΓÇó SCHEDULED', id: '#KG-5100',
    title: 'Documents Batch', route: 'Gikondo ΓåÆ Town Hall',
    action: null,
  },
];

// ΓöÇΓöÇ sidebar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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
          <button onClick={onClose} className="lg:hidden ml-auto p-1 text-white/40 hover:text-white">Γ£ò</button>
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

// ΓöÇΓöÇ clock ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' CAT');
    };
    fmt();
    const t = setInterval(fmt, 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{time}</span>;
}

// ΓöÇΓöÇ page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default function OperationsPage() {
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

        {/* desktop status bar */}
        <div className="hidden lg:flex items-center justify-between h-12 px-6 border-b border-white/10 bg-[#0d0404]/80 backdrop-blur-sm sticky top-0 z-20">
          <button onClick={() => router.back()} className="p-1.5 text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[12px] text-white/60">API: 99.9%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[12px] text-white/60">SYS UPTIME: 42D</span>
            </div>
            <div className="flex items-center gap-1.5 border border-white/15 rounded-lg px-3 py-1">
              <Clock size={13} className="text-red-400" />
              <span className="text-[12px] font-mono text-white"><LiveClock /></span>
            </div>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="flex flex-col lg:flex-row h-[calc(100vh-48px)] overflow-hidden">

          {/* ΓöÇΓöÇ LEFT PANEL ΓöÇΓöÇ */}
          <div className="w-full lg:w-[260px] flex-shrink-0 border-r border-white/10 overflow-y-auto flex flex-col">

            {/* Problematic Hubs */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={15} className="text-amber-400" />
                <h2 className="text-[13px] font-semibold text-white">Problematic Hubs</h2>
                <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-900/30 border border-red-800/40 rounded-full px-2 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />LIVE UPDATES
                </span>
              </div>

              <div className="space-y-3">
                {PROBLEMATIC_HUBS.map((h) => (
                  <div key={h.name} className={cn('bg-[#1e0e0e] border rounded-xl p-3.5', h.borderColor)}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-[13px] font-semibold text-white">{h.name}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{h.sub}</p>
                      </div>
                      <span className={cn(
                        'text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full',
                        h.severity === 'CRITICAL'
                          ? 'bg-red-600/30 border border-red-600/50 text-red-300'
                          : 'bg-amber-900/40 border border-amber-600/40 text-amber-300',
                      )}>{h.severity}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                      <div className="bg-[#120808] rounded-lg p-2">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Wait Time</p>
                        <p className="text-[15px] font-bold text-white">{h.waitTime}</p>
                      </div>
                      <div className="bg-[#120808] rounded-lg p-2">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Congestion</p>
                        <p className={cn('text-[15px] font-bold', h.congestColor)}>{h.congestion}</p>
                      </div>
                    </div>
                    <button className="mt-2.5 w-full h-8 bg-[#120808] border border-white/10 rounded-lg text-[10px] font-bold tracking-widest uppercase text-white/50 hover:text-white hover:border-white/20 transition-colors">
                      Redeploy Assets
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Infrastructure */}
            <div className="p-4">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">Service Infrastructure</p>
              <div className="space-y-2.5">
                {SERVICE_INFRA.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="text-[12px] text-white/55">{s.name}</span>
                    <span className={cn('text-[12px] font-semibold', s.color)}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ΓöÇΓöÇ CENTRE MAP ΓöÇΓöÇ */}
          <div className="flex-1 flex flex-col min-w-0 relative">

            {/* map ΓÇö fills available space */}
            <div className="flex-1 relative min-h-[300px]">
              <MapWidget
                height="100%"
                className="!rounded-none absolute inset-0"
                interactive
                showCourier
                showRoute
              />

              {/* Kigali Center label */}
              <div className="absolute top-[40%] left-[35%] z-10 pointer-events-none">
                <div className="bg-[#1a0808]/90 border border-white/20 rounded-lg px-3 py-1.5 shadow-lg">
                  <p className="text-[11px] font-bold text-white">Kigali Center</p>
                </div>
              </div>

              {/* demand intensity legend */}
              <div className="absolute bottom-4 left-4 z-10 bg-[#1a0808]/90 border border-white/10 rounded-lg px-3 py-2.5 shadow-xl">
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">Demand Intensity Index</p>
                <div className="flex gap-0.5 h-2 w-40 mb-1">
                  {['#1e40af','#2563eb','#16a34a','#ca8a04','#ea580c','#dc2626'].map((c, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-white/30">LOW</span>
                  <span className="text-[9px] text-white/30">CRITICAL</span>
                </div>
              </div>

              {/* map controls */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                <button className="w-9 h-9 bg-[#1a0808]/90 border border-white/15 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <Layers size={16} />
                </button>
                <button className="w-9 h-9 bg-[#1a0808]/90 border border-white/15 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <Navigation size={16} />
                </button>
              </div>
            </div>

            {/* KPI strip below map */}
            <div className="grid grid-cols-3 border-t border-white/10 flex-shrink-0">
              {[
                { label: 'Active Couriers',   value: '1,242', badge: '+4%',     badgeColor: 'text-green-400' },
                { label: 'In-Transit Orders', value: '3,890', badge: 'Peak',    badgeColor: 'text-amber-400' },
                { label: 'Avg Delivery',      value: '24m',   badge: '+2m delay', badgeColor: 'text-red-400' },
              ].map((k, i) => (
                <div key={k.label} className={cn(
                  'px-5 py-4 bg-[#1a0505]/60',
                  i < 2 ? 'border-r border-white/10' : '',
                )}>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">{k.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-2xl font-bold text-white">{k.value}</p>
                    <span className={cn('text-[11px] font-semibold', k.badgeColor)}>{k.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ΓöÇΓöÇ RIGHT PANEL ΓöÇΓöÇ */}
          <div className="w-full lg:w-[280px] flex-shrink-0 border-l border-white/10 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-white/50" />
                <h2 className="text-[13px] font-semibold text-white">Active Queue</h2>
              </div>
              <button className="text-[11px] text-white/35 hover:text-white transition-colors flex items-center gap-1">
                View All <ChevronRight size={12} />
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {ACTIVE_QUEUE.map((q, i) => (
                <div key={i} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] text-white/35 uppercase tracking-wide">{q.tag}</span>
                    <span className="text-[10px] text-white/25 font-mono">{q.id}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-white mb-0.5">{q.title}</p>
                  <p className="text-[11px] text-white/40 mb-2">{q.route}</p>

                  {/* sub text */}
                  {(q as any).sub && (
                    <p className="text-[11px] text-white/30 mb-2">{(q as any).sub}</p>
                  )}

                  {/* badge + eta row */}
                  {((q as any).badge || (q as any).eta) && (
                    <div className="flex items-center gap-2 mb-2">
                      {(q as any).badge && (
                        <span className="text-[10px] font-semibold text-green-400 bg-green-900/30 border border-green-700/30 rounded-full px-2 py-0.5">
                          {(q as any).badge}
                        </span>
                      )}
                      {(q as any).eta && (
                        <span className="text-[11px] text-white/45 ml-auto">{(q as any).eta}</span>
                      )}
                    </div>
                  )}

                  {/* courier count badge + action */}
                  {q.action && (
                    <div className="flex items-center justify-between mt-1">
                      {(q as any).extra && (
                        <span className="text-[10px] font-bold text-white bg-white/10 border border-white/15 rounded-full px-2 py-0.5">
                          +{(q as any).extra}
                        </span>
                      )}
                      <button className={cn(
                        'ml-auto px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-colors',
                        q.actionStyle,
                      )}>
                        {q.action}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* floating locate button ΓÇö bottom right */}
        <button
          onClick={() => router.push('/admin/fleet-monitor')}
          className="fixed bottom-6 right-6 w-12 h-12 bg-red-200 hover:bg-red-300 rounded-full shadow-xl flex items-center justify-center transition-colors z-30"
        >
          <MapPin size={20} className="text-red-800" />
        </button>

      </div>
    </div>
  );
}
