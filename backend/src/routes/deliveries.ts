import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as ctrl     from '../controllers/delivery.controller';
import * as chatCtrl from '../controllers/chat.controller';
import { UserRole } from '../types';

const router = Router();

router.post('/',
  authenticate, requireRole(UserRole.SENDER),
  validateBody(z.object({
    pickupAddress:      z.string(),
    pickupLat:          z.number(),
    pickupLng:          z.number(),
    pickupNotes:        z.string().optional(),
    pickupEmail:        z.string().email().optional(),
    dropoffAddress:     z.string(),
    dropoffLat:         z.number(),
    dropoffLng:         z.number(),
    dropoffNotes:       z.string().optional(),
    dropoffEmail:       z.string().email().optional(),
    itemDescription:    z.string(),
    category:           z.string().optional(),
    size:               z.string().optional(),
    estimatedValueRwf:  z.number().optional(),
    isFragile:          z.boolean().optional(),
    pickupContactName:  z.string(),
    pickupContactPhone: z.string(),
    recipientName:      z.string(),
    recipientPhone:     z.string(),
    scheduledPickupAt:  z.string().optional(),
    preferAsap:         z.boolean().optional(),
    quotedPriceRwf:     z.number().optional(),
    paymentMethod:      z.string().optional(),
    requiresRecipientOtp: z.boolean().optional(),
  })),
  ctrl.create,
);

router.get('/',          authenticate,                              ctrl.findAll);
router.get('/available', authenticate, requireRole(UserRole.COURIER), ctrl.getAvailable);
router.get('/:id',       authenticate,                              ctrl.findOne);

router.post('/:id/interest',
  authenticate, requireRole(UserRole.COURIER),
  validateBody(z.object({ proposedPriceRwf: z.number().optional(), etaMinutes: z.number().optional() })),
  ctrl.expressInterest,
);

router.post('/:id/take-job',
  authenticate, requireRole(UserRole.COURIER),
  validateBody(z.object({ proposedPriceRwf: z.number().optional() })),
  ctrl.takeJob,
);

router.post('/:id/confirm-agreement',
  authenticate,
  validateBody(z.object({ agreedPriceRwf: z.number(), agreedDeliveryTime: z.number().optional() })),
  ctrl.confirmAgreement,
);

router.post('/:id/pay',
  authenticate, requireRole(UserRole.SENDER),
  validateBody(z.object({ agreedDeliveryTime: z.number().optional() })),
  ctrl.pay,
);

router.post('/:id/start-delivery', authenticate, requireRole(UserRole.COURIER), ctrl.startDelivery);

router.post('/:id/arrived-pickup',
  authenticate, requireRole(UserRole.COURIER),
  validateBody(z.object({ otp: z.string() })),
  ctrl.arrivedAtPickup,
);

router.post('/:id/picked-up',  authenticate, requireRole(UserRole.COURIER), ctrl.pickedUp);
router.post('/:id/in-transit', authenticate, requireRole(UserRole.COURIER), ctrl.inTransit);
router.post('/:id/arrived',    authenticate, requireRole(UserRole.COURIER), ctrl.courierArrived);

router.post('/:id/complete',
  authenticate, requireRole(UserRole.COURIER),
  validateBody(z.object({ otp: z.string().optional() })),
  ctrl.completeDelivery,
);

router.post('/:id/rate',
  authenticate,
  validateBody(z.object({ stars: z.number().int().min(1).max(5), comment: z.string().optional() })),
  ctrl.createRating,
);

router.put('/:id/cancel', authenticate, requireRole(UserRole.SENDER), ctrl.cancel);

// ─── Embedded chat routes ─────────────────────────────────────────────────────
router.get('/:id/chat',  authenticate, chatCtrl.getMessages);
router.post('/:id/chat',
  authenticate,
  validateBody(z.object({ body: z.string().min(1), photoUrl: z.string().url().optional() })),
  chatCtrl.sendMessage,
);

export default router;
