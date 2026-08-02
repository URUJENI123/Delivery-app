'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import {
  Bike, Package, LayoutDashboard, Users, BarChart2, Shield,
  LogOut, Settings, HelpCircle, ChevronRight, Menu, Bell,
  Search, MessageSquare, Star, AlertTriangle, Phone,
  Navigation, Zap, Fuel, Battery, Thermometer,
} from 'lucide-react';
import Link from 'next/link';
import { MapWidget } from '@/components/map/MapWidget';

// ΓöÇΓöÇ nav items (shared across admin pages) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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

// ΓöÇΓöÇ mock courier detail ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const COURIER = {
  id: 'KE-401',
  company: 'Moto Express',
  name: 'Jean-Claude Bizimana',
  rating: 4.9,
  trips: 1240,
  status: 'BUSY',
  shiftTime: '06h 42m',
  fuelLevel: '82%',
  route: [
    { label: 'Kigali Heights Hub', sub: 'Departure 14:30', done: true },
    { label: 'Transit to Gishushu', sub: 'Estimated arrival: 4 mins', active: true },
    { label: 'Customer: Plot 442, KN 5 Rd', sub: 'Pending delivery', done: false },
  ],
  vehicle: {
    engineTemp: 'Normal (88┬░C)',
    tirePressure: '32 PSI',
    battery: '14.2 V',
  },
};

const REGIONAL_HUBS = [
  { name: 'Nyarugenge Central', active: 12, total: 15, color: 'bg-green-400' },
  { name: 'Remera-East', active: 4, total: 10, color: 'bg-amber-400' },
  { name: 'Kacyiru Hub', active: 18, total: 20, color: 'bg-green-400' },
];

// ΓöÇΓöÇ sidebar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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

export default function FleetMonitorPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);

  const runDiagnostics = () => {
    setDiagnosticsRunning(true);
    setTimeout(() => setDiagnosticsRunning(false), 2000);
  };

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

      {/* main */}
      <div className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-w-0 flex flex-col">

        {/* desktop top bar */}
        <div className="hidden lg:flex items-center h-14 px-6 border-b border-white/10 bg-[#1a0505]/60 backdrop-blur-sm sticky top-0 z-20 gap-4">
          {/* search only */}
          <div className="relative w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search courier ID, order, or hub..."
              className="w-full h-9 bg-[#0d0404] border border-white/10 rounded-lg pl-9 pr-3 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-red-800/60 transition-colors"
            />
          </div>
        </div>

        {/* content: left panel + map */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

          {/* ΓöÇΓöÇ LEFT PANEL ΓöÇΓöÇ */}
          <div className="w-full lg:w-[300px] flex-shrink-0 bg-[#1a0505] border-r border-white/10 overflow-y-auto flex flex-col">

            {/* courier header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="text-base font-bold text-white">Courier Details</h2>
                  <p className="text-[11px] text-white/35">{COURIER.id} ΓÇó {COURIER.company}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-900/50 border border-amber-700/40 text-[10px] font-bold text-amber-400 tracking-wider">
                  {COURIER.status}
                </span>
              </div>
            </div>

            {/* courier card */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-900/60 border border-red-700/40 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  JC
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate">{COURIER.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="text-[12px] text-white/60">{COURIER.rating} ΓÇó {COURIER.trips.toLocaleString()} trips</span>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors">
                  <MessageSquare size={14} />
                </button>
              </div>

              {/* shift + fuel */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-[#120808] border border-white/8 rounded-lg p-2.5">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Shift Time</p>
                  <p className="text-[14px] font-bold text-white">{COURIER.shiftTime}</p>
                </div>
                <div className="bg-[#120808] border border-white/8 rounded-lg p-2.5">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Fuel Level</p>
                  <p className="text-[14px] font-bold text-white">{COURIER.fuelLevel}</p>
                </div>
              </div>
            </div>

            {/* current route */}
            <div className="p-4 border-b border-white/10">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Current Route</p>
              <div className="space-y-3">
                {COURIER.route.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                      step.done ? 'border-white/20 bg-white/10' :
                      step.active ? 'border-red-500 bg-red-900/50' :
                      'border-white/15 bg-transparent',
                    )}>
                      {step.done && <div className="w-1.5 h-1.5 rounded-full bg-white/40" />}
                      {step.active && <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[13px] font-semibold leading-tight',
                        step.active ? 'text-red-400' : step.done ? 'text-white/40' : 'text-white',
                      )}>{step.label}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{step.sub}</p>
                      {step.active && (
                        <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full w-2/3 rounded-full bg-red-500" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* vehicle health */}
            <div className="p-4 border-b border-white/10 flex-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Vehicle Health</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] text-white/50">
                    <Thermometer size={14} className="text-white/30" />
                    Engine Temp
                  </div>
                  <span className="text-[12px] font-semibold text-green-400">{COURIER.vehicle.engineTemp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] text-white/50">
                    <Zap size={14} className="text-white/30" />
                    Tire Pressure
                  </div>
                  <span className="text-[12px] font-semibold text-white">{COURIER.vehicle.tirePressure}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] text-white/50">
                    <Battery size={14} className="text-white/30" />
                    Battery
                  </div>
                  <span className="text-[12px] font-semibold text-white">{COURIER.vehicle.battery}</span>
                </div>
              </div>

              <button
                onClick={runDiagnostics}
                className={cn(
                  'mt-4 w-full h-9 border border-white/15 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all',
                  diagnosticsRunning
                    ? 'text-red-400 border-red-700/40 bg-red-900/20 animate-pulse'
                    : 'text-white/50 hover:text-white hover:border-white/30 bg-transparent',
                )}
              >
                {diagnosticsRunning ? 'Running...' : 'Run Diagnostics'}
              </button>
            </div>

            {/* fleet performance link */}
            <div className="px-4 pb-2 mt-8">
              <button
                onClick={() => router.push('/admin/fleet-performance')}
                className="w-full h-10 border border-white/15 rounded-lg text-[11px] font-bold tracking-widest uppercase text-white/50 hover:text-white hover:border-white/30 transition-colors"
              >
                Fleet Performance &amp; Health
              </button>
            </div>

            {/* emergency override */}
            <div className="p-4">
              <button className="w-full h-12 bg-red-950/80 hover:bg-red-900/80 border border-red-700/50 rounded-xl text-red-400 font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 transition-colors">
                <Phone size={16} />
                EMERGENCY OVERRIDE
              </button>
            </div>
          </div>

          {/* ΓöÇΓöÇ MAP ΓöÇΓöÇ */}
          <div className="flex-1 relative min-h-[400px] lg:min-h-0">
            <MapWidget
              height="100%"
              className="!rounded-none absolute inset-0"
              interactive
              showCourier
              showRoute
            />

            {/* regional hubs panel ΓÇö top right */}
            <div className="absolute top-4 right-4 z-10 bg-[#1a0505]/95 border border-white/10 rounded-xl p-3 min-w-[200px] shadow-xl">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[12px] font-semibold text-white">Regional Hubs</p>
                <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-900/30 border border-red-800/40 rounded-full px-2 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="space-y-2">
                {REGIONAL_HUBS.map((hub) => (
                  <div key={hub.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', hub.color)} />
                      <span className="text-[12px] text-white/65">{hub.name}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-white">
                      {hub.active}/{hub.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* bottom-left status pill */}
            <div className="absolute bottom-4 left-4 z-10 bg-[#1a0505]/90 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[12px] text-white/60">System Optimal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
