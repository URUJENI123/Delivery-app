import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../db/prisma.service';
import { DeliveryStateMachineService } from '../deliveries/delivery-state-machine.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

const SERVICE_FEE_RWF = 100;

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: DeliveryStateMachineService,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService,
  ) {}

  async getByToken(token: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { recipientTrackingToken: token },
      include: {
        sender: { select: { id: true, fullName: true, phone: true } },
        courier: {
          include: {
            user: { select: { fullName: true, phone: true, profilePhotoUrl: true } },
          },
        },
        events: { orderBy: { occurredAt: 'asc' }, take: 20 },
      },
    });

    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  async confirmDropoffOtp(token: string, otp: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { recipientTrackingToken: token },
    });
    if (!delivery) throw new NotFoundException('Delivery not found');

    if (delivery.status !== 'ARRIVED_DROPOFF') {
      throw new BadRequestException('Courier has not arrived at drop-off yet');
    }

    if (!delivery.dropoffOtpHash) {
      throw new BadRequestException('No drop-off OTP set');
    }

    const isValid = await bcrypt.compare(otp, delivery.dropoffOtpHash);
    if (!isValid) throw new BadRequestException('Invalid OTP');

    await this.stateMachine.transition(delivery.id, 'DELIVERED' as any, undefined, { otpVerified: true });

    const finalPrice = delivery.agreedPriceRwf || delivery.finalPriceRwf || delivery.quotedPriceRwf || 0;

    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        paymentStatus:    'RELEASED',
        paymentReleasedAt: new Date(),
        otpVerifiedAt:    new Date(),
      },
    });

    // Credit courier wallet
    if (finalPrice > 0 && delivery.courierId) {
      const courier = await this.prisma.courier.findUnique({
        where: { id: delivery.courierId },
        select: { userId: true, totalDeliveries: true, totalEarnings: true },
      });
      if (courier) {
        await this.walletService.creditCourier(courier.userId, finalPrice, delivery.id);
        await this.prisma.courier.update({
          where: { id: delivery.courierId },
          data: {
            totalDeliveries: { increment: 1 },
            totalEarnings:   { increment: finalPrice },
          },
        });
      }
    }

    // Notify sender
    const sender = await this.prisma.user.findUnique({
      where: { id: delivery.senderId },
      select: { phone: true },
    });
    if (sender?.phone) {
      try { await this.notifications.notifyDeliveryCompleted(sender.phone, 'Courier'); } catch (e) {
        this.logger.warn(`Failed to notify sender: ${e}`);
      }
    }

    return {
      ...delivery,
      delivered: true,
      finalPrice,
      fee: SERVICE_FEE_RWF,
      netAmount: finalPrice - SERVICE_FEE_RWF,
    };
  }
}
