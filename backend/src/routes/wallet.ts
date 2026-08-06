import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createLimiter } from '../lib/rateLimit';
import * as ctrl from '../controllers/wallet.controller';

const router = Router();

// ─── Authenticated wallet routes ───────────────────────────────────────────────
router.use(authenticate);

router.get('/', ctrl.getWallet);

// Money movement — tight limit (10 req/min/user), admins exempt
const paymentLimiter = createLimiter('payment');

router.post(
  '/topup',
  paymentLimiter,
  validateBody(z.object({
    amount:      z.number().positive('Amount must be positive'),
    method:      z.string().optional(),
    // Phone number for real MoMo collection (078x = MTN, 072x/073x = Airtel)
    phoneNumber: z.string().optional(),
  })),
  ctrl.topUp,
);

router.post(
  '/withdraw',
  paymentLimiter,
  validateBody(z.object({
    amount:        z.number().positive('Amount must be positive'),
    method:        z.string().optional(),
    // Provider: 'MTN' or 'AIRTEL' — auto-detected from accountNumber if omitted
    provider:      z.enum(['MTN', 'AIRTEL']).optional(),
    // MoMo phone number for the payout (required for instant disbursement)
    accountNumber: z.string().min(9).optional(),
  })),
  ctrl.withdraw,
);

// Poll MoMo provider for status of a pending payment (top-up or withdrawal)
router.get('/payment-status/:id', createLimiter('public'), ctrl.checkPaymentStatus);

// ─── Webhook (unauthenticated — called by MTN/Airtel servers) ─────────────────
// NOTE: In production, restrict this route to MTN/Airtel IP ranges at the
// reverse proxy / firewall level. Do NOT expose it publicly without IP filtering.
// Generous limit — providers may batch callbacks; the rate-limit is only a
// safety net, not a bottleneck.
router.post('/webhook', createLimiter('public', { max: 600 }), ctrl.paymentWebhook);

export default router;
