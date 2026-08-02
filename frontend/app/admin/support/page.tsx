'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import {
  LayoutDashboard, Bike, Package, Users, Shield, BarChart2,
  Settings, HelpCircle, LogOut, ChevronRight, Bell, Menu,
  Phone, MoreVertical, Search, Archive, Plus, Send,
  Clock, Star, CheckCircle, CreditCard, Truck, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
          <button onClick={onClose} className="lg:hidden ml-auto p-1 text-white/40 hover:text-white">?</button>
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
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn(
                  'flex items-center h-10 px-3 rounded-md transition-all duration-150',
                  active ? 'bg-black/25 text-white font-semibold border-l-4 border-red-500'
                    : 'text-white/45 hover:bg-white/8 hover:text-white',
                )}>
                <Icon size={17} className={cn('mr-3 flex-shrink-0', active ? 'text-red-400' : 'text-white/35')} />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={async () => { await logout(); router.push('/admin/auth'); }}
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

function AdminMobileTopBar({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#1a0505] border-b border-white/10 flex items-center px-4 gap-3">
      <button onClick={onSidebarToggle} className="p-1.5 text-white/60 hover:text-white -ml-1">
        <Menu size={21} />
      </button>
      <img src="/logo.png" alt="Delivery" className="h-11 w-auto object-contain" />
      <div className="ml-auto flex items-center gap-2">
        <button className="relative p-1.5 text-white/50 hover:text-white">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

type TicketTag = 'URGENT' | 'TECH' | 'BILLING';

interface Ticket {
  id: string;
  tag: TicketTag;
  title: string;
  preview: string;
  from: string;
  fromRole: string;
  timeAgo: string;
}

const TICKETS: Ticket[] = [
  { id: 'KE-8891', tag: 'URGENT', title: 'Order #KE-8891 Delayed', preview: 'Courier stuck in heavy rain near...', from: 'Jean Claude', fromRole: 'Customer', timeAgo: '2m ago' },
  { id: 'KE-8892', tag: 'TECH', title: 'App Login Failure', preview: 'Courier app crashing on Android 14...', from: 'Musa K.', fromRole: 'Courier', timeAgo: '15m ago' },
  { id: 'KE-8893', tag: 'BILLING', title: 'Double Charge Dispute', preview: 'Customer reports two charges for the same...', from: 'Aline U.', fromRole: 'Customer', timeAgo: '1h ago' },
];

const TAG_STYLES: Record<TicketTag, string> = {
  URGENT: 'bg-red-600 text-white',
  TECH: 'bg-blue-600 text-white',
  BILLING: 'bg-amber-500 text-[#1a0505]',
};

interface ChatMsg { id: number; sender: 'user' | 'admin' | 'system'; text: string; }

const INITIAL_MESSAGES: ChatMsg[] = [
  { id: 1, sender: 'system', text: 'SUPPORT SESSION STARTED - 14:02' },
  { id: 2, sender: 'user', text: 'Hello, my order #KE-8891 was supposed to be here 20 minutes ago. The app says the courier is still at the hub?' },
  { id: 3, sender: 'system', text: 'System Alert: Courier assigned (Innocent N.) is experiencing GPS signal loss near Nyamirambo sector.' },
  { id: 4, sender: 'admin', text: "Hi Jean Claude, I'm looking into this right now. There's currently heavy rain in that area, which might be causing the delay and GPS interference. I'm contacting the courier directly." },
  { id: 5, sender: 'user', text: 'Thanks, I appreciate the quick reply. I need those items for a meeting starting in 15 mins.' },
];

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-[#1e0e0e] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-[11px] text-white/35 mb-0.5">{label}</p>
        <p className="text-[16px] font-bold text-white">{value}</p>
      </div>
      <Icon size={18} className="text-white/20 flex-shrink-0" />
    </div>
  );
}

function AdminToolBtn({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <button className={cn(
      'w-full flex items-center justify-between h-11 px-4 rounded-xl border text-[13px] font-semibold transition-all',
      active
        ? 'bg-red-600/20 border-red-600/40 text-white'
        : 'bg-[#1e0e0e] border-white/10 text-white/50 hover:text-white hover:border-white/20',
    )}>
      <span>{label}</span>
      <Icon size={16} className={active ? 'text-red-400' : 'text-white/30'} />
    </button>
  );
}

export default function AdminSupportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState('KE-8891');
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');

  const activeTicket = TICKETS.find((t) => t.id === activeTicketId)!;

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'admin', text }]);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="min-h-screen bg-[#120808] text-white flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminMobileTopBar onSidebarToggle={() => setSidebarOpen(true)} />

      <div className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-w-0 flex flex-col">

        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-white/10 bg-[#1a0505]/60 backdrop-blur-sm sticky top-0 z-20 flex-shrink-0">
          <div>
            <h1 className="font-display text-lg font-bold text-white">Help &amp; Support</h1>
            <p className="text-[12px] text-white/35">Manage tickets and customer conversations</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-9 px-4 text-[12px] font-semibold text-white bg-red-600/20 border border-red-600/40 rounded-lg">
              <Search size={12} /> Support Inbox
            </button>
            <button className="flex items-center gap-1.5 h-9 px-4 text-[12px] text-white/45 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors">
              <Archive size={12} /> Archive
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-700 to-red-900 border-2 border-red-600/60 flex items-center justify-center text-white text-[13px] font-bold">AD</div>
          </div>
        </div>

        {/* Body: three columns */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: Stats + Tools + Network */}
          <aside className="hidden xl:flex flex-col w-[256px] flex-shrink-0 border-r border-white/10 bg-[#1a0808] overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">My Stats</p>
              <div className="space-y-2">
                <StatCard icon={Clock} label="Avg. Response" value="1m 42s" />
                <StatCard icon={Star} label="CSAT Score" value="4.8/5.0" />
                <StatCard icon={CheckCircle} label="Resolved Today" value="24" />
              </div>
            </div>
            <div className="p-4 border-b border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Admin Tools</p>
              <div className="space-y-2">
                <AdminToolBtn icon={CreditCard} label="Process Refund" active />
                <AdminToolBtn icon={Truck} label="Courier Status" />
                <AdminToolBtn icon={ShieldAlert} label="Fraud Check" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Network Status</p>
              <div className="bg-[#1e0e0e] border border-white/10 rounded-xl p-3 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.45)] flex-shrink-0" />
                <span className="text-[13px] font-semibold text-white">Kigali Central Node - Active</span>
              </div>
            </div>
          </aside>

          {/* MIDDLE: Ticket List */}
          <div className="w-full sm:w-[280px] lg:w-[300px] flex-shrink-0 border-r border-white/10 bg-[#160a0a] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-white">Tickets</h2>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">12 New</span>
              </div>
              <button className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <Plus size={15} />
              </button>
            </div>
            <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" placeholder="Search tickets..."
                  className="w-full h-8 bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 text-[12px] text-white/70 placeholder:text-white/25 outline-none focus:border-red-500/50 transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {TICKETS.map((ticket) => (
                <button key={ticket.id} onClick={() => setActiveTicketId(ticket.id)}
                  className={cn(
                    'w-full text-left px-4 py-4 transition-colors hover:bg-white/5',
                    activeTicketId === ticket.id && 'bg-white/5 border-l-2 border-red-500',
                  )}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', TAG_STYLES[ticket.tag])}>
                      {ticket.tag}
                    </span>
                    <span className="text-[10px] text-white/30">{ticket.timeAgo}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-white mb-1">{ticket.title}</p>
                  <p className="text-[11px] text-white/40 truncate mb-2">{ticket.preview}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center">
                      <Users size={9} className="text-white/50" />
                    </div>
                    <span className="text-[11px] text-white/40">{ticket.from} ({ticket.fromRole})</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Chat */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#130808]">

            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0 bg-[#1a0a0a]">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-700 to-red-900 border border-red-600/50 flex items-center justify-center text-white text-sm font-bold">
                    JC
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1a0a0a]" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-white">{activeTicket.from}</p>
                  <p className="text-[11px] text-white/35">Customer since 2022 &bull; Gold Tier</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Phone size={16} /></button>
                <button className="p-2 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><MoreVertical size={16} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {messages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">{msg.text}</span>
                    </div>
                  );
                }
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="max-w-[75%] bg-[#1e0e0e] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-[13px] text-white/85 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[75%] bg-gradient-to-br from-red-700/80 to-red-900/80 border border-red-600/30 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-[13px] text-white leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-start">
                <div className="bg-[#1e0e0e] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-white/10 flex-shrink-0 bg-[#1a0a0a]">
              <div className="flex items-center gap-3 bg-[#1e0e0e] border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-red-500/50 transition-colors">
                <button className="p-1 text-white/25 hover:text-red-400 transition-colors flex-shrink-0"><Plus size={18} /></button>
                <input
                  type="text"
                  placeholder="Type your response..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/25 outline-none"
                />
                <button onClick={sendMessage} disabled={!draft.trim()}
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                    draft.trim() ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30' : 'bg-white/5 text-white/20 cursor-not-allowed',
                  )}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
