import prisma from '../lib/prisma';

export const OnboardingRepository = {
  findByUserId: (userId: string) =>
    prisma.onboardingSession.findUnique({ where: { userId } }),

  create: (data: Parameters<typeof prisma.onboardingSession.create>[0]['data']) =>
    prisma.onboardingSession.create({ data }),

  update: (userId: string, data: object) =>
    prisma.onboardingSession.update({ where: { userId }, data: data as any }),
};
