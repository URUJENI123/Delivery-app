import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import * as ctrl from '../controllers/courier.controller';
import { UserRole } from '../types';

const router = Router();

router.post('/register', authenticate, ctrl.register);

router.post('/onboarding/start',
  authenticate,
  validateBody(z.object({ fullName: z.string().optional(), phone: z.string().optional() })),
  ctrl.startOnboarding,
);

router.put('/onboarding/step', authenticate, ctrl.saveOnboardingStep);

router.get('/onboarding/status', authenticate, ctrl.getOnboardingStatus);

router.post('/onboarding/submit',
  authenticate,
  validateBody(z.object({ agreeToTerms: z.boolean() })),
  ctrl.submitOnboarding,
);

router.get('/me',          authenticate, requireRole(UserRole.COURIER), ctrl.getProfile);
router.put('/me',          authenticate, requireRole(UserRole.COURIER), ctrl.updateProfile);
router.put('/me/online',   authenticate, requireRole(UserRole.COURIER),
  validateBody(z.object({ isOnline: z.boolean(), lat: z.number().optional(), lng: z.number().optional() })),
  ctrl.toggleOnline,
);
router.put('/me/location', authenticate, requireRole(UserRole.COURIER),
  validateBody(z.object({ lat: z.number(), lng: z.number(), accuracy: z.number().optional(), heading: z.number().optional(), speed: z.number().optional() })),
  ctrl.updateLocation,
);
router.get('/me/jobs',     authenticate, requireRole(UserRole.COURIER), ctrl.getJobs);
router.get('/me/earnings', authenticate, requireRole(UserRole.COURIER), ctrl.getEarnings);
router.get('/dashboard',   authenticate, requireRole(UserRole.COURIER), ctrl.getDashboard);

router.get('/nearby',
  authenticate, requireRole(UserRole.ADMIN),
  validateQuery(z.object({ lat: z.coerce.number(), lng: z.coerce.number(), radius: z.coerce.number().optional() })),
  ctrl.findNearby,
);

export default router;
