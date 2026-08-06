import * as walletRepo from '../repositories/wallet.repository';
import * as payments   from './payments';
import { NotFoundError, BadRequestError } from '../lib/errors';
import prisma from '../lib/prisma';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Platform service fee deducted from every courier payout — configurable via SERVICE_FEE_RWF env var */
export const SERVICE_FEE_RWF = parseInt(process.env.SERVICE_FEE_RWF ?? '100', 10);

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getWallet(userId: string) {
  let wallet = await walletRepo.findByUser(userId);
  if (!wallet) wallet = await walletRepo.create(userId) as any;
  return {
    balance:      wallet!.balance,
    transactions: (wallet as any).transactions ?? [],
    withdrawals:  (wallet as any).withdrawals  ?? [],
  };
}

// ─── Top-up (via MTN MoMo or Airtel Money) ───────────────────────────────────
//
// Initiates a USSD push payment to the sender's phone.
// The wallet is credited only AFTER the provider confirms SUCCESS.
// Returns immediately with status=PENDING; the /wallet/payment-status endpoint
// lets the client poll for confirmation.

export async function topUp(userId: string, amount: number, method: string, phoneNumber?: string) {
  if (!amount || amount <= 0) throw new BadRequestError('Invalid top-up amount');

  const wallet = await walletRepo.upsert(userId);

  // If a phone number is provided, initiate a real MoMo charge
  if (phoneNumber) {
    const txnRef = `TOPUP-${wallet.id.slice(0, 8)}-${Date.now()}`;
    const result = await payments.collect({
      phoneNumber,
      amountRwf:   amount,
      referenceId: txnRef,
      description: `Delivery App wallet top-up — RWF ${amount.toLocaleString()}`,
    });

    // Save a pending transaction — will be confirmed via webhook / polling
    const transaction = await walletRepo.createTransaction({
      walletId:    wallet.id,
      type:        'credit',
      description: `Top-up via ${result.provider} MoMo (${phoneNumber}) — pending`,
      amount,
      referenceType: 'payment',
      referenceId:   result.transactionId,
    });

    // Store provider details for webhook matching
    await prisma.withdrawalRequest.create({
      data: {
        walletId:      wallet.id,
        userId,
        amount,
        method:        result.provider.toLowerCase(),
        provider:      result.provider,
        accountNumber: phoneNumber,
        status:        'pending',
        reference:     result.transactionId,
        metadata:      { type: 'topup', transactionId: result.transactionId, referenceId: result.referenceId } as any,
      },
    });

    return {
      status:        result.status,   // 'PENDING' until provider confirms
      provider:      result.provider,
      transactionId: result.transactionId,
      referenceId:   result.referenceId,
      amount,
      message:       'Payment request sent. Please approve on your mobile phone.',
    };
  }

  // No phone — direct credit (admin/test use only)
  await walletRepo.increment(wallet.id, amount);
  return walletRepo.createTransaction({
    walletId:    wallet.id,
    type:        'credit',
    description: `Top up via ${method}`,
    amount,
  });
}

// ─── Withdrawal (pay out to MoMo wallet) ──────────────────────────────────────
//
// Validates balance, decrements wallet, then fires a real MoMo disbursement
// to the courier's phone via MTN or Airtel (auto-detected from phone prefix).

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

  // Decrement wallet first so balance can't go negative under concurrent requests
  await walletRepo.decrement(wallet.id, amount);
  await walletRepo.createTransaction({
    walletId:    wallet.id,
    type:        'withdrawal',
    description: `Withdrawal via ${method ?? 'mobile_money'}`,
    amount,
  });

  // Create the withdrawal request row
  const req = await walletRepo.createWithdrawal({
    walletId:      wallet.id,
    userId,
    amount,
    method:        method || 'mobile_money',
    provider:      provider      ?? null,
    accountNumber: accountNumber ?? null,
  });

  // Fire the real MoMo disbursement if a phone number was provided
  if (accountNumber) {
    try {
      const result = await payments.disburse({
        phoneNumber: accountNumber,
        amountRwf:   amount,
        referenceId: req.id,
        note:        `Delivery App payout — ${req.id.slice(0, 8).toUpperCase()}`,
        provider:    provider ? (provider.toUpperCase() as payments.MobileProvider) : undefined,
      });

      // Save provider reference on the withdrawal request
      await prisma.withdrawalRequest.update({
        where: { id: req.id },
        data:  {
          provider:  result.provider,
          reference: result.transactionId,
          status:    result.status === 'SUCCESS' ? 'completed' : 'processing',
          metadata:  { transactionId: result.transactionId, referenceId: result.referenceId } as any,
        },
      });

      return {
        success:             true,
        amount,
        withdrawalRequestId: req.id,
        provider:            result.provider,
        transactionId:       result.transactionId,
        status:              result.status === 'SUCCESS' ? 'completed' : 'processing',
        message:             result.status === 'SUCCESS'
          ? `RWF ${amount.toLocaleString()} sent to ${accountNumber}.`
          : 'Disbursement initiated. Funds will arrive shortly.',
      };
    } catch (disbErr: any) {
      // If MoMo API fails, refund balance and mark withdrawal as failed
      await walletRepo.increment(wallet.id, amount);
      await prisma.withdrawalRequest.update({
        where: { id: req.id },
        data:  { status: 'failed', metadata: { error: disbErr.message } as any },
      });
      throw new BadRequestError(`Mobile money disbursement failed: ${disbErr.message}`);
    }
  }

  // No phone provided — request stays pending (will be processed manually)
  return {
    success:             true,
    amount,
    withdrawalRequestId: req.id,
    status:              'pending',
    message:             'Withdrawal request submitted. Provide a phone number for instant MoMo payout.',
  };
}

