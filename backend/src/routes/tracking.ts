import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { createLimiter } from '../lib/rateLimit';
import * as ctrl from '../controllers/tracking.controller';

const router = Router();

// Public, unauthenticated — bound to 60 req/min/IP to prevent token scraping
router.use(createLimiter('public'));

router.get('/:token',             ctrl.getByToken);
router.post('/:token/confirm-otp',
  validateBody(z.object({ otp: z.string().length(6) })),
  ctrl.confirmOtp,
);

export default router;
