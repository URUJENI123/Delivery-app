import * as walletRepo from '../repositories/wallet.repository';
import { NotFoundError, BadRequestError } from '../lib/errors';

const SERVICE_FEE_RWF = 100;

export async function getWallet(userId: string) {
  let wallet = await walletRepo.findByUser(userId);
  if (!wallet) wallet = await walletRepo.create(userId) as any;
  return {
    balance:      wallet!.balance,
    transactions: (wallet as any).transactions ?? [],
    withdrawals:  (wallet as any).withdrawals  ?? [],
  };
}

export async function topUp(userId: string, amount: number, method: string) {
  if (!amount || amount <= 0) throw new BadRequestError('Invalid top-up amount');
  const wallet = await walletRepo.upsert(userId);
  await walletRepo.increment(wallet.id, amount);
  return walletRepo.createTransaction({
    walletId:    wallet.id,
    type:        'credit',
    description: `Top up via ${method}`,
    amount,
  });
}

export async function withdraw(
  userId:         string,
  amount:         number,
  method:         string,
  provider?:      string,
  accountNumber?: string,
) {
  if (!amount || amount <= 0) throw new BadRequestError('Invalid withdrawal amount');
  const wallet = await walletRepo.findByUser(userId);
  if (!wallet) throw new NotFoundError('Wallet not found');
  if (wallet.balance < amount) throw new BadRequestError('Insufficient balance');

  await walletRepo.decrement(wallet.id, amount);
  await walletRepo.createTransaction({
    walletId:    wallet.id,
    type:        'withdrawal',
    description: `Withdrawal via ${method}`,
    amount,
  });
  const req = await walletRepo.createWithdrawal({
    walletId: wallet.id,
    userId,
    amount,
    method:        method || 'mobile_money',
    provider:      provider      ?? null,
    accountNumber: accountNumber ?? null,
  });

  return {
    success:             true,
    amount,
    withdrawalRequestId: req.id,
    status:              'pending',
    message:             'Withdrawal request submitted. Funds will be disbursed shortly.',
  };
}

export async function creditCourier(courierUserId: string, amount: number, deliveryId: string) {
  const fee       = SERVICE_FEE_RWF;
  const netAmount = amount - fee;
  const wallet    = await walletRepo.upsert(courierUserId);

  await walletRepo.increment(wallet.id, netAmount);
  await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          'credit',
    description:   `Payment for delivery #${deliveryId.slice(0, 8)}`,
    amount:        netAmount,
    referenceType: 'delivery',
    referenceId:   deliveryId,
  });
  await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          'fee',
    description:   `Service fee — delivery #${deliveryId.slice(0, 8)}`,
    amount:        fee,
    referenceType: 'delivery',
    referenceId:   deliveryId,
  });

  return { netAmount, fee };
}

export async function debitSender(senderUserId: string, amount: number, deliveryId: string) {
  const wallet = await walletRepo.upsert(senderUserId);
  await walletRepo.decrement(wallet.id, amount);
  await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          'debit',
    description:   `Escrow hold — delivery #${deliveryId.slice(0, 8)}`,
    amount,
    referenceType: 'delivery',
    referenceId:   deliveryId,
  });
  return { success: true, amount };
}