// ─── Sender payment (escrow debit) ────────────────────────────────────────────
//
// Called when sender pays for a delivery.
// Verifies the sender has sufficient balance, then debits the full agreed price
// and holds it in escrow (tracked as a 'debit' transaction).

export async function debitSender(senderUserId: string, amount: number, deliveryId: string) {
  if (amount <= 0) throw new BadRequestError('Invalid payment amount');

  const wallet = await walletRepo.upsert(senderUserId);

  // Re-fetch with current balance to check sufficiency
  const fresh = await walletRepo.findByUser(senderUserId);
  if (!fresh || fresh.balance < amount) {
    throw new BadRequestError(
      `Insufficient wallet balance. You need RWF ${amount.toLocaleString()} but have RWF ${(fresh?.balance ?? 0).toLocaleString()}.`,
    );
  }

  await walletRepo.decrement(wallet.id, amount);
  await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          'debit',
    description:   `Payment held in escrow — delivery #${deliveryId.slice(0, 8).toUpperCase()}`,
    amount,
    referenceType: 'delivery',
    referenceId:   deliveryId,
  });

  return { success: true, amount, heldInEscrow: true };
}

// ─── Courier payout (on delivery completion) ──────────────────────────────────
//
// Called automatically when a delivery is marked DELIVERED.
// Flow:
//   1. Full agreed price arrives from sender escrow
//   2. Platform fee (SERVICE_FEE_RWF = 100 RWF) is deducted
//   3. Net amount is credited to the courier's wallet
//   4. Two transactions are written: one CREDIT (net), one FEE (100 RWF)
//
// Example: agreed price = 3,000 RWF
//   → courier receives: 2,900 RWF
//   → platform keeps:     100 RWF

export async function creditCourier(courierUserId: string, amount: number, deliveryId: string) {
  const fee       = SERVICE_FEE_RWF;
  const netAmount = Math.max(0, amount - fee);
  const wallet    = await walletRepo.upsert(courierUserId);

  // Credit the net amount to the courier wallet
  await walletRepo.increment(wallet.id, netAmount);

  // Transaction 1: Delivery earning (net of fee)
  await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          'credit',
    description:   `Delivery earnings — #${deliveryId.slice(0, 8).toUpperCase()} (RWF ${amount.toLocaleString()} − RWF ${fee} fee)`,
    amount:        netAmount,
    referenceType: 'delivery',
    referenceId:   deliveryId,
  });

  // Transaction 2: Platform service fee record (for transparency)
  await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          'fee',
    description:   `Platform service fee — delivery #${deliveryId.slice(0, 8).toUpperCase()}`,
    amount:        fee,
    referenceType: 'delivery',
    referenceId:   deliveryId,
  });

  return { grossAmount: amount, fee, netAmount };
}

// ─── Sender refund (on cancellation after payment was held) ───────────────────
//
// If a delivery is cancelled after the sender has already paid (paymentStatus=HELD),
// the held amount is refunded back to the sender's wallet.

export async function refundSender(senderUserId: string, amount: number, deliveryId: string) {
  if (amount <= 0) return;
  const wallet = await walletRepo.upsert(senderUserId);
  await walletRepo.increment(wallet.id, amount);
  await walletRepo.createTransaction({
    walletId:      wallet.id,
    type:          'refund',
    description:   `Refund — cancelled delivery #${deliveryId.slice(0, 8).toUpperCase()}`,
    amount,
    referenceType: 'delivery',
    referenceId:   deliveryId,
  });
  return { refunded: true, amount };
}

// ─── Payment status check ──────────────────────────────────────────────────────
//
// Polls the MoMo provider for the latest status of a pending top-up or disbursement.
// If SUCCESS, credits the wallet (for top-ups) or marks withdrawal completed.

