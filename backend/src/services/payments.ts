/**
 * Unified Mobile Money Payment Service
 * ────────────────────────────────────
 * Abstracts MTN MoMo and Airtel Money behind a single interface.
 *
 * Provider is chosen automatically based on the phone number prefix:
 *   078x / 079x → MTN MoMo
 *   073x / 072x → Airtel Money
 *
 * Two operations:
 *   collect()   — charge a sender's mobile wallet (top-up / pay for delivery)
 *   disburse()  — pay out to a courier's mobile wallet (withdrawal)
 *
 * All amounts are in RWF (Rwandan Franc).
 */

import * as mtn    from '../lib/mtn-momo';
import * as airtel from '../lib/airtel-money';
import { BadRequestError } from '../lib/errors';

export type MobileProvider = 'MTN' | 'AIRTEL';

export interface PaymentResult {
  provider:      MobileProvider;
  referenceId:   string;   // our local reference
  transactionId: string;   // provider's transaction ID (use for status polling)
  status:        'PENDING' | 'SUCCESS' | 'FAILED';
  message?:      string;
}

// ─── Provider detection ────────────────────────────────────────────────────────

/**
 * Detects mobile money provider from Rwanda phone prefix.
 *
 * MTN MoMo prefixes (Rwanda):   078, 079
 * Airtel Money prefixes (Rwanda): 072, 073
 */
export function detectProvider(phone: string): MobileProvider {
  const digits = phone.replace(/\D/g, '');
  // Strip country code if present (25078... → 078...)
  const local  = digits.startsWith('250') ? digits.slice(3) : digits;

  if (local.startsWith('78') || local.startsWith('79')) return 'MTN';
  if (local.startsWith('72') || local.startsWith('73')) return 'AIRTEL';

  // Fallback: if they explicitly set the provider, trust it; otherwise MTN as default
  throw new BadRequestError(
    `Cannot detect mobile money provider for phone number "${phone}". ` +
    'Rwanda MTN numbers start with 078/079 and Airtel numbers with 072/073.',
  );
}

// ─── Collection (charge sender) ───────────────────────────────────────────────

/**
 * Sends a USSD push to the sender's mobile money wallet.
 * The sender approves the charge on their phone.
 *
 * Returns immediately with status=PENDING. Use pollCollectionStatus() to confirm.
 */
export async function collect(params: {
  phoneNumber:  string;
  amountRwf:    number;
  referenceId:  string;   // deliveryId or top-up transaction ID
  description:  string;
  provider?:    MobileProvider; // optional override; auto-detected from phone if omitted
}): Promise<PaymentResult> {
  const provider = params.provider ?? detectProvider(params.phoneNumber);

  if (provider === 'MTN') {
    const result = await mtn.requestToPay(
      params.phoneNumber,
      params.amountRwf,
      params.referenceId,
      params.description,
    );
    return {
      provider,
      referenceId:   params.referenceId,
      transactionId: result.referenceId, // MTN uses referenceId as the polling key
      status:        result.status === 'SUCCESSFUL' ? 'SUCCESS' : result.status,
      message:       result.reason,
    };
  }

  // Airtel
  const result = await airtel.collect(
    params.phoneNumber,
    params.amountRwf,
    params.referenceId,
    params.description,
  );
  return {
    provider,
    referenceId:   params.referenceId,
    transactionId: result.transactionId,
    status:        result.status,
    message:       result.message,
  };
}

// ─── Disbursement (pay courier) ───────────────────────────────────────────────

/**
 * Transfers money from the platform wallet to a courier's mobile money number.
 * Called automatically when a WithdrawalRequest is processed.
 */
export async function disburse(params: {
  phoneNumber:  string;
  amountRwf:    number;
  referenceId:  string;   // withdrawalRequestId
  note:         string;
  provider?:    MobileProvider;
}): Promise<PaymentResult> {
  const provider = params.provider ?? detectProvider(params.phoneNumber);

  if (provider === 'MTN') {
    const result = await mtn.transfer(
      params.phoneNumber,
      params.amountRwf,
      params.referenceId,
      params.note,
    );
    return {
      provider,
      referenceId:   params.referenceId,
      transactionId: result.referenceId,
      status:        result.status === 'SUCCESSFUL' ? 'SUCCESS' : result.status,
      message:       result.reason,
    };
  }

  // Airtel
  const result = await airtel.disburse(
    params.phoneNumber,
    params.amountRwf,
    params.referenceId,
    params.note,
  );
  return {
    provider,
    referenceId:   params.referenceId,
    transactionId: result.transactionId,
    status:        result.status,
    message:       result.message,
  };
}

// ─── Status polling ────────────────────────────────────────────────────────────

/**
 * Polls the provider for the current payment status.
 * Called from webhook handlers or the payment status check endpoint.
 */
export async function pollStatus(params: {
  provider:      MobileProvider;
  transactionId: string;
  type:          'collection' | 'disbursement';
}): Promise<{ status: 'PENDING' | 'SUCCESS' | 'FAILED'; message?: string }> {
  if (params.provider === 'MTN') {
    const fn = params.type === 'collection'
      ? mtn.getCollectionStatus
      : mtn.getDisbursementStatus;
    const result = await fn(params.transactionId);
    return {
      status:  result.status === 'SUCCESSFUL' ? 'SUCCESS' : result.status,
      message: result.reason,
    };
  }

  const fn = params.type === 'collection'
    ? airtel.getCollectionStatus
    : airtel.getDisbursementStatus;
  const result = await fn(params.transactionId);
  return { status: result.status, message: result.message };
}
