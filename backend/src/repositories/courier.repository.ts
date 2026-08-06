import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

const WITH_USER = {
  user: {
    select: {
      id: true, email: true, phone: true, fullName: true,
      profilePhotoUrl: true, role: true,
    },
  },
} as const;

export function findByUserId(userId: string) {
  return prisma.courier.findUnique({ where: { userId }, include: WITH_USER });
}

export function findById(id: string) {
  return prisma.courier.findUnique({ where: { id }, include: WITH_USER });
}

export function create(userId: string, data: Omit<Prisma.CourierCreateInput, 'user'>) {
  return prisma.courier.create({ data: { ...data, user: { connect: { id: userId } } } });
}

export function update(userId: string, data: Prisma.CourierUpdateInput) {
  return prisma.courier.update({ where: { userId }, data });
}

export function upsert(
  userId: string,
  createData: Omit<Prisma.CourierCreateInput, 'user'>,
  updateData: Prisma.CourierUpdateInput = {},
) {
  return prisma.courier.upsert({
    where: { userId },
    create: { ...createData, user: { connect: { id: userId } } },
    update: updateData,
  });
}

export function findOnline() {
  return prisma.courier.findMany({
    where: {
      isOnline: true,
      isApprovedByAdmin: true,
      currentLat: { not: null },
      currentLng: { not: null },
    },
    include: WITH_USER,
  });
}

export function findMany(
  where?: Prisma.CourierWhereInput,
  include?: Prisma.CourierInclude,
  orderBy?: Prisma.CourierOrderByWithRelationInput,
) {
  return prisma.courier.findMany({
    where,
    include: include as any,
    orderBy: orderBy ?? { createdAt: 'desc' },
  });
}

export function count(where?: Prisma.CourierWhereInput) {
  return prisma.courier.count({ where });
}

export function updateStats(
  userId: string,
  data: { incrementDeliveries?: boolean; incrementEarnings?: number },
) {
  return prisma.courier.update({
    where: { userId },
    data: {
      ...(data.incrementDeliveries ? { totalDeliveries: { increment: 1 } } : {}),
      ...(data.incrementEarnings   ? { totalEarnings:   { increment: data.incrementEarnings } } : {}),
    },
  });
}

export function createLocation(data: Prisma.CourierLocationCreateInput) {
  return prisma.courierLocation.create({ data });
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export function findOnboardingByUser(userId: string) {
  return prisma.onboardingSession.findUnique({ where: { userId } });
}

export function createOnboarding(userId: string, data: Prisma.OnboardingSessionCreateInput) {
  return prisma.onboardingSession.create({ data: { ...data, user: { connect: { id: userId } } } });
}

export function updateOnboarding(userId: string, data: Prisma.OnboardingSessionUpdateInput) {
  return prisma.onboardingSession.update({ where: { userId }, data });
}
