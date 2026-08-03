import prisma from '../lib/prisma';

export const RatingRepository = {
  findByDeliveryId: (deliveryId: string) =>
    prisma.rating.findUnique({ where: { deliveryId } }),

  findByReceiverId: (receiverId: string) =>
    prisma.rating.findMany({ where: { receiverId } }),

  upsert: (deliveryId: string, data: Parameters<typeof prisma.rating.create>[0]['data']) =>
    prisma.rating.upsert({
      where: { deliveryId },
      create: data,
      update: { stars: data.stars, comment: data.comment },
    }),
};
