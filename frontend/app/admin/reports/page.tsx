'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import {
  Search, Users, Shield, MoreVertical, Download, Calendar,
  Bell, HelpCircle, LogOut, LayoutDashboard, Bike, Package,
  BarChart2, X, ChevronRight, CheckCircle,
  TrendingUp, TrendingDown, Clock, Activity, CalendarDays, Check,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ΓöÇΓöÇ Shared Navigation Layout Constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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

// ΓöÇΓöÇ Sidebar Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const sidebarContent = (
    <aside className={cn(
      'flex flex-col w-[240px] h-screen bg-[#1a0505] border-r border-white/10',
      'lg:fixed lg:left-0 lg:top-0 lg:z-40',
      'fixed left-0 top-0 z-50 transition-transform duration-200',
      open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    )}>
      {/* logo */}
      <div className="h-20 flex items-center justify-center px-4 border-b border-white/10 flex-shrink-0">
        <img src="/logo.png" alt="Delivery" className="h-14 w-auto object-contain" />
        <button onClick={onClose} className="lg:hidden ml-auto p-1 text-white/40 hover:text-white">
          Γ£ò
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
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      )}
      {sidebarContent}
    </>
  );
}

// ΓöÇΓöÇ Mobile Top Bar Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function AdminMobileTopBar({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#1a0505] border-b border-white/10 flex items-center px-4 gap-3">
      <button onClick={onSidebarToggle} className="p-1.5 text-white/60 hover:text-white -ml-1">
        Γ£ò
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

// ΓöÇΓöÇ Mock Data Generator ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const generatePerformanceData = () => {
  const data = [];
  const baseDate = new Date('2023-10-24');
  
  // Static rows matching screenshot exactly:
  const staticRows = [
    { date: 'Oct 24, 2023', totalOrders: 148, completed: 142, completedPct: 96, canceled: 6, revenue: 12450.00 },
    { date: 'Oct 23, 2023', totalOrders: 165, completed: 161, completedPct: 98, canceled: 4, revenue: 14120.50 },
    { date: 'Oct 22, 2023', totalOrders: 132, completed: 128, completedPct: 97, canceled: 4, revenue: 11200.00 },
    { date: 'Oct 21, 2023', totalOrders: 190, completed: 182, completedPct: 96, canceled: 8, revenue: 16840.25 },
  ];

  // Insert static ones first
  data.push(...staticRows);

  // Generate 27 more days to get 31 days total
  for (let i = 4; i < 31; i++) {
    const d = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
    const totalOrders = Math.floor(Math.random() * 80) + 120; // 120 - 200
    const completedPct = Math.floor(Math.random() * 5) + 94; // 94% - 99%
    const completed = Math.round(totalOrders * (completedPct / 100));
    const canceled = totalOrders - completed;
    const revenue = parseFloat((completed * (Math.random() * 20 + 80)).toFixed(2)); // avg order size
    
    // Format date: e.g. "Oct 20, 2023"
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
    const dateFormatted = d.toLocaleDateString('en-US', options);

    data.push({
      date: dateFormatted,
      totalOrders,
      completed,
      completedPct,
      canceled,
      revenue,
    });
  }

  return data;
};

// SVG Paths representing chart trends
const WEEKLY_CHART_PATH = "M 10,240 Q 60,230 110,210 T 210,250 T 310,200 T 410,230 T 510,180 T 610,200 T 710,150 T 810,165";
const WEEKLY_CHART_FILL = "M 10,240 Q 60,230 110,210 T 210,250 T 310,200 T 410,230 T 510,180 T 610,200 T 710,150 T 810,165 L 810,355 L 10,355 Z";

const MONTHLY_CHART_PATH = "M 10,220 C 100,280 200,150 300,230 C 400,310 500,120 600,190 C 700,260 750,140 810,160";
const MONTHLY_CHART_FILL = "M 10,220 C 100,280 200,150 300,230 C 400,310 500,120 600,190 C 700,260 750,140 810,160 L 810,355 L 10,355 Z";

