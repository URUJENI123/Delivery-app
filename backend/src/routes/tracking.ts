import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import * as ctrl from '../controllers/tracking.controller';

const router = Router();

router.get('/:token',             ctrl.getByToken);
router.post('/:token/confirm-otp',
  validateBody(z.object({ otp: z.string().length(6) })),
  ctrl.confirmOtp,
);

export default router;
