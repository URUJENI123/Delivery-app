'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/Toggle';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import {
  User, Bell, Shield, Globe, ChevronRight, LogOut, Lock, KeyRound,
  Eye, EyeOff, X, AlertTriangle,
} from 'lucide-react';

const settingSections = [
  {
    id: 'account',
    label: 'Account',
    icon: User,
    items: [
      { label: 'Personal Information', href: '/profile' },
      { label: 'Change Password', action: 'password' },
      { label: 'Delete Account', action: 'delete', danger: true },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    items: [
      { label: 'Push Notifications', toggle: true, defaultValue: true },
      { label: 'SMS Alerts', toggle: true, defaultValue: false },
      { label: 'Email Summary', toggle: true, defaultValue: true },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    icon: Shield,
    items: [
      { label: 'Two-Factor Authentication', toggle: true, defaultValue: false },
      { label: 'Show Online Status', toggle: true, defaultValue: true },
      { label: 'Share Location with Couriers', toggle: true, defaultValue: true },
    ],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Globe,
    items: [
      { label: 'Language', value: 'English' },
      { label: 'Currency', value: 'RWF' },
      { label: 'Distance Unit', value: 'Kilometers' },
    ],
  },
];

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password/update', { newPassword });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-gray-950/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-950">Change Password</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <Check size={28} className="text-success" />
            </div>
            <p className="text-sm font-semibold text-gray-950">Password Updated</p>
            <p className="text-xs text-gray-400 mt-1">Your password has been changed successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-gray-400">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />
            <Input
              label="New Password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              leftIcon={<KeyRound size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowNew(!showNew)} className="text-gray-400">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />
            <Input
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              leftIcon={<KeyRound size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />

            {error && (
              <div className="flex items-center gap-2 text-danger text-xs font-medium bg-danger/5 px-3 py-2 rounded-lg">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Check({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Push Notifications': true,
    'SMS Alerts': false,
    'Email Summary': true,
    'Two-Factor Authentication': false,
    'Show Online Status': true,
    'Share Location with Couriers': true,
  });
  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleToggle = (label: string) => {
    setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-bg-page pb-10">
      <AnimatedHero title="Settings" subtitle="Manage your account preferences" fullBleed />

      <div className="-mx-4 md:-mx-6 px-4 md:px-6 -mt-8 relative z-10">
        {/* User Card */}
        <Card className="p-5 mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0 overflow-hidden">
              {user?.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-h4 font-bold text-gray-950">{user?.fullName || 'User'}</p>
              <p className="text-body-sm text-gray-500">{user?.email || user?.phone || 'No contact info'}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
          </button>
        </Card>

        {/* Setting Sections */}
        {settingSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.id} className="mb-8">
              <div className="flex items-center gap-2 mb-3 px-1">
                <SectionIcon size={16} className="text-gray-400" />
                <h2 className="text-[11px] font-bold text-gray-400 tracking-[0.08em] uppercase">{section.label}</h2>
              </div>
              <Card className="divide-y divide-gray-100 overflow-hidden">
                {section.items.map((item: any) => {
                  if (item.action === 'password') {
                    return (
                      <button
                        key={item.label}
                        onClick={() => setPasswordModal(true)}
                        className="flex items-center justify-between w-full px-5 py-3.5 min-h-[52px] hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-950">{item.label}</span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </button>
                    );
                  }
                  if (item.action === 'delete') {
                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => setDeleteConfirm(true)}
                          className="flex items-center justify-between w-full px-5 py-3.5 min-h-[52px] hover:bg-red-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-danger">{item.label}</span>
                          <ChevronRight size={16} className="text-gray-300" />
                        </button>
                        {deleteConfirm && (
                          <div className="px-5 py-4 bg-danger/5 border-t border-danger/10 space-y-3">
                            <p className="text-xs text-danger font-medium flex items-center gap-1.5">
                              <AlertTriangle size={14} />
                              This action cannot be undone. All your data will be permanently removed.
                            </p>
                            <div className="flex gap-2">
                              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(false)}>
                                Cancel
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => { setDeleteConfirm(false); alert('Account deletion is not yet implemented.'); }}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (item.href) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => router.push(item.href)}
                        className="flex items-center justify-between w-full px-5 py-3.5 min-h-[52px] hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-950">{item.label}</span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </button>
                    );
                  }
                  return (
                    <div key={item.label} className="flex items-center justify-between px-5 py-3.5 min-h-[52px]">
                      <span className={cn('text-sm font-medium', item.danger ? 'text-danger' : 'text-gray-950')}>
                        {item.label}
                      </span>
                      {item.toggle !== undefined ? (
                        <Toggle
                          checked={toggles[item.label] ?? item.defaultValue}
                          onChange={() => handleToggle(item.label)}
                        />
                      ) : item.value ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{item.value}</span>
                          <ChevronRight size={16} className="text-gray-300" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </Card>
            </div>
          );
        })}

        {/* Logout */}
        <div className="pt-2">
          <Button variant="secondary" className="w-full !h-12" onClick={handleLogout}>
            <LogOut size={18} />
            Log Out
          </Button>
        </div>
      </div>

      {/* Password Modal */}
      {passwordModal && <PasswordModal onClose={() => setPasswordModal(false)} />}
    </div>
  );
}
