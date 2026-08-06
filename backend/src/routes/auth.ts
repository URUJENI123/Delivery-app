import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as ctrl from '../controllers/auth.controller';
import { UserRole } from '../types';

const router = Router();

router.post('/sender/signup',
  validateBody(z.object({ email: z.string().email(), password: z.string().min(6), fullName: z.string().optional() })),
  ctrl.senderSignup,
);

router.post('/sender/signin',
  validateBody(z.object({ email: z.string().email(), password: z.string() })),
  ctrl.senderSignin,
);

router.post('/admin/signin',
  validateBody(z.object({ email: z.string().email(), password: z.string() })),
  ctrl.adminSignin,
);

router.post('/courier/signup',
  validateBody(z.object({
    email:    z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(1),
    phone:    z.string().min(5),
  })),
  ctrl.courierSignup,
);

router.post('/courier/signin',
  validateBody(z.object({ email: z.string().email(), password: z.string() })),
  ctrl.courierSignin,
);

router.post('/courier/check-phone',
  validateBody(z.object({ phone: z.string().min(5) })),
  ctrl.checkCourierPhone,
);

router.post('/courier/request-otp',
  validateBody(z.object({ phone: z.string().min(5) })),
  ctrl.courierRequestOtp,
);

router.post('/courier/verify-otp',
  validateBody(z.object({ phone: z.string().min(5), token: z.string() })),
  ctrl.courierVerifyOtp,
);

router.post('/google',
  validateBody(z.object({
    email:     z.string().email(),
    fullName:  z.string().optional(),
    googleId:  z.string().optional(),
    avatarUrl: z.string().url().optional(),
  })),
  ctrl.googleAuth,
);

router.post('/refresh',
  validateBody(z.object({ refresh_token: z.string().optional() })),
  ctrl.refreshTokenHandler,
);

router.get('/me',          authenticate, ctrl.getProfile);
router.post('/logout',     authenticate, ctrl.logout);

router.patch('/role',
  authenticate,
  validateBody(z.object({ userId: z.string().uuid(), role: z.nativeEnum(UserRole) })),
  ctrl.updateRole,
);

router.post('/password/reset',
  validateBody(z.object({ email: z.string().email() })),
  ctrl.requestPasswordReset,
);

router.post('/password/update',
  authenticate,
  validateBody(z.object({ newPassword: z.string().min(6) })),
  ctrl.updatePassword,
);

router.get('/sessions',            authenticate, ctrl.getSessions);
router.post('/sessions/revoke-all', authenticate, ctrl.revokeAllSessions);

export default router;
