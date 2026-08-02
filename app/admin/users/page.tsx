'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import {
  Search, Users, UserCheck, Shield, MoreVertical,
  Download, UserPlus, Clock, Ban, WifiOff, ChevronLeft,
  ChevronRight, Bell, HelpCircle, LogOut, LayoutDashboard,
  Bike, Package, BarChart2, Settings, X, Trash2, UserMinus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Shared Layout Constants ──────────────────────────────────────────────────

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

// ── Sidebar Component ───────────────────────────────────────────────────────

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
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      )}
      {sidebarContent}
    </>
  );
}

// ── Mobile Top Bar Component ─────────────────────────────────────────────────

function AdminMobileTopBar({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#1a0505] border-b border-white/10 flex items-center px-4 gap-3">
      <button onClick={onSidebarToggle} className="p-1.5 text-white/60 hover:text-white -ml-1">
        ✕
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

// ── Mock Data Generator ──────────────────────────────────────────────────────

const MOCK_USERS_STATIC = [
  { id: '1', name: 'Julian Vance', email: 'j.vance@kineticvelocity.com', status: 'ACTIVE', role: 'Fleet Logistics Manager', lastActive: '2 mins ago' },
  { id: '2', name: 'Elena Sterling', email: 'e.sterling@partner.io', status: 'PENDING', role: 'Operations Analyst', lastActive: 'Invited 4h ago' },
  { id: '3', name: 'Marcus Thorne', email: 'm.thorne@kineticvelocity.com', status: 'OFFLINE', role: 'Maintenance Tech', lastActive: 'Yesterday, 14:22' },
  { id: '4', name: 'Sara Miller', email: 's.miller@archive.net', status: 'DEACTIVATED', role: 'Safety Auditor', lastActive: '6 months ago' },
  { id: '5', name: 'Leo Kross', email: 'l.kross@kineticvelocity.com', status: 'ACTIVE', role: 'System Architect', lastActive: 'Just now' },
];

const generateMockUsers = () => {
  const users = [...MOCK_USERS_STATIC];
  
  const firstNames = ['John', 'Jane', 'David', 'Emily', 'Michael', 'Sarah', 'Alex', 'Jessica', 'Robert', 'Ashley', 'William', 'Amanda', 'James', 'Megan', 'Daniel', 'Olivia', 'Charles', 'Patricia', 'Christopher', 'Linda'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  const roles = ['Fleet Logistics Manager', 'Operations Analyst', 'Maintenance Tech', 'Safety Auditor', 'System Architect', 'Delivery Partner', 'Merchant Partner', 'Individual Sender', 'Platform Admin', 'Customer Support'];
  const times = ['Just now', '10 mins ago', '1h ago', '3h ago', 'Invited 12h ago', 'Yesterday, 10:30', '2 days ago', '1 week ago', '3 weeks ago', '2 months ago'];

  // TARGET COUNTS (guarantees exact counts in screenshot totals):
  // ACTIVE: 124 (Julian Vance, Leo Kross are active) -> need 122 more
  // PENDING: 18 (Elena Sterling is pending) -> need 17 more
  // OFFLINE: 45 (Marcus Thorne is offline) -> need 44 more
  // DEACTIVATED: 8 (Sara Miller is deactivated) -> need 7 more
  
  const targetCounts = {
    ACTIVE: 122,
    PENDING: 17,
    OFFLINE: 44,
    DEACTIVATED: 7,
  };

  let idCounter = 6;

  const createRandomUser = (status: 'ACTIVE' | 'PENDING' | 'OFFLINE' | 'DEACTIVATED') => {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${idCounter}@kineticvelocity.com`;
    const role = roles[Math.floor(Math.random() * roles.length)];
    const lastActive = times[Math.floor(Math.random() * times.length)];
    
    idCounter++;
    return {
      id: String(idCounter - 1),
      name,
      email,
      status,
      role,
      lastActive,
    };
  };

  // Populate ACTIVE
  for (let i = 0; i < targetCounts.ACTIVE; i++) {
    users.push(createRandomUser('ACTIVE'));
  }
  // Populate PENDING
  for (let i = 0; i < targetCounts.PENDING; i++) {
    users.push(createRandomUser('PENDING'));
  }
  // Populate OFFLINE
  for (let i = 0; i < targetCounts.OFFLINE; i++) {
    users.push(createRandomUser('OFFLINE'));
  }
  // Populate DEACTIVATED
  for (let i = 0; i < targetCounts.DEACTIVATED; i++) {
    users.push(createRandomUser('DEACTIVATED'));
  }

  return users;
};

// ── Main Page Component ──────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Fleet Manager');
  const [invitePermissions, setInvitePermissions] = useState<string[]>([]);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const togglePermission = (perm: string) => {
    setInvitePermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setUsers(generateMockUsers());
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Compute overall statistics
  const totalActive = users.filter(u => u.status === 'ACTIVE').length;
  const totalPending = users.filter(u => u.status === 'PENDING').length;
  const totalOffline = users.filter(u => u.status === 'OFFLINE').length;
  const totalDeactivated = users.filter(u => u.status === 'DEACTIVATED').length;

  // Filter users by tab & search query
  const filteredUsers = users.filter(u => {
    // Status Filter
    if (selectedTab === 'ACTIVE' && u.status !== 'ACTIVE') return false;
    if (selectedTab === 'PENDING' && u.status !== 'PENDING') return false;
    if (selectedTab === 'OFFLINE' && u.status !== 'OFFLINE') return false;
    if (selectedTab === 'DEACTIVATED' && u.status !== 'DEACTIVATED') return false;

    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      const roleMatch = u.role?.toLowerCase().includes(q);
      return nameMatch || emailMatch || roleMatch;
    }

    return true;
  });

  // Paginate filtered results
  const itemsPerPage = 5;
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Actions handlers
  const handleSuspendUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'DEACTIVATED', lastActive: 'Suspended just now' } : u));
  };

  const handleActivateUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'ACTIVE', lastActive: 'Just now' } : u));
  };

  const handleApproveCourier = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'ACTIVE', lastActive: 'Approved just now' } : u));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(users, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'users_directory.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSending(true);
    setTimeout(() => {
      const newUser = {
        id: String(users.length + 1),
        name: inviteName,
        email: inviteEmail,
        status: 'PENDING',
        role: inviteRole,
        lastActive: 'Invited just now',
      };
      setUsers(prev => [newUser, ...prev]);
      setInviteSending(false);
      setInviteSent(true);
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteName('');
        setInviteEmail('');
        setInviteRole('Fleet Manager');
        setInvitePermissions([]);
        setInviteSent(false);
      }, 1200);
    }, 900);
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Fleet Manager');
    setInvitePermissions([]);
    setInviteSending(false);
    setInviteSent(false);
  };

  const tabs = [
    { id: 'ALL', label: 'All Users' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'OFFLINE', label: 'Offline' },
    { id: 'DEACTIVATED', label: 'Deactivated' },
  ];

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: any[] = [];
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }

    return (
      <div className="flex items-center gap-1.5 ml-auto">
        <button 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/20 transition-all",
            currentPage === 1 ? "opacity-30 cursor-not-allowed" : "text-white/60 hover:text-white"
          )}
        >
          <ChevronLeft size={15} />
        </button>
        
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-white/30 text-xs">
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${p}`}
              onClick={() => setCurrentPage(p)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150",
                currentPage === p
                  ? "bg-red-600 text-white font-bold"
                  : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white"
              )}
            >
              {p}
            </button>
          );
        })}

        <button 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/20 transition-all",
            currentPage === totalPages ? "opacity-30 cursor-not-allowed" : "text-white/60 hover:text-white"
          )}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120808] flex items-center justify-center">
        <div className="space-y-4 w-64 animate-pulse">
          <div className="h-8 bg-white/5 rounded-lg w-1/2 mx-auto" />
          <div className="h-20 bg-white/5 rounded-xl" />
          <div className="h-44 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#120808] text-white flex">
      {/* Sidebar Layout */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminMobileTopBar onSidebarToggle={() => setSidebarOpen(true)} />

      {/* Main Panel Content Area */}
      <div className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-w-0 flex flex-col">
        {/* Header Top Bar */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-white/10 bg-[#1a0505]/60 backdrop-blur-sm sticky top-0 z-20">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search resources..."
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

        {/* Content Area */}
        <div className="flex-1 px-4 lg:px-6 pb-12">
          {/* Title Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">User Management</h1>
              <p className="text-sm text-white/40 mt-1">Control access, roles, and system interaction permissions.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="h-10 px-4 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
              >
                <Download size={14} />
                Export Directory
              </button>
              <button
                onClick={() => setInviteModalOpen(true)}
                className="h-10 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
              >
                <UserPlus size={14} />
                Invite User
              </button>
            </div>
          </div>

          {/* Glowing Metrics Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Card 1: Active Users */}
            <div className="relative bg-[#1e0e0e] border border-emerald-500/20 rounded-xl p-5 overflow-hidden shadow-[0_0_15px_-3px_rgba(16,185,129,0.08)] hover:border-emerald-500/35 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-emerald-400 to-teal-500" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCheck size={16} />
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2 py-0.5">
                  +12% vs last mo
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">Active Users</p>
              <p className="font-display text-3xl font-bold text-white mt-1 leading-none">{totalActive}</p>
            </div>

            {/* Card 2: Pending Invitations */}
            <div className="relative bg-[#1e0e0e] border border-amber-500/20 rounded-xl p-5 overflow-hidden shadow-[0_0_15px_-3px_rgba(245,158,11,0.08)] hover:border-amber-500/35 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-amber-400 to-orange-500" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock size={16} />
                </div>
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-2 py-0.5">
                  Needs Review
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">Pending Invitations</p>
              <p className="font-display text-3xl font-bold text-white mt-1 leading-none">{totalPending}</p>
            </div>

            {/* Card 3: Offline Now */}
            <div className="relative bg-[#1e0e0e] border border-white/5 rounded-xl p-5 overflow-hidden shadow-[0_0_15px_-3px_rgba(255,255,255,0.02)] hover:border-white/15 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-neutral-500 to-neutral-600" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                  <WifiOff size={16} />
                </div>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">Offline Now</p>
              <p className="font-display text-3xl font-bold text-white mt-1 leading-none">{totalOffline}</p>
            </div>

            {/* Card 4: Deactivated */}
            <div className="relative bg-[#1e0e0e] border border-red-500/20 rounded-xl p-5 overflow-hidden shadow-[0_0_15px_-3px_rgba(239,68,68,0.08)] hover:border-red-500/35 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-red-500 to-red-600" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Ban size={16} />
                </div>
              </div>
              <p className="text-xs text-white/40 font-medium tracking-wide uppercase">Deactivated</p>
              <p className="font-display text-3xl font-bold text-white mt-1 leading-none">{totalDeactivated}</p>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="bg-[#1e0e0e] border border-white/10 rounded-xl mt-6 overflow-hidden">
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-white/10">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setSelectedTab(tab.id); setCurrentPage(1); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150",
                      selectedTab === tab.id
                        ? "bg-white/10 text-white font-bold"
                        : "text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#120808]/60 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Users Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/35 font-medium uppercase tracking-wider text-[11px] bg-white/[0.01]">
                    <th className="px-6 py-4 font-semibold">User</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Last Active</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* User Avatar + Profile */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-900/20 border border-red-500/20 flex items-center justify-center font-bold text-white/90 text-xs">
                          {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-white leading-tight">{u.name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{u.email}</p>
                        </div>
                      </td>

                      {/* Status Pills */}
                      <td className="px-6 py-4">
                        {u.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            ACTIVE
                          </span>
                        )}
                        {u.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            PENDING
                          </span>
                        )}
                        {u.status === 'OFFLINE' && (
                          <span className="inline-flex items-center gap-1 bg-white/5 text-white/40 border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            OFFLINE
                          </span>
                        )}
                        {u.status === 'DEACTIVATED' && (
                          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/25 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            DEACTIVATED
                          </span>
                        )}
                      </td>

                      {/* User Role */}
                      <td className="px-6 py-4 text-white/70 font-medium">
                        {u.role}
                      </td>

                      {/* Last Active Timestamp */}
                      <td className="px-6 py-4 text-white/40">
                        {u.lastActive}
                      </td>

                      {/* Ellipsis Menu */}
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                          className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {openMenuId === u.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-6 top-10 bg-[#1a0c0c] border border-white/10 rounded-xl py-1.5 w-44 shadow-2xl z-40 text-left animate-in fade-in slide-in-from-top-2 duration-100">
                              {u.status !== 'DEACTIVATED' ? (
                                <button
                                  onClick={() => { handleSuspendUser(u.id); setOpenMenuId(null); }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                                >
                                  <Ban size={13} />
                                  Suspend User
                                </button>
                              ) : (
                                <button
                                  onClick={() => { handleActivateUser(u.id); setOpenMenuId(null); }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                                >
                                  <UserCheck size={13} />
                                  Activate User
                                </button>
                              )}
                              {u.status === 'PENDING' && (
                                <button
                                  onClick={() => { handleApproveCourier(u.id); setOpenMenuId(null); }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                                >
                                  <UserCheck size={13} />
                                  Approve Courier
                                </button>
                              )}
                              <div className="border-t border-white/5 my-1" />
                              
                              <div className="px-3 py-1 text-[9px] text-white/30 font-bold uppercase tracking-wider">Change Role</div>
                              {['Fleet Logistics Manager', 'Operations Analyst', 'System Architect', 'Maintenance Tech', 'Safety Auditor', 'Delivery Partner', 'Individual Sender'].map(r => (
                                <button
                                  key={r}
                                  onClick={() => { handleChangeRole(u.id, r); setOpenMenuId(null); }}
                                  className={cn(
                                    "w-full px-3 py-1.5 text-xs font-semibold hover:bg-white/5 transition-colors text-white/60 text-left pl-5 relative",
                                    u.role === r && "text-white font-bold"
                                  )}
                                >
                                  {u.role === r && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-red-500" />}
                                  {r}
                                </button>
                              ))}
                              
                              <div className="border-t border-white/5 my-1" />
                              
                              <button
                                onClick={() => { handleDeleteUser(u.id); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-950/20 transition-colors flex items-center gap-2"
                              >
                                <Trash2 size={13} />
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-white/30">
                        <Shield size={20} className="mx-auto mb-2 text-white/10" />
                        <p className="text-xs font-medium">No users found matching your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.01]">
              <p className="text-xs text-white/35 font-medium">
                Showing {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} of {totalItems} users
              </p>
              {renderPagination()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Invite New User Modal ── */}
      {inviteModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-50 animate-in fade-in duration-200"
            onClick={closeInviteModal}
          />

          {/* Dialog */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[calc(100vw-2rem)] animate-in zoom-in-95 fade-in duration-200">
            <div className="bg-[#1c0d0d] border border-white/12 rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5">
                <h2 className="text-[15px] font-bold text-white tracking-tight">Invite New User</h2>
                <button
                  onClick={closeInviteModal}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleInviteSubmit}>
                <div className="px-6 space-y-5">

                  {/* Full Name */}
                  <div>
                    <label className="block text-[13px] font-semibold text-white/80 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full h-[42px] bg-[#120808]/80 border border-white/10 rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[13px] font-semibold text-white/80 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="j.doe@kineticvelocity.com"
                      className="w-full h-[42px] bg-[#120808]/80 border border-white/10 rounded-xl px-4 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                  </div>

                  {/* Assign Role */}
                  <div>
                    <label className="block text-[13px] font-semibold text-white/80 mb-2">Assign Role</label>
                    <div className="relative">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full h-[42px] bg-[#120808]/80 border border-white/10 rounded-xl px-4 pr-9 text-[13px] text-white outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Fleet Manager" className="bg-[#1c0d0d]">Fleet Manager</option>
                        <option value="Operations Analyst" className="bg-[#1c0d0d]">Operations Analyst</option>
                        <option value="Fleet Logistics Manager" className="bg-[#1c0d0d]">Fleet Logistics Manager</option>
                        <option value="Maintenance Tech" className="bg-[#1c0d0d]">Maintenance Tech</option>
                        <option value="Safety Auditor" className="bg-[#1c0d0d]">Safety Auditor</option>
                        <option value="System Architect" className="bg-[#1c0d0d]">System Architect</option>
                        <option value="Customer Support" className="bg-[#1c0d0d]">Customer Support</option>
                      </select>
                      {/* chevron icon */}
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/35" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-[13px] font-semibold text-white/80 mb-3">Permissions</label>
                    <div className="space-y-3">
                      {[
                        { id: 'analytics', label: 'View Analytics' },
                        { id: 'fleet',     label: 'Manage Fleet' },
                        { id: 'users',     label: 'Edit Users' },
                      ].map(({ id, label }) => {
                        const checked = invitePermissions.includes(id);
                        return (
                          <label key={id} className="flex items-center gap-3 cursor-pointer group">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={checked}
                              onClick={() => togglePermission(id)}
                              className={cn(
                                'w-[18px] h-[18px] rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all',
                                checked
                                  ? 'bg-red-600 border-red-600'
                                  : 'bg-transparent border-white/25 group-hover:border-white/45',
                              )}
                            >
                              {checked && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <span className={cn(
                              'text-[13px] transition-colors',
                              checked ? 'text-white font-medium' : 'text-white/60 group-hover:text-white/80',
                            )}>
                              {label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-5 mt-4 border-t border-white/8">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  >
                  Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSending || inviteSent}
                    className={cn(
                      'h-10 px-6 rounded-xl text-[13px] font-bold text-white transition-all flex items-center gap-2 shadow-lg',
                      inviteSent
                        ? 'bg-green-600 shadow-green-900/30'
                        : 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-900/30 disabled:opacity-60',
                    )}
                  >
                    {inviteSending && (
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    {inviteSent ? '✓ Invitation Sent!' : inviteSending ? 'Sending…' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

