'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { MapWidget } from '@/components/map/MapWidget';
import {
  Bike, Package, LayoutDashboard, Users, BarChart2, Shield,
  LogOut, Settings, HelpCircle, ChevronRight, Menu, Bell,
  TrendingUp, AlertTriangle, MoreVertical, ArrowLeft,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

// ΓöÇΓöÇ nav ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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

// ΓöÇΓöÇ mock live feed ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const LIVE_ORDERS = [
  { id: '#KGL-88219', status: 'IN_TRANSIT',   route: 'Kacyiru ΓåÆ Nyarutarama',      eta: '12 min' },
  { id: '#KGL-88220', status: 'DISPATCHING',  route: 'Kigali Center ΓåÆ Hub A',       eta: '4 min'  },
  { id: '#KGL-88221', status: 'DELIVERED',    route: 'Kigali Heights ΓåÆ Kimihurura', eta: 'Now'    },
  { id: '#KGL-88222', status: 'IN_TRANSIT',   route: 'Gikondo ΓåÆ Rebero',            eta: '24 min' },
];

function statusStyle(s: string) {
  switch (s) {
    case 'IN_TRANSIT':   return 'bg-red-900/50 border border-red-600/50 text-red-300';
    case 'DISPATCHING':  return 'bg-amber-900/40 border border-amber-600/40 text-amber-300';
    case 'DELIVERED':    return 'bg-green-900/40 border border-green-600/40 text-green-300';
    default:             return 'bg-white/5 border border-white/15 text-white/50';
  }
}

