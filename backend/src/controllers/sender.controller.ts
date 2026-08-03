import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const ACTIVE = ['BROADCAST','COURIER_ASSIGNED','COURIER_CONFIRMED','PICKUP_EN_ROUTE','ARRIVED_PICKUP','PICKED_UP','IN_TRANSIT','ARRIVED_DROPOFF'] as const;

    const [activeCount, totalCount, completed, recent, profile] = await Promise.all([
      prisma.delivery.count({ where: { senderId: userId, status: { in: ACTIVE as any } } }),
      prisma.delivery.count({ where: { senderId: userId } }),
      prisma.delivery.findMany({ where: { senderId: userId, status: 'DELIVERED' }, select: { finalPriceRwf: true } }),
      prisma.delivery.findMany({
        where: { senderId: userId }, orderBy: { createdAt: 'desc' }, take: 5,
        include: { courier: { include: { user: { select: { fullName: true, phone: true } } } } },
      }),
      prisma.senderProfile.findUnique({ where: { userId } }),
    ]);

    res.json({
      activeDeliveries: activeCount,
      totalDeliveries:  totalCount,
      totalSpent:       completed.reduce((s, d) => s + (d.finalPriceRwf ?? 0), 0),
      recentDeliveries: recent,
      savedAddresses:   profile?.defaultPickupAddress ?? null,
    });
  } catch (err) { next(err); }
}
