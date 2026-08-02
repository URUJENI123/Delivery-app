import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { DeliveryGateway } from '../common/delivery.gateway';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: DeliveryGateway,
  ) {}

  async getConversations(userId: string) {
    // Determine if user is a courier
    const courier = await this.prisma.courier.findUnique({ where: { userId }, select: { id: true } });

    const deliveries = await this.prisma.delivery.findMany({
      where: courier ? { courierId: courier.id } : { senderId: userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        pickupAddress: true,
        dropoffAddress: true,
        trackingCode: true,
        courier: {
          select: { user: { select: { id: true, fullName: true, phone: true, profilePhotoUrl: true } } },
        },
        sender: { select: { id: true, fullName: true, phone: true, profilePhotoUrl: true } },
      },
    });

    const conversations = await Promise.all(
      deliveries.map(async (delivery) => {
        const otherParty = courier ? delivery.sender : delivery.courier?.user;
        if (!otherParty) return null;

        const [lastMsg, unreadCount] = await Promise.all([
          this.prisma.chatMessage.findFirst({
            where: { deliveryId: delivery.id },
            orderBy: { sentAt: 'desc' },
            select: { body: true, sentAt: true, senderId: true },
          }),
          this.prisma.chatMessage.count({
            where: { deliveryId: delivery.id, senderId: { not: userId }, readAt: null },
          }),
        ]);

        return {
          deliveryId: delivery.id,
          trackingCode: delivery.trackingCode,
          pickupAddress: delivery.pickupAddress,
          dropoffAddress: delivery.dropoffAddress,
          status: delivery.status,
          otherParty: {
            id: otherParty.id,
            fullName: otherParty.fullName || otherParty.phone || 'Unknown',
            phone: otherParty.phone,
            profilePhotoUrl: (otherParty as any).profilePhotoUrl ?? null,
          },
          lastMessage:         lastMsg?.body         ?? null,
          lastMessageAt:       lastMsg?.sentAt        ?? null,
          lastMessageSenderId: lastMsg?.senderId      ?? null,
          unreadCount,
        };
      }),
    );

    return conversations.filter(Boolean);
  }

  async getMessages(deliveryId: string, userId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { courier: { select: { userId: true } } },
    });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const isSender  = delivery.senderId === userId;
    const isCourier = delivery.courier?.userId === userId;

    if (!isSender && !isCourier) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role !== 'ADMIN') throw new ForbiddenException('Not authorized to view these messages');
    }

    return this.prisma.chatMessage.findMany({
      where: { deliveryId },
      orderBy: { sentAt: 'asc' },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
    });
  }

  async sendMessage(deliveryId: string, userId: string, dto: SendMessageDto) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { courier: { select: { userId: true } } },
    });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const isSender  = delivery.senderId === userId;
    const isCourier = delivery.courier?.userId === userId;
    if (!isSender && !isCourier) throw new ForbiddenException('Not authorized to send messages');

    const message = await this.prisma.chatMessage.create({
      data: { deliveryId, senderId: userId, body: dto.body, photoUrl: dto.photoUrl },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
    });

    this.gateway.emitMessageNew(deliveryId, message);
    return message;
  }
}
