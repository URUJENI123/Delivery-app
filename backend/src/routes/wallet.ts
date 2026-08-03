import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as ctrl from '../controllers/wallet.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.getWallet);

router.post('/topup',
  validateBody(z.object({ amount: z.number().positive(), method: z.string().optional() })),
  ctrl.topUp,
);

router.post('/withdraw',
  validateBody(z.object({
    amount:        z.number().positive(),
    method:        z.string().optional(),
    provider:      z.string().optional(),
    accountNumber: z.string().optional(),
  })),
  ctrl.withdraw,
);

export default router;
