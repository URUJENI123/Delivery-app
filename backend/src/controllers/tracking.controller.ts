import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { withCache, cacheDel } from '../lib/cache';

export async function getByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const delivery = await withCache(
      `tracking:${req.params.token}`,
      30, // 30s — tracking pages poll frequently, status changes are short-lived
      () => prisma.delivery.findUnique({
        where: { recipientTrackingToken: req.params.token },
        include: {
          sender:  { select: { id: true, fullName: true, phone: true } },
          courier: { include: { user: { select: { fullName: true, phone: true, profilePhotoUrl: true } } } },
          events:  { orderBy: { occurredAt: 'asc' }, take: 20 },
        },
      }),
    );
    if (!delivery) throw new NotFoundError('Delivery not found');
    res.json(delivery);
  } catch (err) { next(err); }
}

export async function confirmOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { recipientTrackingToken: req.params.token },
    });
    if (!delivery) throw new NotFoundError('Delivery not found');
    if (delivery.status !== 'ARRIVED_DROPOFF') throw new BadRequestError('Courier has not arrived yet');
    if (!delivery.dropoffOtpHash) throw new BadRequestError('No OTP set');

    const valid = await bcrypt.compare(req.body.otp as string, delivery.dropoffOtpHash);
    if (!valid) throw new BadRequestError('Invalid OTP');

    await prisma.delivery.update({
      where: { id: delivery.id },
      data:  { otpVerifiedAt: new Date() },
    });
    // Invalidate the tracking cache so the recipient sees the verified state
    cacheDel(`tracking:${req.params.token}`).catch(() => {});
    res.json({ verified: true, message: 'OTP confirmed. The courier will complete the delivery shortly.' });
  } catch (err) { next(err); }
}
