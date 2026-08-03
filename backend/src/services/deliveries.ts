import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as deliveryRepo   from '../repositories/delivery.repository';
import * as courierRepo    from '../repositories/courier.repository';
import * as userRepo       from '../repositories/user.repository';
import * as walletSvc      from './wallet';
import * as notifications  from './notifications';
import * as stateMachine   from './stateMachine';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';
import { DeliveryStatus, UserRole } from '../types';
import type { DeliveryGateway } from '../lib/socket';

let gateway: DeliveryGateway | null = null;
export function setGateway(gw: DeliveryGateway) { gateway = gw; }

const BROADCAST_RADIUS_KM = 0.3;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Create & broadcast ───────────────────────────────────────────────────────

export async function create(userId: string, dto: Record<string, unknown>) {
  const trackingToken = crypto.randomBytes(20).toString('hex');
  const delivery = await deliveryRepo.create({
    ...(dto as any),
    sender:                 { connect: { id: userId } },
    recipientTrackingToken: trackingToken,
    status:                 DeliveryStatus.DRAFT,
  });
  broadcastToNearbyCouriers(delivery).catch((e) => console.error('[broadcast]', e));
  return delivery;
}

async function broadcastToNearbyCouriers(delivery: any) {
  await stateMachine.transition(delivery.id, DeliveryStatus.BROADCAST);
  const couriers = await courierRepo.findOnline();
  for (const c of couriers) {
    if (
      c.currentLat !== null && c.currentLng !== null &&
      haversineKm(delivery.pickupLat, delivery.pickupLng, c.currentLat!, c.currentLng!) <= BROADCAST_RADIUS_KM
    ) {
      gateway?.emitJobAvailable(c.userId, delivery);
      notifications.notifyJobAvailable(c.user?.phone ?? '', delivery.pickupAddress).catch(() => {});
    }
  }
}

// ─── Take job ─────────────────────────────────────────────────────────────────

export async function takeJob(deliveryId: string, courierUserId: string, proposedPriceRwf?: number) {
  const courier = await courierRepo.findByUserId(courierUserId);
  if (!courier) throw new NotFoundError('Courier profile not found');

  const count = await deliveryRepo.updateMany(
    { id: deliveryId, status: DeliveryStatus.BROADCAST, courierId: null },
    { courierId: courier.id, ...(proposedPriceRwf ? { quotedPriceRwf: proposedPriceRwf } : {}) } as any,
  );
  if (count.count === 0) throw new BadRequestError('Job is no longer available');

  const updated = await stateMachine.transition(deliveryId, DeliveryStatus.COURIER_ASSIGNED, courierUserId);
  const delivery = await deliveryRepo.findById(deliveryId);
  if (delivery?.sender?.phone) {
    notifications.notifyCourierAccepted(delivery.sender.phone, courier.user?.fullName ?? 'Courier').catch(() => {});
  }
  gateway?.emitCourierInterested(deliveryId, { type: 'JOB_TAKEN', courierId: courier.id });
  return updated;
}

// ─── Confirm agreement ────────────────────────────────────────────────────────

export async function confirmAgreement(deliveryId: string, userId: string, agreedPriceRwf: number, agreedDeliveryTime?: number) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');

  const isSender  = delivery.senderId === userId;
  const isCourier = delivery.courier?.userId === userId;
  if (!isSender && !isCourier) throw new ForbiddenError('Not authorized');

  await deliveryRepo.update(deliveryId, { agreedPriceRwf, finalPriceRwf: agreedPriceRwf, agreedDeliveryTime: agreedDeliveryTime ?? null });
  const updated = await stateMachine.transition(deliveryId, DeliveryStatus.COURIER_CONFIRMED, userId);
  gateway?.emitCourierInterested(deliveryId, { type: 'AGREEMENT_CONFIRMED', agreedPriceRwf });
  return updated;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export async function submitPayment(deliveryId: string, senderUserId: string, agreedDeliveryTime?: number) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');
  if (delivery.senderId !== senderUserId) throw new ForbiddenError('Not your delivery');
  if (delivery.paymentStatus === 'HELD') throw new BadRequestError('Payment already submitted');

  await deliveryRepo.update(deliveryId, {
    paymentStatus: 'HELD',
    paymentHeldAt: new Date(),
    ...(agreedDeliveryTime !== undefined ? { agreedDeliveryTime } : {}),
  });
  walletSvc.debitSender(senderUserId, delivery.agreedPriceRwf ?? 0, deliveryId).catch((e) =>
    console.warn('[submitPayment] debitSender non-fatal:', e.message),
  );
  gateway?.emitCourierInterested(deliveryId, { type: 'PAYMENT_HELD' });
  return { success: true, amount: delivery.agreedPriceRwf, held: true };
}

