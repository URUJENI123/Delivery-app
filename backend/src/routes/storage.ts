import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { ALLOWED_FOLDERS } from '../lib/cloudinary';
import * as ctrl from '../controllers/storage.controller';

const router = Router();

router.post('/signed-upload',
  authenticate,
  validateBody(z.object({
    folder: z.enum(ALLOWED_FOLDERS),
    resource_type: z.string().optional(),
  })),
  ctrl.getSignedUpload,
);

export default router;
