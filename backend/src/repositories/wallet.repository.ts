import prisma from '../lib/prisma';
import { WalletTransactionType } from '@prisma/client';

export function findByUser(userId: string) {
  return prisma.wallet.findUnique({
    where:   { userId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      withdrawals:  { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
}

export function create(userId: string) {
  return prisma.wallet.create({
    data:    { userId, balance: 0 },
    include: { transactions: true, withdrawals: true },
  });
}

export async function upsert(userId: string) {
  return prisma.wallet.upsert({
    where:  { userId },
    create: { userId, balance: 0 },
    update: {},
  });
}

export function increment(id: string, amount: number) {
  return prisma.wallet.update({
    where: { id },
    data:  { balance: { increment: amount } },
  });
}

export function decrement(id: string, amount: number) {
  return prisma.wallet.update({
    where: { id },
    data:  { balance: { decrement: amount } },
  });
}

export function createTransaction(data: {
  walletId:      string;
  type:          WalletTransactionType;
  description:   string;
  amount:        number;
  referenceType?: string;
  referenceId?:   string;
}) {
  return prisma.walletTransaction.create({ data });
}

export function createWithdrawal(data: {
  walletId:       string;
  userId:         string;
  amount:         number;
  method:         string;
  provider?:      string | null;
  accountNumber?: string | null;
}) {
  return prisma.withdrawalRequest.create({
    data: { ...data, status: 'pending' },
  });
}
