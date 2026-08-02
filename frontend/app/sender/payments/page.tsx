'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { useWalletStore } from '@/stores/wallet';
import { useAuthStore } from '@/stores/auth';
import { CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const { balance, transactions, fetchWallet } = useWalletStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchWallet().finally(() => setLoading(false));
  }, [user, fetchWallet]);

  const statusIcons: Record<string, any> = { credit: CheckCircle, debit: XCircle, fee: Clock, withdrawal: Clock };
  const statusColors: Record<string, string> = { credit: 'text-success', debit: 'text-danger', fee: 'text-warning', withdrawal: 'text-warning' };

  return (
    <div className="space-y-8">
      <AnimatedHero title="Payments" subtitle="Your wallet and transaction history" fullBleed />

      <div className="px-4 md:px-6 space-y-6">
        <div className="bg-bg-card border border-gray-200 rounded-xl p-5">
          <p className="font-body text-xs text-gray-400">Wallet Balance</p>
          <p className="font-display text-[36px] font-bold text-red-600 mt-1">
            RWF {(balance || 0).toLocaleString()}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-4">Transaction History</h2>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-bg-card border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-150 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                      <div className="h-3 w-1/2 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                    </div>
                    <div className="h-5 w-20 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
                  </div>
                </div>
              ))}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={24} className="text-gray-400" />
                </div>
                <h3 className="font-display text-lg font-bold mb-1">No transactions yet</h3>
                <p className="text-gray-500 text-body-sm">Your wallet transactions will appear here.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((t: any) => {
                const StatusIcon = statusIcons[t.type] || Clock;
                return (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        t.type === 'credit' ? 'bg-success-bg' : 'bg-danger-bg'
                      }`}>
                        <StatusIcon size={18} className={statusColors[t.type] || 'text-gray-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-body-sm text-gray-950 truncate">{t.description || t.type}</p>
                          <span className={`font-display text-h4 font-bold flex-shrink-0 ml-2 ${
                            t.type === 'credit' ? 'text-success' : 'text-danger'
                          }`}>
                            {t.type === 'credit' ? '+' : '-'}RWF {Math.abs(t.amount || 0).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-tiny text-gray-500 mt-0.5">
                          {t.createdAt ? new Date(t.createdAt).toLocaleString() : t.created_at ? new Date(t.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
