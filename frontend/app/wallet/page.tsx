'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DoubleDeckHeader } from '@/components/ui/DoubleDeckHeader';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import { ArrowDownLeft, ArrowUpRight, Clock, Wallet } from 'lucide-react';
import { useWalletStore } from '@/stores/wallet';

export default function WalletPage() {
  const router = useRouter();
  const { balance, transactions, loading, fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <div className="min-h-screen bg-bg-page">
      <AnimatedHero title="Wallet" subtitle="Manage your balance and transactions" fullBleed />
      <DoubleDeckHeader prefix="Your current" title="Balance" className="px-4 pt-4 pb-3 lg:px-6 lg:pt-5" />

      <div className="px-4 pb-4 lg:px-6 lg:pb-6 space-y-4">
        <div className="bg-bg-card border border-gray-200 rounded-xl p-6">
          <p className="font-body text-xs text-gray-400">Current Balance</p>
          <p className="font-display text-[32px] font-bold text-gray-950 mt-1">
            {loading ? <span className="inline-block w-40 h-9 bg-gray-150 rounded-md relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%] align-middle" /> : `RWF ${(balance || 0).toLocaleString()}`}
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="primary" className="!h-11 !px-6">
              <ArrowDownLeft className="w-4 h-4" />
              Top Up
            </Button>
            <Button variant="outline-red" className="!h-11 !px-6">
              <ArrowUpRight className="w-4 h-4" />
              Request Payout
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: 'Top Up', icon: ArrowDownLeft },
            { label: 'Send Money', icon: ArrowUpRight },
            { label: 'History', icon: Clock },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="inline-flex items-center gap-2 h-11 px-4 bg-gray-100 border border-gray-200 rounded-full font-body text-sm font-medium text-gray-700 hover:bg-red-100 hover:text-red-600 hover:border-red-600 transition-colors flex-shrink-0"
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>

        <DoubleDeckHeader prefix="Recent" title="Transactions" />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[68px] bg-gray-150 rounded-lg relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer after:bg-[length:200%_100%]" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <Wallet className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-display text-base font-semibold text-gray-950">No transactions yet</p>
            <p className="font-body text-sm text-gray-400 mt-2 max-w-[240px]">
              Complete a delivery to see transactions here
            </p>
          </div>
        ) : (
          <div className="bg-bg-card border border-gray-200 rounded-xl overflow-hidden">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 h-[68px] px-4 border-b border-gray-150 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'credit' ? 'bg-success-bg' : 'bg-danger-bg'
                  }`}
                >
                  {tx.type === 'credit' ? (
                    <ArrowDownLeft className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-danger" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-gray-950 truncate">{tx.description}</p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : tx.date || ''}</p>
                </div>
                <span
                  className={`font-display text-sm font-bold flex-shrink-0 ${
                    tx.type === 'credit' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {tx.type === 'credit' ? '+' : '-'}RWF {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <button className="font-body text-sm text-red-600 hover:underline">
            View all transactions
          </button>
        </div>
      </div>
    </div>
  );
}
