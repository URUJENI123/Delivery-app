import * as courierRepo from '../repositories/courier.repository';
import * as userRepo    from '../repositories/user.repository';
import * as efficiency  from './efficiency';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { UserRole } from '../types';
import type { DeliveryGateway } from '../lib/socket';

let gateway: DeliveryGateway | null = null;
export function setGateway(gw: DeliveryGateway) { gateway = gw; }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function register(userId: string, dto: Record<string, unknown>) {
  await userRepo.update(userId, { role: UserRole.COURIER });
  return courierRepo.upsert(userId, dto as any, {});
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function startOnboarding(userId: string, dto: { fullName?: string; phone?: string }) {
  const existing = await courierRepo.findOnboardingByUser(userId);
  if (existing) return { created: false, session: existing };
  const session = await courierRepo.createOnboarding(userId, {
    user:     { connect: { id: userId } },
    fullName: dto.fullName ?? null,
    phone:    dto.phone    ?? null,
  } as any);
  return { created: true, session };
}

export async function saveOnboardingStep(userId: string, dto: { step?: number } & Record<string, unknown>) {
  const session = await courierRepo.findOnboardingByUser(userId);
  if (!session) throw new NotFoundError('Onboarding session not found');
  const { step, ...fields } = dto;
  const data: Record<string, unknown> = { ...fields };
  if (step !== undefined) data.currentStep = step;
  return courierRepo.updateOnboarding(userId, data as any);
}

export async function getOnboardingStatus(userId: string) {
  const session = await courierRepo.findOnboardingByUser(userId);
  return { hasSession: !!session, session };
}

export async function submitOnboarding(userId: string, dto: { agreeToTerms: boolean }) {
  if (!dto.agreeToTerms) throw new BadRequestError('You must agree to the terms');
  const session = await courierRepo.findOnboardingByUser(userId);
  if (!session) throw new NotFoundError('Onboarding session not found');

  await userRepo.update(userId, { role: UserRole.COURIER });
  const courier = await courierRepo.upsert(userId, {
    user:                  { connect: { id: userId } },
    nationalIdNumber:      session.nationalIdNumber,
    motorcyclePlate:       session.motorcyclePlate,
    associationCode:       session.associationCode,
    jacketSerialNumber:    session.jacketSerialNumber,
    operatingZone:         session.operatingZone,
    selfieUrl:             session.selfieUrl,
    idPhotoUrl:            session.idPhotoUrl,
    vehiclePhotoFrontUrl:  session.vehiclePhotoFrontUrl,
    vehiclePhotoRearUrl:   session.vehiclePhotoRearUrl,
    licensePhotoUrl:       session.licensePhotoUrl,
    jacketPhotoUrl:        session.jacketPhotoUrl,
    emergencyContactName:  session.emergencyContactName,
    emergencyContactPhone: session.emergencyContactPhone,
    momoNumber:            session.momoNumber,
    momoProvider:          session.momoProvider,
  } as any, {});

  await courierRepo.updateOnboarding(userId, { isComplete: true, isSubmitted: true });
  return courier;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const courier = await courierRepo.findByUserId(userId);
  if (!courier) throw new NotFoundError('Courier profile not found');
  return courier;
}

export async function updateProfile(userId: string, dto: Record<string, unknown>) {
  const courier = await courierRepo.findByUserId(userId);
  if (!courier) throw new NotFoundError('Courier profile not found');
  return courierRepo.update(userId, dto as any);
}

export async function toggleOnline(userId: string, dto: { isOnline: boolean; lat?: number; lng?: number }) {
  const courier = await courierRepo.findByUserId(userId);
  if (!courier) throw new NotFoundError('Courier profile not found');
  return courierRepo.update(userId, {
    isOnline:      dto.isOnline,
    currentLat:    dto.lat ?? courier.currentLat,
    currentLng:    dto.lng ?? courier.currentLng,
    lastLocationAt: new Date(),
  });
}

export async function updateLocation(
  userId: string,
  dto: { lat: number; lng: number; accuracy?: number; heading?: number; speed?: number },
) {
  const courier = await courierRepo.findByUserId(userId);
  if (!courier) throw new NotFoundError('Courier profile not found');

  const updated = await courierRepo.update(userId, {
    currentLat:     dto.lat,
    currentLng:     dto.lng,
    lastLocationAt: new Date(),
  });
  await courierRepo.createLocation({
    courier:  { connect: { id: courier.id } },
    lat:      dto.lat,
    lng:      dto.lng,
    accuracy: dto.accuracy ?? null,
    heading:  dto.heading  ?? null,
    speed:    dto.speed    ?? null,
  } as any);

  // Relay live location to the active delivery room so the sender / tracking
  // page sees courier movement without the courier having to join that room manually.
  const { default: prisma } = await import('../lib/prisma');
  const activeDelivery = await prisma.delivery.findFirst({
    where: {
      courierId: courier.id,
      status: { in: ['PICKUP_EN_ROUTE','ARRIVED_PICKUP','PICKED_UP','IN_TRANSIT','ARRIVED_DROPOFF'] as any },
    },
    select: { id: true },
  });
  if (activeDelivery) {
    // Emit to the delivery room so sender / tracking page sees live movement
    gateway?.emitDeliveryStatus(activeDelivery.id, {
      type:       'LOCATION_UPDATE',
      deliveryId: activeDelivery.id,
      lat:        dto.lat,
      lng:        dto.lng,
      accuracy:   dto.accuracy,
      heading:    dto.heading,
      speed:      dto.speed,
      timestamp:  new Date().toISOString(),
    });
  }

  return updated;
}

// ─── Jobs & Earnings ──────────────────────────────────────────────────────────

export async function getJobs(userId: string) {
  const courier = await courierRepo.findByUserId(userId);
  if (!courier) throw new NotFoundError('Courier profile not found');
  const { default: prisma } = await import('../lib/prisma');
  return prisma.delivery.findMany({
    where:   { courierId: courier.id },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, fullName: true, phone: true } },
    },
  });
}

