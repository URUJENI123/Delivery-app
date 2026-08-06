import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createLimiter } from '../lib/rateLimit';
import * as ctrl from '../controllers/geocoding.controller';

const router = Router();

// Bounded — the resolve/reverse endpoints proxy external Nominatim lookups
router.use(createLimiter('public'));

// Public — the map bounds are needed before login (e.g. landing page)
router.get('/bounds', ctrl.getBounds);

// Auth required — prevents abuse of Nominatim via our proxy
router.post(
  '/resolve',
  authenticate,
  validateBody(z.object({ address: z.string().min(3) })),
  ctrl.resolve,
);

router.post(
  '/reverse',
  authenticate,
  validateBody(z.object({
    lat: z.number().min(-2.1).max(-1.8),
    lng: z.number().min(29.9).max(30.2),
  })),
  ctrl.reverse,
);

export default router;
