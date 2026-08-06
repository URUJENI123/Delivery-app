/**
 * MTN MoMo Rwanda — Collections & Disbursements
 * ──────────────────────────────────────────────
 * API: https://sandbox.momodeveloper.mtn.com  (sandbox)
 *      https://momoapi.mtn.co.rw              (production / Rwanda)
 *
 * Two products used:
 *   Collections  — charge the sender's MTN MoMo wallet (wallet top-up / pay for delivery)
 *   Disbursements — pay out to a courier's MTN MoMo wallet (withdrawal payout)
 *
 * Authentication flow (per product):
 *   1. POST /token using Basic Auth(apiUserId:apiKey) → Bearer token (valid ~1h)
 *   2. Every API call adds:
 *      Authorization: Bearer <token>
 *      Ocp-Apim-Subscription-Key: <subscriptionKey>
 *      X-Target-Environment: sandbox | mtnrwanda
 */

import crypto from 'crypto';
import { cacheGet, cacheSet } from './cache';

// ─── Config ────────────────────────────────────────────────────────────────────

const IS_PROD         = process.env.NODE_ENV === 'production';
const BASE_URL        = IS_PROD
  ? (process.env.MTN_MOMO_BASE_URL ?? 'https://momoapi.mtn.co.rw')
  : 'https://sandbox.momodeveloper.mtn.com';
const TARGET_ENV      = IS_PROD
  ? (process.env.MTN_MOMO_TARGET_ENV ?? 'mtnrwanda')
  : 'sandbox';
const CURRENCY        = process.env.MTN_MOMO_CURRENCY ?? 'RWF';

// Collection credentials (for charging senders)
const COL_API_USER_ID = process.env.MTN_COLLECTION_API_USER_ID ?? '';
const COL_API_KEY     = process.env.MTN_COLLECTION_API_KEY     ?? '';
const COL_SUB_KEY     = process.env.MTN_COLLECTION_SUBSCRIPTION_KEY ?? '';

// Disbursement credentials (for paying couriers)
const DIS_API_USER_ID = process.env.MTN_DISBURSEMENT_API_USER_ID ?? '';
const DIS_API_KEY     = process.env.MTN_DISBURSEMENT_API_KEY     ?? '';
const DIS_SUB_KEY     = process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY ?? '';

// ─── Token cache (Redis-backed, shared across instances) ───────────────────────

interface TokenCache { token: string; expiresAt: number }
const tokenCache: Record<'collection' | 'disbursement', TokenCache | null> = {
  collection:   null,
  disbursement: null,
};

// In-process mutex — prevents a thundering herd of token fetches when the
// shared token expires at once across workers.
const refreshLocks: Record<'collection' | 'disbursement', Promise<string> | null> = {
  collection:   null,
  disbursement: null,
};