// ─── Start delivery ───────────────────────────────────────────────────────────

export async function startDelivery(deliveryId: string, courierUserId: string) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');
  if (delivery.courier?.userId !== courierUserId) throw new ForbiddenError('Not your delivery');
  if (delivery.paymentStatus !== 'HELD') throw new BadRequestError('Payment not held');

  const pickupOtp     = Math.floor(100000 + Math.random() * 900000).toString();
  const pickupOtpHash = await bcrypt.hash(pickupOtp, 10);

  await deliveryRepo.update(deliveryId, { pickupOtpHash, deliveryStartedAt: new Date() });
  await stateMachine.transition(deliveryId, DeliveryStatus.PICKUP_EN_ROUTE, courierUserId);

  const sender = await userRepo.findById(delivery.senderId);
  if (sender?.phone) notifications.notifyDeliveryStarted(sender.phone).catch(() => {});
  gateway?.emitDeliveryStatus(deliveryId, { status: DeliveryStatus.PICKUP_EN_ROUTE });

  return { pickupOtp };
}

// ─── Arrived at pickup ────────────────────────────────────────────────────────

export async function arrivedAtPickup(deliveryId: string, courierUserId: string, otp: string) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');
  if (delivery.courier?.userId !== courierUserId) throw new ForbiddenError('Not your delivery');
  if (!delivery.pickupOtpHash) throw new BadRequestError('Pickup OTP not set');

  const valid = await bcrypt.compare(otp, delivery.pickupOtpHash);
  if (!valid) throw new BadRequestError('Invalid pickup OTP');

  await deliveryRepo.update(deliveryId, { courierArrivedAt: new Date() });
  const updated = await stateMachine.transition(deliveryId, DeliveryStatus.ARRIVED_PICKUP, courierUserId);
  gateway?.emitDeliveryStatus(deliveryId, { status: DeliveryStatus.ARRIVED_PICKUP });
  return updated;
}

// ─── Picked up ────────────────────────────────────────────────────────────────

export async function pickedUp(deliveryId: string, courierUserId: string) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');
  if (delivery.courier?.userId !== courierUserId) throw new ForbiddenError('Not your delivery');

  const updated = await stateMachine.transition(deliveryId, DeliveryStatus.PICKED_UP, courierUserId);
  gateway?.emitDeliveryStatus(deliveryId, { status: DeliveryStatus.PICKED_UP });
  return updated;
}

// ─── In transit ───────────────────────────────────────────────────────────────

export async function inTransit(deliveryId: string, courierUserId: string) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');
  if (delivery.courier?.userId !== courierUserId) throw new ForbiddenError('Not your delivery');

  const updated = await stateMachine.transition(deliveryId, DeliveryStatus.IN_TRANSIT, courierUserId);
  gateway?.emitDeliveryStatus(deliveryId, { status: DeliveryStatus.IN_TRANSIT });
  return updated;
}

// ─── Courier arrived at dropoff ───────────────────────────────────────────────

export async function courierArrived(deliveryId: string, courierUserId: string) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');
  if (delivery.courier?.userId !== courierUserId) throw new ForbiddenError('Not your delivery');

  const dropoffOtp     = Math.floor(100000 + Math.random() * 900000).toString();
  const dropoffOtpHash = await bcrypt.hash(dropoffOtp, 10);

  await deliveryRepo.update(deliveryId, { dropoffOtpHash, dropoffOtpSentAt: new Date() });
  notifications.sendOtp(delivery.recipientPhone, dropoffOtp, delivery.dropoffEmail ?? undefined).catch(() => {});

  const updated = await stateMachine.transition(deliveryId, DeliveryStatus.ARRIVED_DROPOFF, courierUserId);
  gateway?.emitDeliveryStatus(deliveryId, { status: DeliveryStatus.ARRIVED_DROPOFF });
  return { updated, dropoffOtp };
}

// ─── Complete delivery ────────────────────────────────────────────────────────

export async function completeDelivery(deliveryId: string, courierUserId: string, otp?: string) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');
  if (delivery.courier?.userId !== courierUserId) throw new ForbiddenError('Not your delivery');

  if (!delivery.otpVerifiedAt) {
    if (!otp) throw new BadRequestError('OTP required');
    if (!delivery.dropoffOtpHash) throw new BadRequestError('Dropoff OTP not set');
    const valid = await bcrypt.compare(otp, delivery.dropoffOtpHash);
    if (!valid) throw new BadRequestError('Invalid dropoff OTP');
  }

  await deliveryRepo.update(deliveryId, {
    paymentStatus:     'RELEASED',
    paymentReleasedAt: new Date(),
    otpVerifiedAt:     delivery.otpVerifiedAt ?? new Date(),
  });
  const updated = await stateMachine.transition(deliveryId, DeliveryStatus.DELIVERED, courierUserId);

  const amount = delivery.agreedPriceRwf ?? 0;
  walletSvc.creditCourier(courierUserId, amount, deliveryId).catch((e) => console.warn('[complete] credit:', e));
  await courierRepo.updateStats(courierUserId, { incrementDeliveries: true, incrementEarnings: amount });

  const sender = await userRepo.findById(delivery.senderId);
  if (sender?.phone) {
    notifications.notifyDeliveryCompleted(sender.phone, delivery.courier?.user?.fullName ?? 'Courier').catch(() => {});
  }
  gateway?.emitDeliveryStatus(deliveryId, { status: DeliveryStatus.DELIVERED });
  return updated;
}

