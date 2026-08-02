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
  AlertTriangle, Star, Download, SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';

// ΓöÇΓöÇ constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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

const TREND_DATA = [
  { time: '06:00', minutes: 18 },
  { time: '10:00', minutes: 32 },
  { time: '14:00', minutes: 22 },
  { time: '18:00', minutes: 45 },
  { time: '22:00', minutes: 38 },
  { time: '02:00', minutes: 28 },
];

const BAR_COLORS = ['#7f1d1d', '#f87171', '#7f1d1d', '#b91c1c', '#f87171', '#7f1d1d'];

const TOP_COURIERS = [
  { initials: 'BK', name: 'Bernard K.', deliveries: 142, rating: 4.98, color: '#7c2d12' },
  { initials: 'MU', name: 'Marie U.', deliveries: 128, rating: 4.95, color: '#1e40af' },
  { initials: 'JN', name: 'Jean N.', deliveries: 115, rating: 4.92, color: '#065f46' },
];

const PROBLEMATIC_HUBS = [
  { name: 'Kimironko Station B', issue: 'Wait time: +18m avg', icon: 'ΓÅ▒' },
  { name: 'Nyamirambo Hub', issue: 'Congestion: High', icon: '≡ƒÜª' },
  { name: 'Gikondo Storage', issue: 'Missed Pickups: 12', icon: '≡ƒôª' },
];

// ΓöÇΓöÇ shared sidebar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
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
                  active
                    ? 'bg-black/25 text-white font-semibold border-l-4 border-red-500'
                    : 'rounded-md text-white/55 hover:bg-white/8 hover:text-white',
                )}>
                <Icon size={19} className={cn('mr-3 flex-shrink-0', active ? 'text-red-400' : 'text-white/45')} />
                <span className="text-[13.5px]">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto w-[18px] h-[18px] rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">1</span>
                )}
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
    </>
  );
}

