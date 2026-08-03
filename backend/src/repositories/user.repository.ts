import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { courier: true, senderProfile: true, onboardingSession: true },
  });
}

export function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findByPhone(phone: string) {
  return prisma.user.findUnique({ where: { phone } });
}

export function create(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

export function update(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
}

export function findMany(
  where?: Prisma.UserWhereInput,
  select?: Prisma.UserSelect,
) {
  return prisma.user.findMany({
    where,
    select: select as any,
    orderBy: { createdAt: 'desc' },
  });
}
