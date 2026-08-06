import * as adminRepo   from '../repositories/admin.repository';
import * as courierRepo from '../repositories/courier.repository';
import * as userRepo    from '../repositories/user.repository';
import * as deliveryRepo from '../repositories/delivery.repository';
import { NotFoundError } from '../lib/errors';
import type { DeliveryGateway } from '../lib/socket';
import { withCache } from '../lib/cache';

let gateway: DeliveryGateway | null = null;
export function setGateway(gw: DeliveryGateway) { gateway = gw; }

export async function getDashboard() {
  // 15s TTL — dashboards poll frequently and the 13+ queries are heavy. Short
  // enough that stale numbers are never noticeable.
  return withCache('admin:dashboard', 15, async () => {
    const { default: prisma } = await import('../lib/prisma');

    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeDeliveries, onlineCouriers, completedToday, openDisputes,
      todayRevRows, weekRevRows, monthRevRows,
      pendingVerifications, topCouriers, recentEvents, failedDeliveries, totalUsers,
    ] = await Promise.all([
      adminRepo.getActiveDeliveryCount(),
      courierRepo.count({ isOnline: true }),
      deliveryRepo.count({ status: 'DELIVERED' as any, deliveredAt: { gte: todayStart } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.delivery.findMany({ where: { status: 'DELIVERED', deliveredAt: { gte: todayStart } }, select: { agreedPriceRwf: true } }),
      prisma.delivery.findMany({ where: { status: 'DELIVERED', deliveredAt: { gte: weekStart  } }, select: { agreedPriceRwf: true } }),
      prisma.delivery.findMany({ where: { status: 'DELIVERED', deliveredAt: { gte: monthStart } }, select: { agreedPriceRwf: true } }),
      courierRepo.count({ isApprovedByAdmin: false }),
      courierRepo.findMany({ isApprovedByAdmin: true }, { user: { select: { fullName: true, phone: true } } }),
      adminRepo.getRecentEvents(20),
      deliveryRepo.count({ status: 'FAILED' as any }),
      adminRepo.countUsers(),
    ]);

    const sum = (rows: { agreedPriceRwf: number | null }[]) =>
      rows.reduce((s, d) => s + (d.agreedPriceRwf ?? 0), 0);

    return {
      activeDeliveries,
      onlineCouriers,
      completedToday,
      openDisputes,
      totalUsers,
      revenue: { today: sum(todayRevRows), week: sum(weekRevRows), month: sum(monthRevRows) },
      pendingVerifications,
      topCouriers: topCouriers.slice(0, 5),
      recentEvents,
      failedDeliveries,
    };
  });
}

export async function listCouriers(filters?: { tier?: string; approved?: boolean; zone?: string }) {
  return courierRepo.findMany(
    {
      verificationTier:  filters?.tier     ? (filters.tier as any)  : undefined,
      isApprovedByAdmin: filters?.approved !== undefined ? filters.approved : undefined,
      operatingZone:     filters?.zone ? { contains: filters.zone, mode: 'insensitive' as const } : undefined,
    },
    {
      user: { select: { id: true, email: true, phone: true, fullName: true, isActive: true, createdAt: true } },
    },
    // Sort by reliability score descending so the admin sees the best couriers first
    { reliabilityScore: 'desc' as const },
  );
}

export async function verifyCourier(courierId: string, dto: { approved: boolean; tier?: string; adminNotes?: string }) {
  const courier = await courierRepo.findById(courierId);
  if (!courier) throw new NotFoundError('Courier not found');
  const updated = await courierRepo.update(courier.userId, {
    isApprovedByAdmin: dto.approved,
    verificationTier:  dto.tier ? (dto.tier as any) : undefined,
    adminNotes:        dto.adminNotes ?? undefined,
  });
  // Notify the courier in real-time so their app can transition screens
  gateway?.emitToUser(courier.userId, 'courier:approval', {
    approved:  dto.approved,
    tier:      dto.tier,
    adminNotes: dto.adminNotes,
  });
  return updated;
}

export async function suspendCourier(courierId: string, dto: { reason: string }) {
  const courier = await courierRepo.findById(courierId);
  if (!courier) throw new NotFoundError('Courier not found');
  await courierRepo.update(courier.userId, { isOnline: false, isApprovedByAdmin: false, adminNotes: dto.reason });
  await userRepo.update(courier.userId, { isActive: false });
  // Notify the courier immediately so their app can log them out / show suspension screen
  gateway?.emitToUser(courier.userId, 'courier:suspended', { reason: dto.reason });
  return { success: true, message: 'Courier suspended' };
}

export async function listUsers(filters?: { role?: string; search?: string }) {
  return userRepo.findMany(
    {
      role: filters?.role ? (filters.role as any) : undefined,
      OR:   filters?.search ? [
        { fullName: { contains: filters.search, mode: 'insensitive' as const } },
        { email:    { contains: filters.search, mode: 'insensitive' as const } },
        { phone:    { contains: filters.search, mode: 'insensitive' as const } },
      ] : undefined,
    },
    { id: true, email: true, phone: true, fullName: true, role: true, isActive: true, createdAt: true },
  );
}

export async function listDeliveries(filters?: { status?: string }) {
  return deliveryRepo.findMany({ status: filters?.status ? (filters.status as any) : undefined });
}

export async function listDisputes() {
  return adminRepo.findDisputes();
}

export async function updateDispute(disputeId: string, dto: { status?: string; resolution?: string }) {
  const resolved = dto.status === 'CLOSED' || dto.status?.startsWith('RESOLVED');
  return adminRepo.updateDispute(disputeId, {
    status:     dto.status,
    resolution: dto.resolution,
    resolvedAt: resolved ? new Date() : null,
  });
}

export async function getLiveMap() {
  const { default: prisma } = await import('../lib/prisma');
  const [activeDeliveries, onlineCouriers] = await Promise.all([
    prisma.delivery.findMany({
      where: { status: { in: ['PICKUP_EN_ROUTE','ARRIVED_PICKUP','PICKED_UP','IN_TRANSIT','ARRIVED_DROPOFF'] as any } },
      include: {
        sender:  { select: { id: true, fullName: true } },
        courier: { include: { user: { select: { id: true, fullName: true } }, courierLocations: { orderBy: { recordedAt: 'desc' as const }, take: 1 } } },
      },
    }),
    courierRepo.findMany({ isOnline: true, currentLat: { not: null }, currentLng: { not: null } }, { user: { select: { id: true, fullName: true, phone: true } } }),
  ]);
  return { activeDeliveries, onlineCouriers };
}
