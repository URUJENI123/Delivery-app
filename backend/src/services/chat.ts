import * as chatRepo     from '../repositories/chat.repository';
import * as deliveryRepo from '../repositories/delivery.repository';
import * as userRepo     from '../repositories/user.repository';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import { UserRole } from '../types';
import type { DeliveryGateway } from '../lib/socket';

let gateway: DeliveryGateway | null = null;
export function setGateway(gw: DeliveryGateway) { gateway = gw; }

export async function getConversations(userId: string) {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const { default: prisma } = await import('../lib/prisma');

  if (user.role === UserRole.COURIER) {
    const { default: pris } = await import('../lib/prisma');
    const courier = await pris.courier.findUnique({ where: { userId } });
    if (!courier) return [];
    const deliveries = await pris.delivery.findMany({
      where:   { courierId: courier.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        sender:       { select: { id: true, fullName: true, profilePhotoUrl: true } },
        chatMessages: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    });
    return deliveries.map((d) => ({
      deliveryId:  d.id,
      status:      d.status,
      otherParty:  d.sender,
      lastMessage: d.chatMessages[0] ?? null,
    }));
  }

  if (user.role === UserRole.SENDER) {
    const deliveries = await prisma.delivery.findMany({
      where:   { senderId: userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        courier:      { include: { user: { select: { id: true, fullName: true, profilePhotoUrl: true } } } },
        chatMessages: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    });
    return deliveries.map((d) => ({
      deliveryId:  d.id,
      status:      d.status,
      otherParty:  d.courier ? { ...d.courier.user, id: d.courier.userId } : null,
      lastMessage: d.chatMessages[0] ?? null,
    }));
  }

  // ADMIN
  const deliveries = await prisma.delivery.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      sender:       { select: { id: true, fullName: true } },
      courier:      { include: { user: { select: { id: true, fullName: true } } } },
      chatMessages: { orderBy: { sentAt: 'desc' }, take: 1 },
    },
  });
  return deliveries.map((d) => ({
    deliveryId:  d.id,
    status:      d.status,
    sender:      d.sender,
    courier:     d.courier,
    lastMessage: d.chatMessages[0] ?? null,
  }));
}

export async function getMessages(deliveryId: string, userId: string) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');

  const user      = await userRepo.findById(userId);
  const isSender  = delivery.senderId === userId;
  const isCourier = delivery.courier?.userId === userId;
  const isAdmin   = user?.role === UserRole.ADMIN;
  if (!isSender && !isCourier && !isAdmin) throw new ForbiddenError('Not authorized');

  return chatRepo.findByDelivery(deliveryId);
}

export async function sendMessage(deliveryId: string, userId: string, dto: { body: string; photoUrl?: string }) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');

  const user      = await userRepo.findById(userId);
  const isSender  = delivery.senderId === userId;
  const isCourier = delivery.courier?.userId === userId;
  const isAdmin   = user?.role === UserRole.ADMIN;
  if (!isSender && !isCourier && !isAdmin) throw new ForbiddenError('Not authorized');

  const message = await chatRepo.create({
    deliveryId,
    senderId: userId,
    body:     dto.body,
    photoUrl: dto.photoUrl ?? null,
  });
  gateway?.emitMessageNew(deliveryId, message);
  return message;
}