// ─── Rating ───────────────────────────────────────────────────────────────────

export async function createRating(deliveryId: string, giverUserId: string, stars: number, comment?: string) {
  const delivery = await deliveryRepo.findById(deliveryId);
  if (!delivery) throw new NotFoundError('Delivery not found');

  let receiverId: string;
  if (delivery.senderId === giverUserId) {
    if (!delivery.courier) throw new BadRequestError('No courier assigned');
    receiverId = delivery.courier.userId;
  } else if (delivery.courier?.userId === giverUserId) {
    receiverId = delivery.senderId;
  } else {
    throw new ForbiddenError('Not authorized to rate this delivery');
  }

  const { default: prisma } = await import('../lib/prisma');
  const rating = await prisma.rating.upsert({
    where:  { deliveryId },
    create: { deliveryId, giverId: giverUserId, receiverId, stars, comment },
    update: { stars, comment },
  });

  // Recalculate courier avg rating
  if (delivery.courier) {
    const ratings = await prisma.rating.findMany({ where: { receiverId: delivery.courier.userId } });
    const avg = ratings.reduce((s, r) => s + r.stars, 0) / ratings.length;
    await courierRepo.update(delivery.courier.userId, { avgRating: avg });
  }
  return rating;
}

// ─── List / find ──────────────────────────────────────────────────────────────

export async function findAll(userId: string, role: string) {
  if (role === UserRole.SENDER)  return deliveryRepo.findMany({ senderId: userId });
  if (role === UserRole.COURIER) {
    const courier = await courierRepo.findByUserId(userId);
    if (!courier) return [];
    return deliveryRepo.findMany({ courierId: courier.id });
  }
  return deliveryRepo.findMany({});
}

export async function findOne(id: string) {
  const delivery = await deliveryRepo.findById(id);
  if (!delivery) throw new NotFoundError('Delivery not found');
  return delivery;
}

export async function cancel(id: string, userId: string) {
  const delivery = await deliveryRepo.findById(id);
  if (!delivery) throw new NotFoundError('Delivery not found');
  if (delivery.senderId !== userId) throw new ForbiddenError('Not your delivery');
  if (!stateMachine.canCancel(delivery.status as DeliveryStatus)) {
    throw new BadRequestError(`Cannot cancel at status: ${delivery.status}`);
  }
  const updated = await stateMachine.transition(id, DeliveryStatus.CANCELLED, userId);
  gateway?.emitJobCancelled(id);
  return updated;
}

export async function getAvailable(courierUserId: string) {
  const courier = await courierRepo.findByUserId(courierUserId);
  if (!courier) throw new NotFoundError('Courier profile not found');
  return deliveryRepo.findMany({ status: DeliveryStatus.BROADCAST, courierId: null });
}

export async function getNearbyAvailable(courierUserId: string) {
  const courier = await courierRepo.findByUserId(courierUserId);
  if (!courier) throw new NotFoundError('Courier profile not found');
  if (!courier.currentLat || !courier.currentLng) return [];
  const deliveries = await deliveryRepo.findMany({ status: DeliveryStatus.BROADCAST, courierId: null });
  return deliveries.filter(
    (d) => haversineKm(courier.currentLat!, courier.currentLng!, (d as any).pickupLat, (d as any).pickupLng) <= BROADCAST_RADIUS_KM,
  );
}

export async function expressInterest(deliveryId: string, courierUserId: string, dto: { proposedPriceRwf?: number; etaMinutes?: number }) {
  const courier = await courierRepo.findByUserId(courierUserId);
  if (!courier) throw new NotFoundError('Courier profile not found');
  const interest = await deliveryRepo.upsertInterest(
    deliveryId, courier.id,
    { proposedPriceRwf: dto.proposedPriceRwf ?? null, etaMinutes: dto.etaMinutes ?? null },
    { proposedPriceRwf: dto.proposedPriceRwf,         etaMinutes: dto.etaMinutes },
  );
  gateway?.emitCourierInterested(deliveryId, { type: 'COURIER_INTERESTED', ...interest });
  return interest;
}
