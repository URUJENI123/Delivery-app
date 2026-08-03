import prisma from '../lib/prisma';

export function findDispute(id: string) {
  return prisma.dispute.findUnique({ where: { id } });
}

export function findDisputes() {
  return prisma.dispute.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      delivery: {
        include: {
          sender:  { select: { id: true, fullName: true, phone: true } },
          courier: { include: { user: { select: { id: true, fullName: true } } } },
        },
      },
    },
  });
}

export function updateDispute(
  id: string,
  data: {
    status?:     string;
    resolution?: string;
    resolvedAt?: Date | null;
  },
) {
  return prisma.dispute.update({ where: { id }, data: data as any });
}

export function getActiveDeliveryCount() {
  return prisma.delivery.count({
    where: {
      status: {
        in: [
          'BROADCAST', 'COURIER_ASSIGNED', 'COURIER_CONFIRMED',
          'PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP',
          'IN_TRANSIT', 'ARRIVED_DROPOFF',
        ] as any[],
      },
    },
  });
}

export function getRecentEvents(take: number) {
  return prisma.deliveryEvent.findMany({
    orderBy: { occurredAt: 'desc' },
    take,
    include: {
      delivery: { select: { id: true, status: true } },
      user:     { select: { fullName: true } },
    },
  });
}

export function countUsers() {
  return prisma.user.count();
}
