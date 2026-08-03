import prisma from '../lib/prisma';

export function createToken(data: { token: string; userId: string; expiresAt: Date }) {
  return prisma.refreshToken.create({ data });
}

export function findToken(token: string) {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
}

export function findTokenById(id: string) {
  return prisma.refreshToken.findUnique({ where: { id } });
}

export function findOtpTokens(userId: string) {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      token: { startsWith: 'otp:' },
      expiresAt: { gt: new Date() },
    },
  });
}

export function deleteToken(id: string) {
  return prisma.refreshToken.delete({ where: { id } });
}

export function deleteManyByUser(userId: string) {
  return prisma.refreshToken.deleteMany({ where: { userId } });
}

export function deleteOtpTokens(userId: string) {
  return prisma.refreshToken.deleteMany({
    where: { userId, token: { startsWith: 'otp:' } },
  });
}

export function findActiveSessions(userId: string) {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      token: { not: { startsWith: 'otp:' } },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}
