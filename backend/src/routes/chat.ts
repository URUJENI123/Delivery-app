import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/chat.controller';

const router = Router();

router.get('/conversations', authenticate, ctrl.getConversations);

export default router;
