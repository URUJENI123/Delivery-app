import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import * as ctrl from '../controllers/admin.controller';
import * as refundCtrl from '../controllers/refund.controller';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN));

router.get('/dashboard',               ctrl.getDashboard);
router.get('/live-map',                ctrl.getLiveMap);
router.get('/revenue',                 ctrl.getPlatformRevenue);
router.post('/revenue/withdraw',
  validateBody(z.object({
    amount:      z.number().positive('Amount must be positive'),
    phoneNumber: z.string().min(9, 'Enter a valid Rwanda phone number'),
    provider:    z.enum(['MTN', 'AIRTEL']).optional(),
  })),
  ctrl.withdrawPlatformRevenue,
);
router.get('/disputes',                ctrl.listDisputes);

// ─── Refund management ────────────────────────────────────────────────────────
router.get('/refunds',
  validateQuery(z.object({ status: z.string().optional() })),
  refundCtrl.listRefunds,
);
router.get('/refunds/:id',            refundCtrl.getRefund);
router.put('/refunds/:id/approve',
  validateBody(z.object({ adminNote: z.string().optional() })),
  refundCtrl.approveRefund,
);
router.put('/refunds/:id/reject',
  validateBody(z.object({ adminNote: z.string().min(5, 'Rejection reason is required') })),
  refundCtrl.rejectRefund,
);

router.get('/couriers',
  validateQuery(z.object({ tier: z.string().optional(), approved: z.string().optional(), zone: z.string().optional() })),
  ctrl.listCouriers,
);

router.put('/couriers/:id/verify',
  validateBody(z.object({ approved: z.boolean(), tier: z.string().optional(), adminNotes: z.string().optional() })),
  ctrl.verifyCourier,
);

router.put('/couriers/:id/suspend',
  validateBody(z.object({ reason: z.string() })),
  ctrl.suspendCourier,
);

router.get('/users',
  validateQuery(z.object({ role: z.string().optional(), search: z.string().optional() })),
  ctrl.listUsers,
);

router.get('/deliveries',
  validateQuery(z.object({ status: z.string().optional() })),
  ctrl.listDeliveries,
);

router.put('/disputes/:id',
  validateBody(z.object({ status: z.string().optional(), resolution: z.string().optional() })),
  ctrl.updateDispute,
);

export default router;
