import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/sender.controller';

const router = Router();

router.get('/dashboard', authenticate, ctrl.getDashboard);

export default router;