// ΓöÇΓöÇ Main Page Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default function ReportsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Date range picker states
  const [dateRange, setDateRange] = useState('Oct 01, 2023 - Oct 31, 2023');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Chart states
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Performance Table states
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setPerformanceData(generatePerformanceData());
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Filter Table Data based on search
  const filteredData = performanceData.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.date.toLowerCase().includes(q) || 
           d.totalOrders.toString().includes(q) || 
           d.completed.toString().includes(q) ||
           d.canceled.toString().includes(q) ||
           d.revenue.toFixed(2).includes(q);
  });

  // Paginate Table (4 items per page, matching screenshot showing 1-4 of 31 days)
  const itemsPerPage = 4;
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = 'Date,Total Orders,Completed,Completed Pct,Canceled,Revenue\n';
    const rows = performanceData.map(d => 
      `"${d.date}",${d.totalOrders},${d.completed},${d.completedPct}%,${d.canceled},${d.revenue}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `performance_report_${dateRange.replace(/[\s,]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDateRangeSelect = (range: string) => {
    setDateRange(range);
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120808] flex items-center justify-center">
        <div className="space-y-4 w-64 animate-pulse">
          <div className="h-8 bg-white/5 rounded-lg w-1/2 mx-auto" />
          <div className="h-24 bg-white/5 rounded-xl" />
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#120808] text-white flex">
      {/* Sidebar Layout */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminMobileTopBar onSidebarToggle={() => setSidebarOpen(true)} />

      {/* Main Content Pane */}
      <div className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-white/10 bg-[#1a0505]/60 backdrop-blur-sm sticky top-0 z-20">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search analytics..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-[#1a0c0c]/40 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/30 w-64 focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-white/50 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <button className="text-white/50 hover:text-white transition-colors">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 px-4 lg:px-6 pb-12">
          {/* Header Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Reports & Analytics</h1>
              <p className="text-sm text-white/40 mt-1">Comprehensive performance monitoring for Kinetic Velocity fleet.</p>
            </div>
            
            <div className="flex items-center gap-3 relative">
              {/* Datepicker Dropdown Trigger */}
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="h-10 px-4 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
              >
                <Calendar size={14} className="text-white/45" />
                {dateRange}
              </button>

              {showDatePicker && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowDatePicker(false)} />
                  <div className="absolute right-0 top-12 bg-[#1a0c0c] border border-white/10 rounded-xl py-1.5 w-60 shadow-2xl z-40 text-left animate-in fade-in slide-in-from-top-2 duration-100">
                    <div className="px-3 py-1.5 text-[9px] text-white/30 font-bold uppercase tracking-wider">Select Report Period</div>
                    {[
                      'Oct 01, 2023 - Oct 31, 2023',
                      'Today (Oct 24, 2023)',
                      'Last 7 Days',
                      'Last 30 Days',
                      'This Month',
                    ].map(range => (
                      <button
                        key={range}
                        onClick={() => handleDateRangeSelect(range)}
                        className={cn(
                          "w-full px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors text-white/60 text-left flex items-center justify-between",
                          dateRange === range && "text-white font-bold bg-white/5"
                        )}
                      >
                        <span>{range}</span>
                        {dateRange === range && <Check size={12} className="text-red-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                className="h-10 px-4 bg-[#fca5a5]/10 border border-[#fca5a5]/20 hover:bg-[#fca5a5]/25 text-[#fca5a5] hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          </div>

          {/* ΓöÇΓöÇ KPI METRICS CARDS ROW ΓöÇΓöÇ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Card 1: Success Rate */}
            <div className="relative bg-[#1e0e0e] border border-white/5 rounded-xl p-5 overflow-hidden shadow-[0_0_15px_-3px_rgba(255,255,255,0.01)] hover:border-white/10 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-emerald-500 to-emerald-600" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle size={16} />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp size={12} />
                  +0.4%
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">Delivery Success Rate</p>
              <p className="font-display text-3xl font-bold text-white mt-1 leading-none">98.2%</p>
            </div>

            {/* Card 2: Total Deliveries */}
            <div className="relative bg-[#1e0e0e] border border-white/5 rounded-xl p-5 overflow-hidden shadow-[0_0_15px_-3px_rgba(255,255,255,0.01)] hover:border-white/10 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-blue-500 to-blue-600" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Package size={16} />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp size={12} />
                  +12%
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">Total Deliveries</p>
              <p className="font-display text-3xl font-bold text-white mt-1 leading-none">1,452</p>
            </div>

            {/* Card 3: Avg Fulfillment Time */}
            <div className="relative bg-[#1e0e0e] border border-white/5 rounded-xl p-5 overflow-hidden shadow-[0_0_15px_-3px_rgba(255,255,255,0.01)] hover:border-white/10 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-amber-500 to-amber-600" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock size={16} />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown size={12} className="rotate-180" />
                  -3 mins
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">Avg. Fulfillment Time</p>
              <p className="font-display text-3xl font-bold text-white mt-1 leading-none">22 mins</p>
            </div>

            {/* Card 4: Fleet Utilization */}
            <div className="relative bg-[#1e0e0e] border border-white/5 rounded-xl p-5 overflow-hidden shadow-[0_0_15px_-3px_rgba(255,255,255,0.01)] hover:border-white/10 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-red-500 to-red-600" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Activity size={16} />
                </div>
                <span className="text-[10px] font-semibold text-white/35">
                  Peak Hours
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">Fleet Utilization</p>
              <p className="font-display text-3xl font-bold text-white mt-1 leading-none">84%</p>
            </div>
          </div>

          {/* ΓöÇΓöÇ CHARTS ROW: Volume Trends & Regional Performance ΓöÇΓöÇ */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
            {/* Delivery Volume Trends Area Chart Card */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-bold text-white">Delivery Volume Trends</h2>
                  <p className="text-[11px] text-white/35 mt-0.5">Daily volume across all regions</p>
                </div>
                <div className="flex items-center bg-[#120808] border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setChartPeriod('weekly')}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all",
                      chartPeriod === 'weekly' ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                    )}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setChartPeriod('monthly')}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all",
                      chartPeriod === 'monthly' ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                    )}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Glowing SVG Area Line Chart */}
              <div className="relative">
                <svg viewBox="0 0 820 380" className="w-full overflow-visible" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ff0000" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="80" x2="820" y2="80" stroke="white" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="3" />
                  <line x1="0" y1="160" x2="820" y2="160" stroke="white" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="3" />
                  <line x1="0" y1="240" x2="820" y2="240" stroke="white" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="3" />
                  <line x1="0" y1="320" x2="820" y2="320" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />

                  {/* Area fill */}
                  <path
                    d={chartPeriod === 'weekly' ? WEEKLY_CHART_FILL : MONTHLY_CHART_FILL}
                    fill="url(#chartGlow)"
                    className="transition-all duration-500"
                  />

                  {/* Line Stroke */}
                  <path
                    d={chartPeriod === 'weekly' ? WEEKLY_CHART_PATH : MONTHLY_CHART_PATH}
                    fill="none"
                    stroke="#fca5a5"
                    strokeWidth="2.5"
                    className="transition-all duration-500 drop-shadow-[0_0_8px_rgba(252,165,165,0.3)]"
                  />

                  {/* Highlighting Dot */}
                  {chartPeriod === 'weekly' && (
                    <circle cx="710" cy="150" r="4.5" fill="#fca5a5" className="animate-pulse shadow-lg" />
                  )}

                  {/* X-axis day labels */}
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => (
                    <text key={day} x={10 + i * (800 / 6)} y="370" textAnchor="middle" className="fill-white/35 text-[12px] font-semibold">{day}</text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Regional Performance Progress Bars */}
            <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-5 flex flex-col">
              <h2 className="text-sm font-bold text-white mb-6">Regional Performance</h2>
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                {[
                  { region: 'North Metro', pct: 92 },
                  { region: 'Central District', pct: 87 },
                  { region: 'East Hub', pct: 78 },
                  { region: 'South Logistics', pct: 65 },
                ].map(r => (
                  <div key={r.region}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-white/70">{r.region}</span>
                      <span className="text-white">{r.pct}%</span>
                    </div>
                    <div className="h-[7px] w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-[#fca5a5] rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(252,165,165,0.4)]"
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ΓöÇΓöÇ PERFORMANCE BREAKDOWN TABLE ΓöÇΓöÇ */}
          <div className="bg-[#1e0e0e] border border-white/10 rounded-xl mt-6 overflow-hidden">
            {/* Table Header Filter controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-bold text-white">Performance Breakdown</h2>
              <div className="flex items-center gap-2">
                <button className="p-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <Settings size={14} className="text-white/45" />
                </button>
                <button className="p-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <MoreVertical size={14} className="text-white/45" />
                </button>
              </div>
            </div>

            {/* Data Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/35 font-semibold uppercase tracking-wider text-[11px] bg-white/[0.01]">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Total Orders</th>
                    <th className="px-6 py-4">Completed</th>
                    <th className="px-6 py-4">Canceled</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[12.5px]">
                  {paginatedData.map((d, index) => (
                    <tr key={index} className="hover:bg-white/[0.01] transition-colors font-medium">
                      <td className="px-6 py-4 text-white/80">{d.date}</td>
                      <td className="px-6 py-4 text-white">{d.totalOrders}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold">
                          {d.completed} ({d.completedPct}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">{d.canceled}</td>
                      <td className="px-6 py-4 text-right text-white font-semibold">
                        ${d.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-white/30">
                        <CalendarDays size={20} className="mx-auto mb-2 text-white/15" />
                        <p className="text-xs">No analytics data available for this range</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.01]">
              <p className="text-xs text-white/35 font-medium">
                Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems} days
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/20 transition-all",
                    currentPage === 1 && "opacity-30 cursor-not-allowed border-white/5"
                  )}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/20 transition-all",
                    (currentPage === totalPages || totalPages === 0) && "opacity-30 cursor-not-allowed border-white/5"
                  )}
                >
                  Next
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
