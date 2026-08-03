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

  /**
   * Recipient-side OTP confirmation via the public tracking link.
   *
   * This validates the OTP and marks otpVerifiedAt, but does NOT move the delivery
   * to DELIVERED or credit the courier wallet. The courier's authenticated
   * POST /deliveries/:id/complete endpoint is the single source of truth for
   * completing the delivery and releasing escrow, preventing double-payment.
   */
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

    // Mark OTP as verified — courier's /complete endpoint will finalize the delivery
    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { otpVerifiedAt: new Date() },
    });

    return {
      verified: true,
      message: 'OTP confirmed. The courier will complete the delivery shortly.',
    };
  }
}