async function getBearerToken(product: 'collection' | 'disbursement'): Promise<string> {
  // Fast path: in-memory cache
  const local = tokenCache[product];
  if (local && Date.now() < local.expiresAt - 60_000) return local.token;

  // Fast path 2: shared Redis cache
  const redisKey = `momo:token:${product}`;
  const shared = await cacheGet<string>(redisKey);
  if (shared) {
    tokenCache[product] = { token: shared, expiresAt: Date.now() + 60_000 };
    return shared;
  }

  // Slow path: fetch from MTN (dedupe concurrent fetches)
  if (refreshLocks[product]) return refreshLocks[product]!;

  refreshLocks[product] = (async () => {
    const userId = product === 'collection' ? COL_API_USER_ID : DIS_API_USER_ID;
    const apiKey = product === 'collection' ? COL_API_KEY     : DIS_API_KEY;
    const subKey = product === 'collection' ? COL_SUB_KEY     : DIS_SUB_KEY;
    const path   = product === 'collection' ? 'collection'    : 'disbursement';

    const credentials = Buffer.from(`${userId}:${apiKey}`).toString('base64');
    const res = await fetch(`${BASE_URL}/${path}/token/`, {
      method:  'POST',
      headers: {
        'Authorization':             `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': subKey,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[MTN] Token fetch failed (${res.status}): ${body}`);
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    const ttl  = Math.max(data.expires_in - 120, 60);
    tokenCache[product] = {
      token:     data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    // Fire-and-forget the shared cache write
    cacheSet(redisKey, data.access_token, ttl).catch(() => {});
    return data.access_token;
  })();

  try {
    return await refreshLocks[product]!;
  } finally {
    refreshLocks[product] = null;
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MoMoRequestToPayResult {
  referenceId: string;
  status:      'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reason?:     string;
}

export interface MoMoTransferResult {
  referenceId: string;
  status:      'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reason?:     string;
}

// ─── Collections — charge a sender ─────────────────────────────────────────────

/**
 * Initiates a "Request to Pay" — sends a USSD push to the sender's MTN MoMo phone.
 * The sender approves the charge on their phone.
 *
 * Returns a referenceId to poll for status.
 * MTN returns 202 Accepted immediately; the payment completes asynchronously.
 */
export async function requestToPay(
  phoneNumber: string, // MSISDN format: 2507XXXXXXXX (no +)
  amountRwf:   number,
  externalId:  string, // your internal reference (deliveryId or topup txn id)
  description: string,
): Promise<MoMoRequestToPayResult> {
  const token       = await getBearerToken('collection');
  const referenceId = crypto.randomUUID();
  const msisdn      = normalisePhone(phoneNumber);

  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method:  'POST',
    headers: {
      'Authorization':             `Bearer ${token}`,
      'X-Reference-Id':             referenceId,
      'X-Target-Environment':       TARGET_ENV,
      'Ocp-Apim-Subscription-Key':  COL_SUB_KEY,
      'Content-Type':               'application/json',
    },
    body: JSON.stringify({
      amount:       String(amountRwf),
      currency:     CURRENCY,
      externalId,
      payer:        { partyIdType: 'MSISDN', partyId: msisdn },
      payerMessage: description,
      payeeNote:    `Delivery App — ${externalId.slice(0, 8).toUpperCase()}`,
    }),
  });

  // 202 = accepted (async), anything else is an error
  if (res.status !== 202) {
    const body = await res.text();
    throw new Error(`[MTN] requestToPay failed (${res.status}): ${body}`);
  }

  console.log(`[MTN] requestToPay initiated — referenceId: ${referenceId}, phone: ${msisdn}, amount: ${amountRwf} RWF`);
  return { referenceId, status: 'PENDING' };
}

/**
 * Polls the status of a prior requestToPay call.
 * Call this from the callback webhook or after a delay.
 */
export async function getCollectionStatus(referenceId: string): Promise<MoMoRequestToPayResult> {
  const token = await getBearerToken('collection');
  const res   = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      'Authorization':             `Bearer ${token}`,
      'X-Target-Environment':       TARGET_ENV,
      'Ocp-Apim-Subscription-Key':  COL_SUB_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[MTN] getCollectionStatus failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { status: string; reason?: string };
  return {
    referenceId,
    status: data.status as MoMoRequestToPayResult['status'],
    reason: data.reason,
  };
}

// ─── Disbursements — pay a courier ─────────────────────────────────────────────

/**
 * Transfers money from the platform's MoMo wallet to a courier's phone number.
 * Used when a courier requests a withdrawal.
 *
 * Returns 202 Accepted immediately; payment completes asynchronously.
 */
export async function transfer(
  phoneNumber: string, // courier's MTN MoMo number
  amountRwf:   number,
  externalId:  string, // withdrawalRequestId
  note:        string,
): Promise<MoMoTransferResult> {
  const token       = await getBearerToken('disbursement');
  const referenceId = crypto.randomUUID();
  const msisdn      = normalisePhone(phoneNumber);

  const res = await fetch(`${BASE_URL}/disbursement/v1_0/transfer`, {
    method:  'POST',
    headers: {
      'Authorization':             `Bearer ${token}`,
      'X-Reference-Id':             referenceId,
      'X-Target-Environment':       TARGET_ENV,
      'Ocp-Apim-Subscription-Key':  DIS_SUB_KEY,
      'Content-Type':               'application/json',
    },
    body: JSON.stringify({
      amount:       String(amountRwf),
      currency:     CURRENCY,
      externalId,
      payee:        { partyIdType: 'MSISDN', partyId: msisdn },
      payerMessage: note,
      payeeNote:    `Delivery App payout — ${externalId.slice(0, 8).toUpperCase()}`,
    }),
  });

  if (res.status !== 202) {
    const body = await res.text();
    throw new Error(`[MTN] transfer failed (${res.status}): ${body}`);
  }

  console.log(`[MTN] Disbursement initiated — referenceId: ${referenceId}, phone: ${msisdn}, amount: ${amountRwf} RWF`);
  return { referenceId, status: 'PENDING' };
}

/**
 * Polls the status of a prior transfer call.
 */
export async function getDisbursementStatus(referenceId: string): Promise<MoMoTransferResult> {
  const token = await getBearerToken('disbursement');
  const res   = await fetch(`${BASE_URL}/disbursement/v1_0/transfer/${referenceId}`, {
    headers: {
      'Authorization':             `Bearer ${token}`,
      'X-Target-Environment':       TARGET_ENV,
      'Ocp-Apim-Subscription-Key':  DIS_SUB_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[MTN] getDisbursementStatus failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { status: string; reason?: string };
  return {
    referenceId,
    status: data.status as MoMoTransferResult['status'],
    reason: data.reason,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Normalises a Rwanda phone number to the MTN format: 2507XXXXXXXX (no + or spaces) */
function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('250')) return digits;
  if (digits.startsWith('07') || digits.startsWith('7')) {
    const local = digits.startsWith('0') ? digits.slice(1) : digits;
    return `250${local}`;
  }
  return digits;
}