// ΓöÇΓöÇ sidebar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

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
            const Icon = item.icon;
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
          {BOTTOM_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className="flex items-center h-10 px-3 rounded-md text-white/45 hover:bg-white/8 hover:text-white transition-all duration-150">
                <Icon size={17} className="mr-3 text-white/35 flex-shrink-0" />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
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

// ΓöÇΓöÇ page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default function LogisticsPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveTrack, setLiveTrack] = useState(true);

  useEffect(() => {
    api.get<any>('/admin/deliveries').then((res) => {
      setDeliveries(Array.isArray(res) ? res : res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // merge real deliveries into live feed
  const feed = [
    ...LIVE_ORDERS,
    ...deliveries.slice(0, 4).map((d: any) => ({
      id: `#${d.trackingCode || d.id?.slice(0, 8)}`,
      status: d.status === 'IN_TRANSIT' ? 'IN_TRANSIT' : d.status === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHING',
      route: `${d.pickupAddress?.split(',')[0] ?? 'ΓÇö'} ΓåÆ ${d.dropoffAddress?.split(',')[0] ?? 'ΓÇö'}`,
      eta: d.status === 'DELIVERED' ? 'Done' : 'ΓÇö',
    })),
  ];

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
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 text-white/40 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-white">Logistics</h1>
              <p className="text-[12px] text-white/35">Live delivery operations ┬╖ Kigali Metro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-1.5 text-white/40 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        <div className="px-4 lg:px-6 pb-10 mt-5 space-y-4">

          {/* ΓöÇΓöÇ KPI ROW ΓöÇΓöÇ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Active Orders */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <p className="text-[10px] text-white/35 uppercase tracking-widest">Active Orders</p>
                <div className="w-9 h-9 rounded-lg bg-red-900/50 border border-red-700/30 flex items-center justify-center">
                  <Truck size={16} className="text-red-400" />
                </div>
              </div>
              <p className="font-display text-3xl font-bold text-white mt-2">1,429</p>
              <p className="text-[12px] text-green-400 mt-1.5 flex items-center gap-1">
                <TrendingUp size={11} /> +12.5% vs last hour
              </p>
            </div>

            {/* Success Rate */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <p className="text-[10px] text-white/35 uppercase tracking-widest">Success Rate</p>
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Settings size={16} className="text-white/40" />
                </div>
              </div>
              <p className="font-display text-3xl font-bold text-white mt-2">98.4%</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-red-500" style={{ width: '98.4%' }} />
              </div>
              <p className="text-[11px] text-white/30 mt-1.5">System optimum state</p>
            </div>

            {/* Gross Revenue */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <p className="text-[10px] text-white/35 uppercase tracking-widest">Gross Revenue (Today)</p>
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <BarChart2 size={16} className="text-white/40" />
                </div>
              </div>
              <p className="font-display text-3xl font-bold text-white mt-2">RWF 4.2M</p>
              <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1.5">
                <span className="text-[9px] font-bold border border-amber-600/40 bg-amber-900/30 px-1.5 py-0.5 rounded">ΓÜí PEAK SURGE</span>
                Live updates
              </p>
            </div>
          </div>

          {/* ΓöÇΓöÇ MIDDLE ROW: Map + Fleet Distribution ΓöÇΓöÇ */}
          <div className="grid lg:grid-cols-[1fr_300px] gap-4">

            {/* Delivery Density map */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div>
                  <h2 className="text-sm font-semibold text-white">Delivery Density</h2>
                  <p className="text-[12px] text-white/35 mt-0.5">Real-time sector heat map ΓÇó Kigali Metropolitan</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLiveTrack(false)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors',
                      !liveTrack ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white',
                    )}
                  >
                    Sector View
                  </button>
                  <button
                    onClick={() => setLiveTrack(true)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors',
                      liveTrack ? 'bg-red-600 text-white' : 'text-white/40 hover:text-white',
                    )}
                  >
                    Live Track
                  </button>
                </div>
              </div>

              {/* map */}
              <div className="relative" style={{ height: 300 }}>
                <MapWidget height={300} className="!rounded-none" interactive showCourier showRoute={liveTrack} />

                {/* hotspots legend */}
                <div className="absolute top-3 left-3 z-10 bg-[#1a0808]/90 border border-white/10 rounded-lg px-3 py-2.5">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">Hotspots</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-[12px] text-white/70">Nyarugenge Central</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-[12px] text-white/70">Remera Hub</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* right column: Fleet Distribution + Fuel Efficiency */}
            <div className="flex flex-col gap-4">

              {/* Fleet Distribution */}
              <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5 flex-1">
                <h2 className="text-sm font-semibold text-white mb-4">Fleet Distribution</h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Bike size={15} className="text-white/40" />
                        <span className="text-[13px] text-white/70">Express Moto</span>
                      </div>
                      <span className="text-[13px] font-semibold text-white">720 units</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500" style={{ width: '80%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Truck size={15} className="text-white/40" />
                        <span className="text-[13px] text-white/70">Cargo Vans</span>
                      </div>
                      <span className="text-[13px] font-semibold text-white">180 units</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-red-800" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>

                {/* system alert */}
                <div className="mt-5 bg-[#120808] border border-white/8 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">System Alert</p>
                    <p className="text-[13px] font-semibold text-white">12 Motos refueling at Hub B</p>
                  </div>
                </div>
              </div>

              {/* Fuel Efficiency */}
              <div className="bg-red-900/60 border border-red-700/40 rounded-xl p-5">
                <p className="text-[10px] text-red-300/70 uppercase tracking-widest mb-2">Fuel Efficiency</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold text-white">92%</span>
                  <TrendingUp size={20} className="text-red-300 mb-1" />
                </div>
                <p className="text-[12px] text-red-200/60 mt-1">Fleet-wide average optimization</p>
              </div>
            </div>
          </div>

          {/* ΓöÇΓöÇ LIVE LOGISTICS FEED ΓöÇΓöÇ */}
          <div className="bg-[#1e0e0e] border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">Live Logistics Feed</h2>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 border border-red-800/40 bg-red-900/20 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE STREAMING
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Order ID', 'Status', 'Route', 'ETA', 'Action'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {feed.map((row, i) => (
                    <tr key={i} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-4 text-[13px] font-semibold text-white">{row.id}</td>
                      <td className="px-5 py-4">
                        <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide', statusStyle(row.status))}>
                          {row.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-white/60">{row.route}</td>
                      <td className="px-5 py-4 text-[13px] font-semibold text-white">{row.eta}</td>
                      <td className="px-5 py-4">
                        <button className="p-1.5 text-white/30 hover:text-white transition-colors rounded-md hover:bg-white/5">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
