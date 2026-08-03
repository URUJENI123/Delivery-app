import prisma from '../lib/prisma';

const SENDER_SELECT = {
  sender: { select: { id: true, fullName: true, profilePhotoUrl: true } },
} as const;

export function findByDelivery(deliveryId: string) {
  return prisma.chatMessage.findMany({
    where:   { deliveryId },
    orderBy: { sentAt: 'asc' },
    include: SENDER_SELECT,
  });
}

export function create(data: {
  deliveryId: string;
  senderId:   string;
  body:       string;
  photoUrl?:  string | null;
}) {
  return prisma.chatMessage.create({
    data,
    include: SENDER_SELECT,
  });
}

export function countUnread(deliveryId: string, notSenderId: string) {
  return prisma.chatMessage.count({
    where: { deliveryId, senderId: { not: notSenderId }, readAt: null },
  });
}

export function findLastMessage(deliveryId: string) {
  return prisma.chatMessage.findFirst({
    where:   { deliveryId },
    orderBy: { sentAt: 'desc' },
    select:  { body: true, sentAt: true, senderId: true },
  });
}