// ΓöÇΓöÇ page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default function FleetPage() {
  const router = useRouter();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get<any>('/admin/couriers').then((res) => {
      setCouriers(Array.isArray(res) ? res : res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120808] flex items-center justify-center">
        <div className="space-y-3 w-64">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#120808] text-white flex">

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#1a0505] border-b border-white/10 flex items-center px-4 gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-white/60 hover:text-white -ml-1">
          <Menu size={21} />
        </button>
        <img src="/logo.png" alt="Delivery" className="h-8 w-auto object-contain" />
        <div className="ml-auto">
          <button className="relative p-1.5 text-white/50 hover:text-white">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* main content */}
      <div className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-w-0">

        {/* desktop header */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-white/10 bg-[#1a0505]/60 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h1 className="font-display text-lg font-bold text-white">Fleet Analytics</h1>
            <p className="text-[12px] text-white/35">Real-time performance metrics for Kigali metropolis.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-9 px-4 border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-2">
              <Download size={14} /> Export Report
            </button>
            <button className="h-9 px-4 border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-2">
              <SlidersHorizontal size={14} /> Settings
            </button>
          </div>
        </div>

        <div className="px-4 lg:px-6 pb-10 space-y-4 mt-5">

          {/* ΓöÇΓöÇ ROW 1: Trends + Earnings ΓöÇΓöÇ */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-4">

            {/* Delivery Time Trends */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Delivery Time Trends</h2>
                  <p className="text-[12px] text-white/35 mt-0.5">Average turnaround per sector (last 24h)</p>
                </div>
                <span className="font-display text-xl font-bold text-red-400">24.5 min</span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TREND_DATA} barCategoryGap="30%">
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#1e0e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      formatter={(v: any) => [`${v} min`, 'Avg Time']}
                    />
                    <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                      {TREND_DATA.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Earnings */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5 flex flex-col">
              <h2 className="text-sm font-semibold text-white mb-0.5">Earnings</h2>
              <p className="text-[12px] text-white/35 mb-4">Fleet commission share</p>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-40 h-40 rounded-xl border-2 border-red-800/60 bg-red-950/30 flex flex-col items-center justify-center">
                  <p className="font-display text-2xl font-bold text-white">RWF 4.2M</p>
                  <p className="text-[12px] text-green-400 mt-1">+12.4%</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-[13px] text-white/70">Boda-Boda</span>
                  </div>
                  <span className="text-[13px] font-semibold text-white">64%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-800 flex-shrink-0" />
                    <span className="text-[13px] text-white/70">Express Vans</span>
                  </div>
                  <span className="text-[13px] font-semibold text-white">36%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ΓöÇΓöÇ ROW 2: Kigali Demand Heatmap ΓöÇΓöÇ */}
          <div className="bg-[#1e0e0e] border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h2 className="text-sm font-semibold text-white">Kigali Demand Heatmap</h2>
                <p className="text-[12px] text-white/35 mt-0.5">Sector activity density</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-600" />
                  <span className="text-[11px] text-white/50">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-900" />
                  <span className="text-[11px] text-white/50">Moderate</span>
                </div>
              </div>
            </div>

            {/* map container ΓÇö fixed pixel height so MapLibre renders */}
            <div className="relative" style={{ height: 300 }}>
              <MapWidget
                height={300}
                className="!rounded-none"
                interactive
                showCourier={false}
                showRoute={false}
              />
              {/* demand labels ΓÇö clickable, navigate to fleet monitor */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {[
                  { label: 'KACYIRU', orders: '142 Orders/hr', top: '38%', left: '30%' },
                  { label: 'NYARUGENGE', orders: '88 Orders/hr', top: '25%', left: '16%' },
                  { label: 'REMERA', orders: '56 Orders/hr', top: '30%', right: '20%' },
                ].map((d) => (
                  <button
                    key={d.label}
                    onClick={() => router.push('/admin/fleet-monitor')}
                    className="absolute pointer-events-auto bg-[#1a0808]/90 border border-red-700/50 rounded-lg px-3 py-1.5 text-center shadow-lg hover:border-red-500 hover:bg-[#2a0a0a]/95 transition-all cursor-pointer"
                    style={{ top: d.top, left: (d as any).left, right: (d as any).right }}
                  >
                    <p className="text-[11px] font-bold text-white tracking-wide">{d.label}</p>
                    <p className="text-[10px] text-red-400">{d.orders}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ΓöÇΓöÇ ROW 3: Top Couriers + Problematic Hubs ΓöÇΓöÇ */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-4">

            {/* Top Performing Couriers */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Top Performing Couriers</h2>
                <button
                  onClick={() => router.push('/admin/fleet-performance')}
                  className="text-[12px] text-white/35 hover:text-white transition-colors flex items-center gap-1"
                >
                  VIEW ALL <ChevronRight size={13} />
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider font-medium">Courier</th>
                    <th className="text-left px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider font-medium">Deliveries</th>
                    <th className="text-left px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider font-medium">Rating</th>
                    <th className="text-left px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {TOP_COURIERS.map((c) => (
                    <tr key={c.name} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                            style={{ background: c.color }}>
                            {c.initials}
                          </div>
                          <span className="text-[13px] font-medium text-white">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-white/70">{c.deliveries}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-[13px] text-amber-400 font-semibold">
                          <Star size={12} className="fill-amber-400" />{c.rating}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="text-[12px] font-semibold text-red-400 hover:text-red-300 transition-colors">Bonus</button>
                      </td>
                    </tr>
                  ))}
                  {couriers.filter((c: any) => c.isApprovedByAdmin && c.totalDeliveries > 0).slice(0, 2).map((c: any) => (
                    <tr key={c.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                            {(c.user?.fullName || 'C').charAt(0)}
                          </div>
                          <span className="text-[13px] font-medium text-white">{c.user?.fullName || 'Courier'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-white/70">{c.totalDeliveries}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-[13px] text-amber-400 font-semibold">
                          <Star size={12} className="fill-amber-400" />
                          {c.avgRating ? Number(c.avgRating).toFixed(2) : 'ΓÇö'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="text-[12px] font-semibold text-red-400 hover:text-red-300 transition-colors">Bonus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Problematic Hubs */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Problematic Hubs</h2>
              </div>
              <div className="divide-y divide-white/5">
                {PROBLEMATIC_HUBS.map((h) => (
                  <div key={h.name} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-[13px] font-semibold text-white">{h.name}</p>
                      <p className="text-[12px] text-white/40 mt-0.5">{h.issue}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-red-900/50 border border-red-700/30 flex items-center justify-center text-base flex-shrink-0">
                      {h.icon}
                    </div>
                  </div>
                ))}
              </div>
              {couriers.filter((c: any) => !c.isApprovedByAdmin).length > 0 && (
                <div className="border-t border-white/10 px-5 py-4">
                  <p className="text-[12px] text-white/40 mb-2">
                    {couriers.filter((c: any) => !c.isApprovedByAdmin).length} couriers pending approval
                  </p>
                  <button
                    onClick={() => router.push('/admin/fleet-performance')}
                    className="w-full h-9 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-lg transition-colors"
                  >
                    Review Applications
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
