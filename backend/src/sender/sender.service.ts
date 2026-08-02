import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class SenderService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const ACTIVE_STATUSES = [
      'BROADCAST', 'COURIER_ASSIGNED', 'COURIER_CONFIRMED', 'PICKUP_EN_ROUTE',
      'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF',
    ] as const;

    const [
      activeCount,
      totalCount,
      completedDeliveries,
      recentDeliveries,
      senderProfile,
    ] = await Promise.all([
      this.prisma.delivery.count({
        where: { senderId: userId, status: { in: ACTIVE_STATUSES as any } },
      }),
      this.prisma.delivery.count({ where: { senderId: userId } }),
      this.prisma.delivery.findMany({
        where: { senderId: userId, status: 'DELIVERED' },
        select: { finalPriceRwf: true },
      }),
      this.prisma.delivery.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          courier: { include: { user: { select: { fullName: true, phone: true } } } },
        },
      }),
      this.prisma.senderProfile.findUnique({ where: { userId } }),
    ]);

    const totalSpent = completedDeliveries.reduce((s, d) => s + (d.finalPriceRwf ?? 0), 0);

    return {
      activeDeliveries: activeCount,
      totalDeliveries:  totalCount,
      totalSpent,
      recentDeliveries,
      savedAddresses: senderProfile?.defaultPickupAddress ?? null,
    };
  }
}
