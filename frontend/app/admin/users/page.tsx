'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/admin/users').then((res) => {
      setUsers(Array.isArray(res) ? res : res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-72" /></div>;

  return (
    <div>
      <AnimatedHero title="Users" subtitle={`${users.length} registered`} fullBleed />

      <div className="px-4 md:px-6">
        <div className="flex justify-end mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className="input-base !w-64 !pl-9 !h-10 text-sm" placeholder="Search users..." />
          </div>
        </div>

        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Name</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Phone</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Role</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Status</th>
                  <th className="text-left px-5 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-neutral-900">{u.fullName || 'Unnamed'}</td>
                    <td className="px-5 py-4 text-neutral-500">{u.phone}</td>
                    <td className="px-5 py-4">
                      <Badge color={u.role === 'ADMIN' ? 'red' : u.role === 'COURIER' ? 'green' : 'default'}>
                        {u.role || 'SENDER'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {u.isActive !== false ? (
                        <span className="flex items-center gap-1.5 text-success font-semibold"><UserCheck size={14} /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-danger font-semibold"><UserX size={14} /> Inactive</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-neutral-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-neutral-400">
                      <Shield size={24} className="mx-auto mb-2" />
                      <p>No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
