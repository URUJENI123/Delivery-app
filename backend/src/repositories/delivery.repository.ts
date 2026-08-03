import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const DETAIL_INCLUDE = {
  sender:  { select: { id: true, fullName: true, phone: true, email: true } },
  courier: {
    include: {
      user: { select: { id: true, fullName: true, phone: true, profilePhotoUrl: true } },
    },
  },
  events:       { orderBy: { occurredAt: 'asc' as const } },
  chatMessages: { orderBy: { sentAt:    'asc' as const }, take: 50,
    include: { sender: { select: { id: true, fullName: true } } },
  },
  rating:  true,
  dispute: true,
} as const;

const LIST_INCLUDE = {
  sender:  { select: { id: true, fullName: true, phone: true } },
  courier: { include: { user: { select: { fullName: true, phone: true } } } },
} as const;

export function create(data: Prisma.DeliveryCreateInput) {
  return prisma.delivery.create({ data, include: { sender: true } });
}

export function findById(id: string) {
  return prisma.delivery.findUnique({ where: { id }, include: DETAIL_INCLUDE });
}

export function findByToken(token: string) {
  return prisma.delivery.findUnique({
    where: { recipientTrackingToken: token },
    include: {
      sender:  { select: { id: true, fullName: true, phone: true } },
      courier: { include: { user: { select: { fullName: true, phone: true, profilePhotoUrl: true } } } },
      events:  { orderBy: { occurredAt: 'asc' as const }, take: 20 },
    },
  });
}

export function findMany(
  where?: Prisma.DeliveryWhereInput,
  include?: Prisma.DeliveryInclude,
) {
  return prisma.delivery.findMany({
    where,
    include: (include ?? LIST_INCLUDE) as any,
    orderBy: { createdAt: 'desc' },
  });
}

export function findFirst(
  where: Prisma.DeliveryWhereInput,
  include?: Prisma.DeliveryInclude,
) {
  return prisma.delivery.findFirst({ where, include: include as any });
}

export function update(id: string, data: Prisma.DeliveryUpdateInput) {
  return prisma.delivery.update({ where: { id }, data });
}

export function updateMany(
  where: Prisma.DeliveryWhereInput,
  data: Prisma.DeliveryUpdateManyMutationInput,
) {
  return prisma.delivery.updateMany({ where, data });
}

export function count(where?: Prisma.DeliveryWhereInput) {
  return prisma.delivery.count({ where });
}

export function upsertInterest(
  deliveryId: string,
  courierId: string,
  createData: { proposedPriceRwf?: number | null; etaMinutes?: number | null },
  updateData: { proposedPriceRwf?: number | null; etaMinutes?: number | null },
) {
  return prisma.courierInterest.upsert({
    where:  { deliveryId_courierId: { deliveryId, courierId } },
    create: { deliveryId, courierId, ...createData },
    update: updateData,
  });
}

export function createEvent(data: Prisma.DeliveryEventUncheckedCreateInput) {
  return prisma.deliveryEvent.create({ data });
}

export function findEventsByDelivery(deliveryId: string) {
  return prisma.deliveryEvent.findMany({
    where:   { deliveryId },
    orderBy: { occurredAt: 'asc' },
  });
}
