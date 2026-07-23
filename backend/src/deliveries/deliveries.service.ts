import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { DbService, mapRow } from '../db/db.service';
import { DeliveryStateMachineService } from './delivery-state-machine.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DeliveryGateway } from '../common/delivery.gateway';
import { CreateDeliveryDto, InterestDto } from './dto/create-delivery.dto';
import { DeliveryStatus, UserRole } from '../types';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const BROADCAST_RADIUS_KM = 0.3; // 300m
const SERVICE_FEE_RWF = 100;

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    private readonly db: DbService,
    private readonly stateMachine: DeliveryStateMachineService,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService,
    private readonly gateway: DeliveryGateway,
  ) {}

  async create(userId: string, dto: CreateDeliveryDto) {
    const trackingToken = crypto.randomBytes(20).toString('hex');

    const result = await this.db.create('deliveries', {
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
      category: dto.category,
      size: dto.size,
      estimatedValueRwf: dto.estimatedValueRwf,
      isFragile: dto.isFragile || false,
      requiresRecipientOtp: dto.requiresRecipientOtp ?? true,
      pickupContactName: dto.pickupContactName,
      pickupContactPhone: dto.pickupContactPhone,
      recipientName: dto.recipientName,
      recipientPhone: dto.recipientPhone,
      scheduledPickupAt: dto.scheduledPickupAt ? new Date(dto.scheduledPickupAt) : null,
      preferAsap: dto.preferAsap ?? true,
      paymentMethod: dto.paymentMethod || 'CASH',
      quotedPriceRwf: dto.quotedPriceRwf,
      recipientTrackingToken: trackingToken,
      status: 'DRAFT',
    });

    const { data: delivery, error } = await this.db.getClient()
      .from('deliveries')
      .select('*, sender:sender_id(id, full_name, phone)')
      .eq('id', result.id)
      .single();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');

    const mapped = mapRow(delivery);

    // Transition to BROADCAST and notify nearby couriers
    await this.broadcastToNearbyCouriers(mapped);

    return mapped;
  }

  private async broadcastToNearbyCouriers(delivery: any) {
    await this.stateMachine.transition(delivery.id, DeliveryStatus.BROADCAST, delivery.senderId);

    const sb = this.db.getClient();
    const { data: nearbyCouriers } = await sb
      .from('couriers')
      .select('id, user_id, current_lat, current_lng')
      .eq('is_online', true)
      .eq('is_approved_by_admin', true)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null);

    if (!nearbyCouriers) return;

    for (const courier of nearbyCouriers) {
      const distance = this.haversineDistance(
        delivery.pickupLat, delivery.pickupLng,
        courier.current_lat, courier.current_lng,
      );

      if (distance <= BROADCAST_RADIUS_KM) {
        this.gateway.emitJobAvailable(courier.user_id, delivery);
        try {
          const courierUser = await this.db.findOne('users', 'id', courier.user_id);
          if (courierUser?.phone) {
            await this.notifications.notifyJobAvailable(courierUser.phone, delivery.pickupAddress);
          }
        } catch {}
      }
    }
  }

  async takeJob(deliveryId: string, courierUserId: string, proposedPriceRwf?: number) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const sb = this.db.getClient();
    const { data: delivery } = await sb
      .from('deliveries')
      .update({ courier_id: courier.id, quoted_price_rwf: proposedPriceRwf || undefined })
      .eq('id', deliveryId)
      .eq('status', 'BROADCAST')
      .is('courier_id', null)
      .select('*, sender:sender_id(id, full_name, phone)')
      .single();
    if (!delivery) throw new BadRequestException('Delivery is no longer available');

    const mappedDelivery = mapRow(delivery);

    const result = await this.stateMachine.transition(deliveryId, DeliveryStatus.COURIER_ASSIGNED, courierUserId, {
      courierId: courier.id,
    });

    // Notify sender
    if (mappedDelivery.sender?.phone) {
      await this.notifications.notifyCourierAccepted(mappedDelivery.sender.phone, courier.userId || 'Courier');
    }

    // Notify delivery room via websocket
    this.gateway.emitCourierInterested(deliveryId, {
      type: 'JOB_TAKEN',
      courierId: courier.id,
    });

    return result;
  }

  async confirmAgreement(deliveryId: string, userId: string, agreedPriceRwf: number, agreedDeliveryTime?: number) {
    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== 'COURIER_ASSIGNED') throw new BadRequestException('Cannot confirm at this stage');

    const isSender = delivery.senderId === userId;
    const courier = await this.db.findOne('couriers', 'id', delivery.courierId);
    const isCourier = courier && courier.userId === userId;

    if (!isSender && !isCourier) throw new ForbiddenException('Not authorized');

    await this.db.update('deliveries', 'id', deliveryId, {
      agreedPriceRwf,
      finalPriceRwf: agreedPriceRwf,
      agreedDeliveryTime: agreedDeliveryTime || null,
    });

    const result = await this.stateMachine.transition(deliveryId, DeliveryStatus.COURIER_CONFIRMED, userId, {
      agreedPriceRwf,
      agreedDeliveryTime,
    });

    // Notify delivery room
    this.gateway.emitCourierInterested(deliveryId, {
      type: 'AGREEMENT_CONFIRMED',
      agreedPriceRwf,
      confirmedBy: isSender ? 'SENDER' : 'COURIER',
    });

    return result;
  }

  async submitPayment(deliveryId: string, senderUserId: string, agreedDeliveryTime?: number) {
    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.senderId !== senderUserId) throw new ForbiddenException('Not authorized');
    if (delivery.status !== 'COURIER_CONFIRMED') throw new BadRequestException('Payment not available at this stage');
    if (delivery.paymentStatus === 'HELD') throw new BadRequestException('Payment already submitted');

    const amount = delivery.agreedPriceRwf || delivery.finalPriceRwf || 0;
    if (amount <= 0) throw new BadRequestException('Invalid payment amount');

    const updateData: any = {
      paymentStatus: 'HELD',
      paymentHeldAt: new Date(),
    };
    if (agreedDeliveryTime !== undefined) {
      updateData.agreedDeliveryTime = agreedDeliveryTime;
    }

    await this.db.update('deliveries', 'id', deliveryId, updateData);

    // Record a debit transaction on sender's wallet
    try {
      const senderWallet = await this.db.findOne('wallets', 'userId', senderUserId);
      if (senderWallet) {
        await this.walletService.debitSender(senderUserId, amount, deliveryId);
      }
    } catch (e: any) {
      this.logger.warn(`Sender wallet debit failed (non-critical): ${e.message}`);
    }

    // Notify delivery room
    this.gateway.emitCourierInterested(deliveryId, {
      type: 'PAYMENT_HELD',
      amount,
    });

    // Notify courier that payment is secured
    try {
      const courierProfile = await this.db.findOne('couriers', 'id', delivery.courierId);
      if (courierProfile?.phone) {
        await this.notifications.notifyMoneyReceived(courierProfile.phone, amount);
      }
    } catch {}

    return { success: true, amount, held: true };
  }

  async startDelivery(deliveryId: string, courierUserId: string) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'COURIER_CONFIRMED') throw new BadRequestException('Cannot start delivery yet');
    if (delivery.paymentStatus !== 'HELD') throw new BadRequestException('Payment has not been confirmed yet. Please wait for the sender to complete payment.');

    const pickupOtp = crypto.randomInt(100000, 999999).toString();
    const pickupOtpHash = await bcrypt.hash(pickupOtp, 10);

    await this.db.update('deliveries', 'id', deliveryId, {
      pickupOtpHash,
      deliveryStartedAt: new Date(),
    });

    const result = await this.stateMachine.transition(deliveryId, DeliveryStatus.PICKUP_EN_ROUTE, courierUserId, {
      pickupOtp,
    });

    // Notify sender
    const senderUser = await this.db.findOne('users', 'id', delivery.senderId);
    if (senderUser?.phone) {
      await this.notifications.notifyDeliveryStarted(senderUser.phone);
    }

    return { ...result, pickupOtp };
  }

  async arrivedAtPickup(deliveryId: string, courierUserId: string, otp: string) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'PICKUP_EN_ROUTE') throw new BadRequestException('Invalid status');

    if (delivery.pickupOtpHash) {
      const isValid = await bcrypt.compare(otp, delivery.pickupOtpHash);
      if (!isValid) throw new BadRequestException('Invalid pickup OTP');
    }

    await this.db.update('deliveries', 'id', deliveryId, {
      courierArrivedAt: new Date(),
    });

    return this.stateMachine.transition(deliveryId, DeliveryStatus.ARRIVED_PICKUP, courierUserId);
  }

  async pickedUp(deliveryId: string, courierUserId: string) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'ARRIVED_PICKUP') throw new BadRequestException('Invalid status');

    return this.stateMachine.transition(deliveryId, DeliveryStatus.PICKED_UP, courierUserId);
  }

  async inTransit(deliveryId: string, courierUserId: string) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');
    if (delivery.status !== 'PICKED_UP') throw new BadRequestException('Invalid status');

    return this.stateMachine.transition(deliveryId, DeliveryStatus.IN_TRANSIT, courierUserId);
  }

  async courierArrived(deliveryId: string, courierUserId: string) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');

    if (delivery.status !== 'IN_TRANSIT') {
      throw new BadRequestException('Cannot mark arrived at this stage');
    }

    // Generate dropoff OTP
    const dropoffOtp = crypto.randomInt(100000, 999999).toString();
    const dropoffOtpHash = await bcrypt.hash(dropoffOtp, 10);

    await this.db.update('deliveries', 'id', deliveryId, {
      dropoffOtpHash,
      dropoffOtpSentAt: new Date(),
    });

    // Send OTP to recipient via all channels
    await this.notifications.sendOtp(
      delivery.recipientPhone,
      dropoffOtp,
      delivery.dropoffEmail || undefined,
    );

    const result = await this.stateMachine.transition(deliveryId, DeliveryStatus.ARRIVED_DROPOFF, courierUserId, {
      dropoffOtp,
    });

    return { ...result, dropoffOtp };
  }

  async completeDelivery(deliveryId: string, courierUserId: string, otp?: string) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.courierId !== courier.id) throw new ForbiddenException('Not your delivery');

    if (delivery.status !== 'ARRIVED_DROPOFF') {
      throw new BadRequestException('Delivery is not at drop-off arrival stage');
    }

    // Generate dropoff OTP if not already generated
    let dropoffOtp: string | undefined;
    if (delivery.requiresRecipientOtp && !delivery.dropoffOtpHash) {
      dropoffOtp = crypto.randomInt(100000, 999999).toString();
      const dropoffOtpHash = await bcrypt.hash(dropoffOtp, 10);
      await this.db.update('deliveries', 'id', deliveryId, { dropoffOtpHash, dropoffOtpSentAt: new Date() });

      // Send OTP to recipient via all channels
      await this.notifications.sendOtp(
        delivery.recipientPhone,
        dropoffOtp,
        delivery.dropoffEmail || undefined,
      );
    }

    if (delivery.requiresRecipientOtp && delivery.dropoffOtpHash) {
      if (!otp) throw new BadRequestException('Recipient OTP required');
      const isValid = await bcrypt.compare(otp, delivery.dropoffOtpHash);
      if (!isValid) throw new BadRequestException('Invalid drop-off OTP');
    }

    const finalPrice = delivery.agreedPriceRwf || delivery.finalPriceRwf || delivery.quotedPriceRwf || 0;

    await this.stateMachine.transition(deliveryId, DeliveryStatus.DELIVERED, courierUserId);

    // Release payment from escrow
    await this.db.update('deliveries', 'id', deliveryId, {
      paymentStatus: 'RELEASED',
      paymentReleasedAt: new Date(),
      otpVerifiedAt: new Date(),
    });

    // Credit courier wallet (minus service fee)
    if (finalPrice > 0) {
      await this.walletService.creditCourier(courierUserId, finalPrice, deliveryId);
    }

    // Update courier stats
    await this.db.getClient()
      .from('couriers')
      .update({
        total_deliveries: (courier.totalDeliveries || 0) + 1,
        total_earnings: (courier.totalEarnings || 0) + finalPrice,
      })
      .eq('id', courier.id);

    // Notify sender about completion
    const senderUser = await this.db.findOne('users', 'id', delivery.senderId);
    if (senderUser?.phone) {
      await this.notifications.notifyDeliveryCompleted(senderUser.phone, courier.userId || 'Courier');
    }

    return { delivered: true, finalPrice, fee: SERVICE_FEE_RWF, netAmount: finalPrice - SERVICE_FEE_RWF };
  }

  async createRating(deliveryId: string, giverUserId: string, stars: number, comment?: string) {
    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== 'DELIVERED') throw new BadRequestException('Can only rate completed deliveries');

    const isSender = delivery.senderId === giverUserId;
    const courier = await this.db.findOne('couriers', 'id', delivery.courierId);
    const isCourier = courier && courier.userId === giverUserId;

    if (!isSender && !isCourier) throw new ForbiddenException('Not authorized');

    const receiverUserId = isSender ? (courier?.userId || delivery.courierId) : delivery.senderId;

    const existing = await this.db.getClient()
      .from('ratings')
      .select('id')
      .eq('delivery_id', deliveryId)
      .maybeSingle();

    if (existing?.data) throw new BadRequestException('Already rated this delivery');

    const sb = this.db.getClient();
    const { data, error } = await sb
      .from('ratings')
      .insert({
        delivery_id: deliveryId,
        giver_id: giverUserId,
        receiver_id: receiverUserId,
        stars,
        comment,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message || 'Failed to create rating');

    return data;
  }

  async findAll(userId: string, role: UserRole) {
    const sb = this.db.getClient();
    let query = sb
      .from('deliveries')
      .select('*, sender:sender_id(id, full_name, phone), courier:courier_id(id, user:user_id(full_name, phone))')
      .order('created_at', { ascending: false });

    if (role === UserRole.SENDER) {
      query = query.eq('sender_id', userId);
    } else if (role === UserRole.COURIER) {
      const courier = await this.db.findOne('couriers', 'userId', userId);
      if (courier) query = query.eq('courier_id', courier.id);
      else query = query.eq('id', 'no-results');
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return data ? mapRow(data) : data;
  }

  async findOne(id: string, userId?: string) {
    const { data: delivery, error } = await this.db.getClient()
      .from('deliveries')
      .select(`
        *,
        sender:sender_id(id, full_name, phone, email),
        courier:courier_id(
          id,
          verification_tier,
          avg_rating,
          total_deliveries,
          motorcycle_plate,
          momo_number,
          momo_provider,
          user:user_id(id, full_name, phone, profile_photo_url)
        ),
        events:delivery_events(*),
        chatMessages:chat_messages(
          *,
          sender:sender_id(id, full_name)
        ),
        dispute:disputes(*),
        rating:ratings(*)
      `)
      .eq('id', id)
      .order('occurred_at', { foreignTable: 'delivery_events', ascending: true })
      .order('sent_at', { foreignTable: 'chat_messages', ascending: true })
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');

    if (!delivery) throw new NotFoundException('Delivery not found');

    return mapRow(delivery);
  }

  async cancel(id: string, userId: string) {
    const delivery = await this.db.findOne('deliveries', 'id', id);
    if (!delivery) throw new NotFoundException('Delivery not found');

    if (delivery.senderId !== userId) {
      const user = await this.db.findOne('users', 'id', userId);
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Not authorized to cancel this delivery');
      }
    }

    if (!this.stateMachine.canCancel(delivery.status)) {
      throw new BadRequestException('Cannot cancel delivery at current status. Please raise a dispute instead.');
    }

    return this.stateMachine.transition(id, DeliveryStatus.CANCELLED, userId);
  }

  async getAvailable(courierUserId: string) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const { data, error } = await this.db.getClient()
      .from('deliveries')
      .select('*, sender:sender_id(id, full_name)')
      .eq('status', 'BROADCAST')
      .is('courier_id', null)
      .order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return mapRow(data);
  }

  async getNearbyAvailable(courierUserId: string) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');
    if (!courier.currentLat || !courier.currentLng) {
      return this.getAvailable(courierUserId);
    }

    const allAvailable = await this.getAvailable(courierUserId);
    const nearby = allAvailable.filter((d: any) => {
      const distance = this.haversineDistance(
        courier.currentLat, courier.currentLng,
        d.pickupLat, d.pickupLng,
      );
      return distance <= BROADCAST_RADIUS_KM;
    });

    return nearby;
  }

  async expressInterest(deliveryId: string, courierUserId: string, dto: InterestDto) {
    const courier = await this.db.findOne('couriers', 'userId', courierUserId);
    if (!courier) throw new NotFoundException('Courier profile not found');

    const delivery = await this.db.findOne('deliveries', 'id', deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== 'BROADCAST') throw new BadRequestException('Delivery is not accepting interest');

    const { data: existing } = await this.db.getClient()
      .from('courier_interests')
      .select('id')
      .eq('delivery_id', deliveryId)
      .eq('courier_id', courier.id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await this.db.getClient()
        .from('courier_interests')
        .update({ proposed_price_rwf: dto.proposedPriceRwf, eta_minutes: dto.etaMinutes })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
      return mapRow(data);
    }

    const { data, error } = await this.db.getClient()
      .from('courier_interests')
      .insert({ delivery_id: deliveryId, courier_id: courier.id, proposed_price_rwf: dto.proposedPriceRwf, eta_minutes: dto.etaMinutes })
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return mapRow(data);
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
