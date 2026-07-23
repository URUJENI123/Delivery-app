'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { User, Phone, Mail, Camera, Check, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, fetchProfile, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${ext}`;
      const { uploadUrl, publicUrl } = await api.post<any>('/storage/presigned-url', {
        fileName,
        contentType: file.type,
        folder: 'avatars',
      });
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      await api.post('/users/me/photo', { photoUrl: publicUrl });
      await fetchProfile();
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/me', { fullName: fullName || undefined });
      await fetchProfile();
      setEditing(false);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-bg-page pb-10">
      <AnimatedHero title="Profile" subtitle="Manage your personal information" fullBleed />

      <div className="px-4 lg:px-6 max-w-2xl mx-auto -mt-16 relative z-10">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="group relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-xl"
            >
              {user.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-display font-bold text-4xl">
                  {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Camera size={28} className="text-white" />
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-center text-xs text-gray-400 mt-2">Tap to change photo</p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-150">
            <h2 className="text-sm font-bold text-gray-500 tracking-wide uppercase">Personal Information</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-btn-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancel} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-1.5 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                >
                  {saving ? <div className="w-4 h-4 bg-gray-300 rounded-sm relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" /> : <Check size={18} />}
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-150">
            {/* Full Name */}
            <div className="flex items-center gap-4 px-5 py-4">
              <User size={20} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Full Name</p>
                {editing ? (
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="!h-10 !px-3 !mt-1"
                    placeholder="Your full name"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-950 mt-0.5 truncate">{user.fullName || 'Not set'}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 px-5 py-4">
              <Mail size={20} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Email</p>
                <p className="text-sm font-medium text-gray-950 mt-0.5 truncate">{user.email || 'Not set'}</p>
              </div>
              {user.emailVerified && (
                <span className="text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">Verified</span>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4 px-5 py-4">
              <Phone size={20} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Phone</p>
                <p className="text-sm font-medium text-gray-950 mt-0.5 truncate">{user.phone || 'Not set'}</p>
              </div>
              {user.phoneVerified && (
                <span className="text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">Verified</span>
              )}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <p className="text-xs font-bold text-gray-500 tracking-wide uppercase px-5 pt-4 pb-2">Account</p>
          <div className="divide-y divide-gray-150">
            <button className="flex items-center gap-4 w-full px-5 py-4 hover:bg-red-50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-950">Email Address</p>
                <p className="text-xs text-gray-400 mt-0.5">{user.email || 'Not set'}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
            <button className="flex items-center gap-4 w-full px-5 py-4 hover:bg-red-50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-950">Phone Number</p>
                <p className="text-xs text-gray-400 mt-0.5">{user.phone || 'Not set'}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
            <button className="flex items-center gap-4 w-full px-5 py-4 hover:bg-red-50 transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-950">Role</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={async () => { await logout(); router.push('/login'); }}
          className="flex items-center justify-center gap-2 w-full h-12 bg-white border border-gray-200 rounded-xl text-danger font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          <X size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}
