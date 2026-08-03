import prisma from '../lib/prisma';

// ─── getDashboard ─────────────────────────────────────────────────────────────

export async function getDashboard(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeStatuses = [
    'BROADCAST',
    'COURIER_ASSIGNED',
    'COURIER_CONFIRMED',
    'PICKUP_EN_ROUTE',
    'ARRIVED_PICKUP',
    'PICKED_UP',
    'IN_TRANSIT',
    'ARRIVED_DROPOFF',
  ] as const;

  const [
    totalDeliveries,
    activeDeliveries,
    completedDeliveries,
    todayDeliveries,
    monthDeliveries,
    wallet,
    recentDeliveries,
  ] = await Promise.all([
    prisma.delivery.count({ where: { senderId: userId } }),
    prisma.delivery.count({
      where: { senderId: userId, status: { in: activeStatuses as any } },
    }),
    prisma.delivery.count({ where: { senderId: userId, status: 'DELIVERED' as any } }),
    prisma.delivery.count({ where: { senderId: userId, createdAt: { gte: todayStart } } }),
    prisma.delivery.count({ where: { senderId: userId, createdAt: { gte: monthStart } } }),
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
    prisma.delivery.findMany({
      where:   { senderId: userId },
      orderBy: { createdAt: 'desc' },
      take:    5,
      include: {
        courier: { include: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  return {
    totalDeliveries,
    activeDeliveries,
    completedDeliveries,
    todayDeliveries,
    monthDeliveries,
    walletBalance: wallet?.balance ?? 0,
    recentDeliveries,
  };
}
