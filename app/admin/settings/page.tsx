'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import {
  Search, Bell, HelpCircle, LogOut, LayoutDashboard, Bike, Package,
  Users, Shield, BarChart2, Settings, ChevronRight, Save,
  Globe, Mail, Phone, MapPin, Clock, DollarSign, Sliders,
  ToggleLeft, ToggleRight, AlertTriangle, Check, X, Key,
  Eye, EyeOff, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Shared Navigation Layout Constants ───────────────────────────────────────

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
              className={cn(
                'flex items-center h-10 px-3 rounded-md transition-all duration-150',
                isActive(item.href)
                  ? 'bg-black/25 text-white font-semibold border-l-4 border-red-500'
                  : 'text-white/45 hover:bg-white/8 hover:text-white',
              )}
            >
              <Icon size={17} className={cn('mr-3 flex-shrink-0', isActive(item.href) ? 'text-red-400' : 'text-white/35')} />
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

// ── Settings Section Component ───────────────────────────────────────────────

interface SettingToggle {
  label: string;
  description?: string;
  default: boolean;
}

interface SettingField {
  label: string;
  type: 'text' | 'number' | 'select';
  value: string;
  placeholder?: string;
  options?: string[];
  suffix?: string;
}

interface SettingsSectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsSection({ icon: Icon, title, description, children }: SettingsSectionProps) {
  return (
    <div className="bg-[#1e0e0e] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="text-[11px] text-white/35">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-[13px] font-medium text-white">{label}</p>
        {description && <p className="text-[11px] text-white/30 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={cn(
          'relative inline-flex h-[26px] w-[48px] rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-red-600' : 'bg-white/10',
        )}
      >
        <span className={cn(
          'inline-block h-[22px] w-[22px] rounded-full bg-white transition-transform duration-200 mt-[2px]',
          checked ? 'translate-x-[24px]' : 'translate-x-[2px]',
        )} />
      </button>
    </div>
  );
}

