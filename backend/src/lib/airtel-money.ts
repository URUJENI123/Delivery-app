/**
 * Airtel Money Rwanda — Collections & Disbursements
 * ──────────────────────────────────────────────────
 * API: https://openapi.airtel.africa
 * Developer portal: https://developers.airtel.africa
 *
 * Two products used:
 *   Collections  — charge the sender's Airtel Money wallet
 *   Disbursements — pay out to a courier's Airtel Money wallet
 *
 * Authentication:
 *   POST /auth/oauth2/token with client_credentials grant → Bearer token
 *   Token is valid for ~3600 seconds, cached in memory.
 *
 * Rwanda country code: RW / currency: RWF
 */

// ─── Config ────────────────────────────────────────────────────────────────────

const BASE_URL   = process.env.AIRTEL_BASE_URL ?? 'https://openapi.airtel.africa';
const CLIENT_ID  = process.env.AIRTEL_CLIENT_ID     ?? '';
const CLIENT_SEC = process.env.AIRTEL_CLIENT_SECRET ?? '';
const COUNTRY    = 'RW';
const CURRENCY   = 'RWF';

// ─── Token cache (Redis-backed, shared across instances) ───────────────────────

import { cacheGet, cacheSet } from './cache';

let cachedToken: { token: string; expiresAt: number } | null = null;
let refreshLock: Promise<string> | null = null;

async function getBearerToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  // Shared Redis cache — lets every worker reuse the same token
  const shared = await cacheGet<string>('airtel:token');
  if (shared) {
    cachedToken = { token: shared, expiresAt: Date.now() + 60_000 };
    return shared;
  }

  // Dedupe concurrent refreshes so only one worker hits the OAuth endpoint
  if (refreshLock) return refreshLock;
  refreshLock = (async () => {
    const res = await fetch(`${BASE_URL}/auth/oauth2/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SEC,
        grant_type:    'client_credentials',
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[Airtel] Token fetch failed (${res.status}): ${body}`);
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    const ttl  = Math.max(data.expires_in - 120, 60);
    cachedToken = {
      token:     data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    cacheSet('airtel:token', data.access_token, ttl).catch(() => {});
    return data.access_token;
  })();

  try {
    return await refreshLock;
  } finally {
    refreshLock = null;
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AirtelPaymentResult {
  transactionId: string;
  referenceId:   string;
  status:        'PENDING' | 'SUCCESS' | 'FAILED';
  message?:      string;
}

// ─── Collections — charge a sender ─────────────────────────────────────────────

/**
 * Initiates a collection (USSD push) — charges the sender's Airtel Money phone.
 * Returns a referenceId immediately; Airtel sends a callback or you poll for status.
 */
export async function collect(
  phoneNumber: string, // Rwanda Airtel number e.g. +250738000000
  amountRwf:   number,
  referenceId: string, // your internal reference (deliveryId / topup id)
  description: string,
): Promise<AirtelPaymentResult> {
  const token  = await getBearerToken();
  const msisdn = normalisePhone(phoneNumber);

  const res = await fetch(`${BASE_URL}/merchant/v1/payments/`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'X-Country':     COUNTRY,
      'X-Currency':    CURRENCY,
    },
    body: JSON.stringify({
      reference:   referenceId,
      subscriber: {
        country:  COUNTRY,
        currency: CURRENCY,
        msisdn:   msisdn,
      },
      transaction: {
        amount:   amountRwf,
        country:  COUNTRY,
        currency: CURRENCY,
        id:       referenceId,
      },
    }),
  });

  const data = await res.json() as any;

  if (!res.ok || data?.status?.code !== '200') {
    const msg = data?.status?.message ?? data?.message ?? res.statusText;
    throw new Error(`[Airtel] collect failed (${res.status}): ${msg}`);
  }

  const txnId = data?.data?.transaction?.id ?? referenceId;
  console.log(`[Airtel] Collection initiated — transactionId: ${txnId}, phone: ${msisdn}, amount: ${amountRwf} RWF`);

  return {
    transactionId: txnId,
    referenceId,
    status:  'PENDING',
    message: data?.status?.message,
  };
}

