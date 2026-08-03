import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as ctrl from '../controllers/user.controller';

const router = Router();

router.put('/me',
  authenticate,
  validateBody(z.object({ fullName: z.string().optional(), profilePhotoUrl: z.string().url().optional() })),
  ctrl.updateProfile,
);

router.post('/me/photo',
  authenticate,
  validateBody(z.object({ photoUrl: z.string().url() })),
  ctrl.uploadPhoto,
);

export default router;