function FieldRow({ label, value, onChange, type = 'text', placeholder, options, suffix }: SettingField & { onChange?: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 gap-4">
      <p className="text-[13px] font-medium text-white flex-shrink-0">{label}</p>
      <div className="flex items-center gap-2">
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-9 bg-[#120808] border border-white/10 rounded-lg px-3 text-[12px] text-white/80 outline-none focus:border-red-500/50 transition-colors appearance-none cursor-pointer min-w-[120px]"
          >
            {options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <div className="flex items-center">
            <input
              type={type}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              className="h-9 w-[140px] bg-[#120808] border border-white/10 rounded-lg px-3 text-[12px] text-white/80 outline-none focus:border-red-500/50 transition-colors placeholder:text-white/20"
            />
            {suffix && <span className="ml-2 text-[11px] text-white/30">{suffix}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // Platform settings
  const [platformName, setPlatformName] = useState('Delivery');
  const [supportEmail, setSupportEmail] = useState('support@delivery.rw');
  const [supportPhone, setSupportPhone] = useState('+250 788 000 000');
  const [defaultCurrency, setDefaultCurrency] = useState('RWF');

  // Notification settings
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    smsEnabled: true,
    emailEnabled: false,
    courierUpdates: true,
    adminAlerts: true,
    disputeAlerts: true,
  });

  // Delivery settings
  const [broadcastRadius, setBroadcastRadius] = useState('300');
  const [serviceFee, setServiceFee] = useState('100');
  const [otpExpiry, setOtpExpiry] = useState('5');
  const [maxRetries, setMaxRetries] = useState('3');

  // Security settings
  const [security, setSecurity] = useState({
    require2fa: false,
    sessionTimeout: true,
    ipWhitelist: false,
    auditLog: true,
  });
  const [sessionMinutes, setSessionMinutes] = useState('60');

  // Payout settings
  const [minWithdrawal, setMinWithdrawal] = useState('1000');
  const [payoutSchedule, setPayoutSchedule] = useState('Daily');
  const [autoPayout, setAutoPayout] = useState(true);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSecurity = (key: keyof typeof security) => {
    setSecurity((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#120808] text-white flex">
      {/* Sidebar Layout */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminMobileTopBar onSidebarToggle={() => setSidebarOpen(true)} />

      {/* Main Content Pane */}
      <div className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-white/10 bg-[#1a0505]/60 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h1 className="font-display text-lg font-bold text-white">Settings</h1>
            <p className="text-[12px] text-white/35">Configure platform-wide preferences and policies</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className={cn(
                'h-9 px-5 text-[13px] font-semibold rounded-lg transition-all flex items-center gap-2',
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white',
              )}
            >
              {saved ? <Check size={15} /> : <Save size={15} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 px-4 lg:px-6 pb-12">
          {/* Mobile Title & Save */}
          <div className="flex items-center justify-between mt-6 mb-6 lg:hidden">
            <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
            <button
              onClick={handleSave}
              className={cn(
                'h-9 px-4 text-[12px] font-semibold rounded-lg transition-all flex items-center gap-2',
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white',
              )}
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>

          <div className="space-y-6">
            {/* ── Platform Settings ── */}
            <SettingsSection icon={Globe} title="Platform" description="Basic platform identity and contact info">
              <FieldRow label="Platform Name" value={platformName} onChange={setPlatformName} placeholder="Delivery" type="text" />
              <FieldRow label="Support Email" value={supportEmail} onChange={setSupportEmail} placeholder="support@delivery.rw" type="text" />
              <FieldRow label="Support Phone" value={supportPhone} onChange={setSupportPhone} placeholder="+250 788 000 000" type="text" />
              <FieldRow label="Currency" value={defaultCurrency} onChange={setDefaultCurrency} type="select" options={['RWF', 'USD', 'KES', 'UGX']} />
            </SettingsSection>

            {/* ── Notification Settings ── */}
            <SettingsSection icon={Bell} title="Notifications" description="Control how notifications are sent across the platform">
              <ToggleRow label="Push Notifications" description="Enable push notifications for all users" checked={notifications.pushEnabled} onChange={() => toggleNotification('pushEnabled')} />
              <ToggleRow label="SMS Alerts" description="Send SMS for critical delivery events" checked={notifications.smsEnabled} onChange={() => toggleNotification('smsEnabled')} />
              <ToggleRow label="Email Notifications" description="Send email digests and alerts" checked={notifications.emailEnabled} onChange={() => toggleNotification('emailEnabled')} />
              <ToggleRow label="Courier Status Updates" description="Notify admins when couriers go online/offline" checked={notifications.courierUpdates} onChange={() => toggleNotification('courierUpdates')} />
              <ToggleRow label="Admin Alerts" description="System alerts for admins (low balance, errors)" checked={notifications.adminAlerts} onChange={() => toggleNotification('adminAlerts')} />
              <ToggleRow label="Dispute Alerts" description="Immediate notification on new disputes" checked={notifications.disputeAlerts} onChange={() => toggleNotification('disputeAlerts')} />
            </SettingsSection>

            {/* ── Delivery Settings ── */}
            <SettingsSection icon={Sliders} title="Delivery" description="Core delivery behavior and constraints">
              <FieldRow label="Broadcast Radius" value={broadcastRadius} onChange={setBroadcastRadius} type="number" suffix="meters" />
              <FieldRow label="Service Fee" value={serviceFee} onChange={setServiceFee} type="number" suffix="RWF" />
              <FieldRow label="OTP Expiry" value={otpExpiry} onChange={setOtpExpiry} type="number" suffix="minutes" />
              <FieldRow label="Max OTP Retries" value={maxRetries} onChange={setMaxRetries} type="number" />
            </SettingsSection>

            {/* ── Security Settings ── */}
            <SettingsSection icon={Shield} title="Security" description="Authentication and access control policies">
              <ToggleRow label="Require Two-Factor Auth" description="Enforce 2FA for all admin accounts" checked={security.require2fa} onChange={() => toggleSecurity('require2fa')} />
              <ToggleRow label="Session Timeout" description="Auto-logout after inactivity" checked={security.sessionTimeout} onChange={() => toggleSecurity('sessionTimeout')} />
              {security.sessionTimeout && (
                <FieldRow label="Timeout Duration" value={sessionMinutes} onChange={setSessionMinutes} type="number" suffix="minutes" />
              )}
              <ToggleRow label="IP Whitelist" description="Restrict admin access to approved IPs" checked={security.ipWhitelist} onChange={() => toggleSecurity('ipWhitelist')} />
              <ToggleRow label="Audit Logging" description="Log all admin actions for compliance" checked={security.auditLog} onChange={() => toggleSecurity('auditLog')} />
            </SettingsSection>

            {/* ── Payout Settings ── */}
            <SettingsSection icon={DollarSign} title="Payouts" description="Courier withdrawal and payout configuration">
              <FieldRow label="Minimum Withdrawal" value={minWithdrawal} onChange={setMinWithdrawal} type="number" suffix="RWF" />
              <FieldRow label="Payout Schedule" value={payoutSchedule} onChange={setPayoutSchedule} type="select" options={['Daily', 'Weekly', 'Bi-Weekly', 'Monthly']} />
              <ToggleRow label="Auto-Payout" description="Automatically process payouts on schedule" checked={autoPayout} onChange={() => setAutoPayout(!autoPayout)} />
            </SettingsSection>
          </div>
        </div>
      </div>

      {/* Saved Toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-green-600/20">
            <Check size={18} />
            <span className="text-[13px] font-semibold">Settings saved successfully</span>
          </div>
        </div>
      )}
    </div>
  );
}