export async function checkPaymentStatus(withdrawalRequestId: string) {
  const request = await prisma.withdrawalRequest.findUnique({
    where:   { id: withdrawalRequestId },
    include: { wallet: true },
  });
  if (!request) throw new NotFoundError('Payment request not found');
  if (request.status === 'completed') return { status: 'completed', alreadyProcessed: true };

  const meta      = (request.metadata as any) ?? {};
  const txnId     = meta.transactionId as string | undefined;
  const isTopup   = meta.type === 'topup';
  const provider  = (request.provider?.toUpperCase() ?? 'MTN') as payments.MobileProvider;

  if (!txnId) return { status: request.status, message: 'No transaction ID on record' };

  const result = await payments.pollStatus({
    provider,
    transactionId: txnId,
    type:          isTopup ? 'collection' : 'disbursement',
  });

  if (result.status === 'SUCCESS' && (request.status as string) !== 'completed') {
    await prisma.$transaction([
      // For top-ups: credit the wallet on first confirmed SUCCESS
      ...(isTopup ? [
        prisma.wallet.update({
          where: { id: request.walletId },
          data:  { balance: { increment: request.amount } },
        }),
      ] : []),
      prisma.withdrawalRequest.update({
        where: { id: withdrawalRequestId },
        data:  { status: 'completed' },
      }),
    ]);
  } else if (result.status === 'FAILED') {
    // For top-ups that failed: do NOT credit. For disbursements: refund wallet.
    if (!isTopup) {
      await walletRepo.increment(request.walletId, request.amount);
    }
    await prisma.withdrawalRequest.update({
      where: { id: withdrawalRequestId },
      data:  { status: 'failed', metadata: { ...meta, failReason: result.message } as any },
    });
  }

  return { status: result.status.toLowerCase(), message: result.message };
}

// ─── Webhook handler (MTN & Airtel callbacks) ─────────────────────────────────
//
// Both MTN and Airtel send POST callbacks to your registered URL when a
// payment status changes. Parse the body and call this to finalise the transaction.

export async function handleProviderWebhook(body: Record<string, unknown>) {
  // MTN format: { referenceId, status: 'SUCCESSFUL'|'FAILED', ... }
  // Airtel format: { transaction: { id, status: 'TS'|'TF', ... } }
  let txnId:  string | undefined;
  let status: 'SUCCESS' | 'FAILED' | undefined;

  // Try MTN shape
  if (body.referenceId && body.status) {
    txnId  = body.referenceId as string;
    status = body.status === 'SUCCESSFUL' ? 'SUCCESS' : 'FAILED';
  }
  // Try Airtel shape
  else if ((body as any)?.transaction?.id) {
    const tx = (body as any).transaction;
    txnId    = tx.id as string;
    status   = tx.status === 'TS' ? 'SUCCESS' : tx.status === 'TF' ? 'FAILED' : undefined;
  }

  if (!txnId || !status) {
    console.warn('[Webhook] Unrecognised payload shape:', JSON.stringify(body));
    return { handled: false };
  }

  // Find the matching request by reference/transactionId stored in metadata
  const request = await prisma.withdrawalRequest.findFirst({
    where: {
      OR: [
        { reference: txnId },
        { metadata:  { path: ['transactionId'], equals: txnId } },
      ],
    },
  });

  if (!request) {
    console.warn(`[Webhook] No withdrawal request found for txnId: ${txnId}`);
    return { handled: false };
  }

  if (request.status === 'completed' || request.status === 'failed') {
    return { handled: true, alreadyProcessed: true };
  }

  const meta    = (request.metadata as any) ?? {};
  const isTopup = meta.type === 'topup';

  if (status === 'SUCCESS') {
    await prisma.$transaction([
      ...(isTopup ? [
        prisma.wallet.update({
          where: { id: request.walletId },
          data:  { balance: { increment: request.amount } },
        }),
      ] : []),
      prisma.withdrawalRequest.update({
        where: { id: request.id },
        data:  { status: 'completed' },
      }),
    ]);
    console.log(`[Webhook] ${isTopup ? 'Top-up' : 'Disbursement'} CONFIRMED — ${request.id}, amount: ${request.amount} RWF`);
  } else {
    if (!isTopup) {
      await walletRepo.increment(request.walletId, request.amount);
      console.log(`[Webhook] Disbursement FAILED — refunded ${request.amount} RWF to wallet ${request.walletId}`);
    }
    await prisma.withdrawalRequest.update({
      where: { id: request.id },
      data:  { status: 'failed', metadata: { ...meta, webhookStatus: status } as any },
    });
  }

  return { handled: true, status };
}