/**
 * Polls the status of a prior collect() call.
 */
export async function getCollectionStatus(transactionId: string): Promise<AirtelPaymentResult> {
  const token = await getBearerToken();

  const res = await fetch(
    `${BASE_URL}/standard/v1/payments/${transactionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Country':     COUNTRY,
        'X-Currency':    CURRENCY,
      },
    },
  );

  const data = await res.json() as any;
  if (!res.ok) {
    throw new Error(`[Airtel] getCollectionStatus failed (${res.status}): ${JSON.stringify(data)}`);
  }

  const txStatus = data?.data?.transaction?.status ?? 'PENDING';
  const mapped: AirtelPaymentResult['status'] =
    txStatus === 'TS'  ? 'SUCCESS' :
    txStatus === 'TF'  ? 'FAILED'  : 'PENDING';

  return {
    transactionId,
    referenceId:   data?.data?.transaction?.reference_id ?? transactionId,
    status:        mapped,
    message:       data?.data?.transaction?.message,
  };
}

// ─── Disbursements — pay a courier ─────────────────────────────────────────────

/**
 * Transfers money to a courier's Airtel Money wallet.
 * Used when a courier requests a withdrawal.
 */
export async function disburse(
  phoneNumber: string, // courier's Airtel number
  amountRwf:   number,
  referenceId: string, // withdrawalRequestId
  note:        string,
): Promise<AirtelPaymentResult> {
  const token  = await getBearerToken();
  const msisdn = normalisePhone(phoneNumber);

  const res = await fetch(`${BASE_URL}/standard/v1/disbursements/`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'X-Country':     COUNTRY,
      'X-Currency':    CURRENCY,
    },
    body: JSON.stringify({
      reference:   referenceId,
      payee: {
        msisdn:   msisdn,
        wallet_type: 'NORMAL',
      },
      transaction: {
        amount:   amountRwf,
        id:       referenceId,
        type:     'B2C',
      },
      pin: process.env.AIRTEL_MERCHANT_PIN ?? '',
    }),
  });

  const data = await res.json() as any;

  if (!res.ok || data?.status?.code !== '200') {
    const msg = data?.status?.message ?? data?.message ?? res.statusText;
    throw new Error(`[Airtel] disburse failed (${res.status}): ${msg}`);
  }

  const txnId = data?.data?.transaction?.id ?? referenceId;
  console.log(`[Airtel] Disbursement initiated — transactionId: ${txnId}, phone: ${msisdn}, amount: ${amountRwf} RWF`);

  return {
    transactionId: txnId,
    referenceId,
    status:  'PENDING',
    message: data?.status?.message,
  };
}

/**
 * Polls the status of a prior disburse() call.
 */
export async function getDisbursementStatus(transactionId: string): Promise<AirtelPaymentResult> {
  const token = await getBearerToken();

  const res = await fetch(
    `${BASE_URL}/standard/v1/disbursements/${transactionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Country':     COUNTRY,
        'X-Currency':    CURRENCY,
      },
    },
  );

  const data = await res.json() as any;
  if (!res.ok) {
    throw new Error(`[Airtel] getDisbursementStatus failed (${res.status}): ${JSON.stringify(data)}`);
  }

  const txStatus = data?.data?.transaction?.status ?? 'PENDING';
  const mapped: AirtelPaymentResult['status'] =
    txStatus === 'TS'  ? 'SUCCESS' :
    txStatus === 'TF'  ? 'FAILED'  : 'PENDING';

  return {
    transactionId,
    referenceId:   data?.data?.transaction?.reference_id ?? transactionId,
    status:        mapped,
    message:       data?.data?.transaction?.message,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('250')) return digits;
  if (digits.startsWith('07') || digits.startsWith('7')) {
    const local = digits.startsWith('0') ? digits.slice(1) : digits;
    return `250${local}`;
  }
  return digits;
}
