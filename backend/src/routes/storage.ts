import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createLimiter } from '../lib/rateLimit';
import { ALLOWED_FOLDERS } from '../lib/cloudinary';
import * as ctrl from '../controllers/storage.controller';

const router = Router();

// Signed upload URLs are free-ish (Cloudinary bills on upload) — keep it bounded
router.post('/signed-upload',
  authenticate,
  createLimiter('public', { max: 30 }),
  validateBody(z.object({
    folder: z.enum(ALLOWED_FOLDERS),
    resource_type: z.string().optional(),
  })),
  ctrl.getSignedUpload,
);

export default router;