export async function getEarnings(userId: string) {
  const courier = await courierRepo.findByUserId(userId);
  if (!courier) throw new NotFoundError('Courier profile not found');
  return {
    totalEarnings:   courier.totalEarnings,
    totalDeliveries: courier.totalDeliveries,
    avgRating:       courier.avgRating,
    completionRate:  courier.completionRate,
  };
}

export async function getDashboard(userId: string) {
  const courier = await courierRepo.findByUserId(userId);
  if (!courier) throw new NotFoundError('Courier profile not found');

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // These queries remain on prisma via delivery repo — import directly here for dashboard
  const { default: prisma } = await import('../lib/prisma');

  const [activeJob, todayD, weekD, monthD, availableCount] = await Promise.all([
    prisma.delivery.findFirst({
      where: {
        courierId: courier.id,
        status: { in: ['COURIER_ASSIGNED','COURIER_CONFIRMED','PICKUP_EN_ROUTE','ARRIVED_PICKUP','PICKED_UP','IN_TRANSIT','ARRIVED_DROPOFF'] as any },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.delivery.findMany({ where: { courierId: courier.id, status: 'DELIVERED', deliveredAt: { gte: todayStart } } }),
    prisma.delivery.findMany({ where: { courierId: courier.id, status: 'DELIVERED', deliveredAt: { gte: weekStart  } } }),
    prisma.delivery.findMany({ where: { courierId: courier.id, status: 'DELIVERED', deliveredAt: { gte: monthStart } } }),
    prisma.delivery.count({ where: { status: 'BROADCAST', courierId: null } }),
  ]);

  return {
    courier,
    activeJob,
    availableJobs:   availableCount,
    todayDeliveries: todayD.length,
    weekDeliveries:  weekD.length,
    monthDeliveries: monthD.length,
    todayEarnings:   todayD.reduce((s, d) => s + (d.agreedPriceRwf ?? 0), 0),
    monthEarnings:   monthD.reduce((s, d) => s + (d.agreedPriceRwf ?? 0), 0),
    avgRating:       courier.avgRating,
  };
}

export async function findNearby(lat: number, lng: number, radiusKm = 5) {
  const couriers = await courierRepo.findOnline();
  return couriers.filter(
    (c) => c.currentLat !== null && c.currentLng !== null &&
      haversineKm(lat, lng, c.currentLat!, c.currentLng!) <= radiusKm,
  );
}

// ─── Efficiency stats (for courier profile & admin panel) ────────────────────

export async function getEfficiencyStats(userId: string) {
  const stats = await efficiency.getCourierStats(userId);
  if (!stats) throw new NotFoundError('Courier profile not found');
  return stats;
}
