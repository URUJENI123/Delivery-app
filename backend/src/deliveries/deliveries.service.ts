import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../db/prisma.service';
import { DeliveryStateMachineService } from './delivery-state-machine.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DeliveryGateway } from '../common/delivery.gateway';
import { CreateDeliveryDto, InterestDto } from './dto/create-delivery.dto';
import { DeliveryStatus, UserRole } from '../types';

const BROADCAST_RADIUS_KM = 0.3; // 300 m
const SERVICE_FEE_RWF = 100;

/** Full Prisma include shape for delivery detail */
const DELIVERY_DETAIL_INCLUDE = {
  sender: { select: { id: true, fullName: true, phone: true, email: true } },
  courier: {
    include: {
      user: { select: { id: true, fullName: true, phone: true, profilePhotoUrl: true } },
    },
  },
  events: { orderBy: { occurredAt: 'asc' as const } },
  chatMessages: {
    orderBy: { sentAt: 'asc' as const },
    include: { sender: { select: { id: true, fullName: true } } },
  },
  dispute: true,
  rating: true,
} as const;

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: DeliveryStateMachineService,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService,
    private readonly gateway: DeliveryGateway,
  ) {}

  // ─── Create & broadcast ────────────────────────────────────────────────────

  async create(userId: string, dto: CreateDeliveryDto) {
    const trackingToken = crypto.randomBytes(20).toString('hex');

    const delivery = await this.prisma.delivery.create({
      data: {
        senderId: userId,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        pickupNotes: dto.pickupNotes,
        pickupEmail: dto.pickupEmail,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        dropoffNotes: dto.dropoffNotes,
        dropoffEmail: dto.dropoffEmail,
        itemDescription: dto.itemDescription,
        category: dto.category as any,
        size: dto.size as any,
        estimatedValueRwf: dto.estimatedValueRwf,
        isFragile: dto.isFragile ?? false,
        requiresRecipientOtp: dto.requiresRecipientOtp ?? true,
        pickupContactName: dto.pickupContactName,
        pickupContactPhone: dto.pickupContactPhone,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        scheduledPickupAt: dto.scheduledPickupAt ? new Date(dto.scheduledPickupAt) : null,
        preferAsap: dto.preferAsap ?? true,
        paymentMethod: (dto.paymentMethod as any) || 'CASH',
        quotedPriceRwf: dto.quotedPriceRwf,
        recipientTrackingToken: trackingToken,
        status: 'DRAFT',
      },
      include: { sender: { select: { id: true, fullName: true, phone: true } } },
    });

    await this.broadcastToNearbyCouriers(delivery);
    return delivery;
  }

  private async broadcastToNearbyCouriers(delivery: any) {
    await this.stateMachine.transition(delivery.id, DeliveryStatus.BROADCAST, delivery.senderId);

    const couriers = await this.prisma.courier.findMany({
      where: {
        isOnline: true,
        isApprovedByAdmin: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      select: { id: true, userId: true, currentLat: true, currentLng: true },
    });

    for (const courier of couriers) {
      const distance = this.haversineDistance(
        delivery.pickupLat, delivery.pickupLng,
        courier.currentLat!, courier.currentLng!,
      );
      if (distance <= BROADCAST_RADIUS_KM) {
        this.gateway.emitJobAvailable(courier.userId, delivery);
        try {
          const user = await this.prisma.user.findUnique({ where: { id: courier.userId }, select: { phone: true } });
          if (user?.phone) await this.notifications.notifyJobAvailable(user.phone, delivery.pickupAddress);
        } catch { /* non-critical */ }
      }
    }
  }

  // ─── Take job ──────────────────────────────────────────────────────────────

  async takeJob(deliveryId: string, courierUserId: string, proposedPriceRwf?: number) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    // Atomic: only succeeds if status is BROADCAST and courierId is null
    const delivery = await this.prisma.delivery.updateMany({
      where: { id: deliveryId, status: 'BROADCAST', courierId: null },
      data: {
        courierId: courier.id,
        ...(proposedPriceRwf ? { quotedPriceRwf: proposedPriceRwf } : {}),
      },
    });
    if (delivery.count === 0) throw new BadRequestException('Delivery is no longer available');

    const updated = await this.stateMachine.transition(deliveryId, DeliveryStatus.COURIER_ASSIGNED, courierUserId, {
      courierId: courier.id,
    });

    // Notify sender
    const full = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { sender: { select: { phone: true } } },
    });
    if (full?.sender?.phone) {
      await this.notifications.notifyCourierAccepted(full.sender.phone, 'Courier');
    }

    this.gateway.emitCourierInterested(deliveryId, { type: 'JOB_TAKEN', courierId: courier.id });
    return updated;
  }

  // ─── Confirm agreement ─────────────────────────────────────────────────────

  async confirmAgreement(deliveryId: string, userId: string, agreedPriceRwf: number, agreedDeliveryTime?: number) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== 'COURIER_ASSIGNED') throw new BadRequestException('Cannot confirm at this stage');

    const isSender = delivery.senderId === userId;
    const courier = delivery.courierId
      ? await this.prisma.courier.findUnique({ where: { id: delivery.courierId } })
      : null;
    const isCourier = courier?.userId === userId;
    if (!isSender && !isCourier) throw new ForbiddenException('Not authorized');

    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        agreedPriceRwf,
        finalPriceRwf: agreedPriceRwf,
        agreedDeliveryTime: agreedDeliveryTime ?? null,
      },
    });

    const result = await this.stateMachine.transition(deliveryId, DeliveryStatus.COURIER_CONFIRMED, userId, {
      agreedPriceRwf,
      agreedDeliveryTime,
    });

    this.gateway.emitCourierInterested(deliveryId, {
      type: 'AGREEMENT_CONFIRMED',
      agreedPriceRwf,
      confirmedBy: isSender ? 'SENDER' : 'COURIER',
    });

    return result;
  }

  // ─── Payment ───────────────────────────────────────────────────────────────

  async submitPayment(deliveryId: string, senderUserId: string, agreedDeliveryTime?: number) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.senderId !== senderUserId) throw new ForbiddenException('Not authorized');
    if (delivery.status !== 'COURIER_CONFIRMED') throw new BadRequestException('Payment not available at this stage');
    if (delivery.paymentStatus === 'HELD') throw new BadRequestException('Payment already submitted');

    const amount = delivery.agreedPriceRwf || delivery.finalPriceRwf || 0;
    if (!amount || amount <= 0) throw new BadRequestException('Invalid payment amount');

    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        paymentStatus: 'HELD',
        paymentHeldAt: new Date(),
        ...(agreedDeliveryTime !== undefined ? { agreedDeliveryTime } : {}),
      },
    });

    try {
      await this.walletService.debitSender(senderUserId, amount, deliveryId);
    } catch (e: any) {
      this.logger.warn(`Sender wallet debit failed (non-critical): ${e.message}`);
    }

    this.gateway.emitCourierInterested(deliveryId, { type: 'PAYMENT_HELD', amount });

    // Notify courier
    if (delivery.courierId) {
      const courierUser = await this.prisma.courier.findUnique({
        where: { id: delivery.courierId },
        include: { user: { select: { phone: true } } },
      });
      if (courierUser?.user?.phone) {
        try { await this.notifications.notifyMoneyReceived(courierUser.user.phone, amount); } catch { /* ignore */ }
      }
    }

    return { success: true, amount, held: true };
  }

  // ─── Start delivery ────────────────────────────────────────────────────────

  async startDelivery(deliveryId: string, courierUserId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'COURIER_CONFIRMED') throw new BadRequestException('Cannot start delivery yet');
    if (delivery.paymentStatus !== 'HELD') throw new BadRequestException('Payment has not been confirmed yet.');

    const pickupOtp = crypto.randomInt(100000, 999999).toString();
    const pickupOtpHash = await bcrypt.hash(pickupOtp, 10);

    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { pickupOtpHash, deliveryStartedAt: new Date() },
    });

    const result = await this.stateMachine.transition(deliveryId, DeliveryStatus.PICKUP_EN_ROUTE, courierUserId);

    const senderUser = await this.prisma.user.findUnique({
      where: { id: delivery.senderId },
      select: { phone: true },
    });
    if (senderUser?.phone) await this.notifications.notifyDeliveryStarted(senderUser.phone);

    return { ...result, pickupOtp };
  }

  // ─── Arrived at pickup ─────────────────────────────────────────────────────

  async arrivedAtPickup(deliveryId: string, courierUserId: string, otp: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'PICKUP_EN_ROUTE') throw new BadRequestException('Invalid status');

    if (delivery.pickupOtpHash) {
      const isValid = await bcrypt.compare(otp, delivery.pickupOtpHash);
      if (!isValid) throw new BadRequestException('Invalid pickup OTP');
    }

    await this.prisma.delivery.update({ where: { id: deliveryId }, data: { courierArrivedAt: new Date() } });
    return this.stateMachine.transition(deliveryId, DeliveryStatus.ARRIVED_PICKUP, courierUserId);
  }

  // ─── Picked up ─────────────────────────────────────────────────────────────

  async pickedUp(deliveryId: string, courierUserId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'ARRIVED_PICKUP') throw new BadRequestException('Invalid status');

    return this.stateMachine.transition(deliveryId, DeliveryStatus.PICKED_UP, courierUserId);
  }

  // ─── In transit ────────────────────────────────────────────────────────────

  async inTransit(deliveryId: string, courierUserId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'PICKED_UP') throw new BadRequestException('Invalid status');

    return this.stateMachine.transition(deliveryId, DeliveryStatus.IN_TRANSIT, courierUserId);
  }

  // ─── Arrived at dropoff ────────────────────────────────────────────────────

  async courierArrived(deliveryId: string, courierUserId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'IN_TRANSIT') throw new BadRequestException('Cannot mark arrived at this stage');

    const dropoffOtp = crypto.randomInt(100000, 999999).toString();
    const dropoffOtpHash = await bcrypt.hash(dropoffOtp, 10);

    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { dropoffOtpHash, dropoffOtpSentAt: new Date() },
    });

    await this.notifications.sendOtp(delivery.recipientPhone, dropoffOtp, delivery.dropoffEmail ?? undefined);

    const result = await this.stateMachine.transition(deliveryId, DeliveryStatus.ARRIVED_DROPOFF, courierUserId);
    return { ...result, dropoffOtp };
  }

  // ─── Complete delivery ─────────────────────────────────────────────────────

  async completeDelivery(deliveryId: string, courierUserId: string, otp?: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'ARRIVED_DROPOFF') throw new BadRequestException('Delivery is not at drop-off stage');

    // Generate OTP if missing
    if (delivery.requiresRecipientOtp && !delivery.dropoffOtpHash) {
      const dropoffOtp = crypto.randomInt(100000, 999999).toString();
      const dropoffOtpHash = await bcrypt.hash(dropoffOtp, 10);
      await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { dropoffOtpHash, dropoffOtpSentAt: new Date() },
      });
      await this.notifications.sendOtp(delivery.recipientPhone, dropoffOtp, delivery.dropoffEmail ?? undefined);
    }

    if (delivery.requiresRecipientOtp) {
      // Recipient may have already verified via the public tracking link
      const freshDelivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
      const alreadyVerified = !!freshDelivery!.otpVerifiedAt;

      if (!alreadyVerified) {
        if (!otp) throw new BadRequestException('Recipient OTP required');
        const isValid = await bcrypt.compare(otp, freshDelivery!.dropoffOtpHash!);
        if (!isValid) throw new BadRequestException('Invalid drop-off OTP');
      }
    }

    const finalPrice = delivery.agreedPriceRwf || delivery.finalPriceRwf || delivery.quotedPriceRwf || 0;

    await this.stateMachine.transition(deliveryId, DeliveryStatus.DELIVERED, courierUserId);

    // Release escrow + credit courier wallet
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { paymentStatus: 'RELEASED', paymentReleasedAt: new Date(), otpVerifiedAt: new Date() },
    });

    if (finalPrice > 0) await this.walletService.creditCourier(courierUserId, finalPrice, deliveryId);

    // Update courier stats
    await this.prisma.courier.update({
      where: { id: courier.id },
      data: {
        totalDeliveries: { increment: 1 },
        totalEarnings: { increment: finalPrice },
      },
    });

    // Notify sender
    const senderUser = await this.prisma.user.findUnique({
      where: { id: delivery.senderId },
      select: { phone: true },
    });
    if (senderUser?.phone) {
      await this.notifications.notifyDeliveryCompleted(senderUser.phone, 'Courier');
    }

    return { delivered: true, finalPrice, fee: SERVICE_FEE_RWF, netAmount: finalPrice - SERVICE_FEE_RWF };
  }

  // ─── Rating ────────────────────────────────────────────────────────────────

  async createRating(deliveryId: string, giverUserId: string, stars: number, comment?: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== 'DELIVERED') throw new BadRequestException('Can only rate completed deliveries');

    const isSender = delivery.senderId === giverUserId;
    const courier = delivery.courierId
      ? await this.prisma.courier.findUnique({ where: { id: delivery.courierId } })
      : null;
    const isCourier = courier?.userId === giverUserId;
    if (!isSender && !isCourier) throw new ForbiddenException('Not authorized');

    const existing = await this.prisma.rating.findUnique({ where: { deliveryId } });
    if (existing) throw new BadRequestException('Already rated this delivery');

    const receiverUserId = isSender ? (courier?.userId ?? delivery.courierId!) : delivery.senderId;

    return this.prisma.rating.create({
      data: { deliveryId, giverId: giverUserId, receiverId: receiverUserId, stars, comment },
    });
  }

  // ─── List / find ───────────────────────────────────────────────────────────

  async findAll(userId: string, role: UserRole) {
    const where: any = {};
    if (role === UserRole.SENDER) {
      where.senderId = userId;
    } else if (role === UserRole.COURIER) {
      const courier = await this.prisma.courier.findUnique({ where: { userId } });
      where.courierId = courier?.id ?? 'no-results';
    }

    return this.prisma.delivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, fullName: true, phone: true } },
        courier: { include: { user: { select: { fullName: true, phone: true } } } },
      },
    });
  }

  async findOne(id: string, _userId?: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: DELIVERY_DETAIL_INCLUDE,
    });
    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  async cancel(id: string, userId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    if (delivery.senderId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== UserRole.ADMIN) throw new ForbiddenException('Not authorized to cancel');
    }

    if (!this.stateMachine.canCancel(delivery.status as DeliveryStatus)) {
      throw new BadRequestException('Cannot cancel at current status. Please raise a dispute instead.');
    }

    return this.stateMachine.transition(id, DeliveryStatus.CANCELLED, userId);
  }

  async getAvailable(courierUserId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    return this.prisma.delivery.findMany({
      where: { status: 'BROADCAST', courierId: null },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, fullName: true } } },
    });
  }

  async getNearbyAvailable(courierUserId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');
    if (!courier.currentLat || !courier.currentLng) return this.getAvailable(courierUserId);

    const available = await this.getAvailable(courierUserId);
    return available.filter((d: any) => {
      const dist = this.haversineDistance(
        courier.currentLat!, courier.currentLng!,
        d.pickupLat, d.pickupLng,
      );
      return dist <= BROADCAST_RADIUS_KM;
    });
  }

  async expressInterest(deliveryId: string, courierUserId: string, dto: InterestDto) {
    const courier = await this.prisma.courier.findUnique({ where: { userId: courierUserId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== 'BROADCAST') throw new BadRequestException('Delivery is not accepting interest');

    return this.prisma.courierInterest.upsert({
      where: { deliveryId_courierId: { deliveryId, courierId: courier.id } },
      create: { deliveryId, courierId: courier.id, proposedPriceRwf: dto.proposedPriceRwf, etaMinutes: dto.etaMinutes },
      update: { proposedPriceRwf: dto.proposedPriceRwf, etaMinutes: dto.etaMinutes },
    });
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
