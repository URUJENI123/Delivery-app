import prisma from '../lib/prisma';

export const RefreshTokenRepository = {
  create: (data: { token: string; userId: string; expiresAt: Date }) =>
    prisma.refreshToken.create({ data }),

  findByToken: (token: string) =>
    prisma.refreshToken.findUnique({ where: { token } }),

  findOtpTokens: (userId: string) =>
    prisma.refreshToken.findMany({
      where: {
        userId,
        token: { startsWith: 'otp:' },
        expiresAt: { gt: new Date() },
      },
    }),

  findActiveSessions: (userId: string) =>
    prisma.refreshToken.findMany({
      where: {
        userId,
        token: { not: { startsWith: 'otp:' } },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }),

  deleteById: (id: string) => prisma.refreshToken.delete({ where: { id } }),

  deleteOtpTokens: (userId: string) =>
    prisma.refreshToken.deleteMany({
      where: { userId, token: { startsWith: 'otp:' } },
    }),

  deleteAllForUser: (userId: string) =>
    prisma.refreshToken.deleteMany({ where: { userId } }),
};
