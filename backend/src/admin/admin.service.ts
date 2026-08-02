import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { VerifyCourierDto, SuspendCourierDto } from './dto/verify-courier.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const today      = new Date(new Date().setHours(0, 0, 0, 0));
    const weekAgo    = new Date(today.getTime() - 7  * 24 * 60 * 60 * 1000);
    const monthAgo   = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const ACTIVE_STATUSES = [
      'BROADCAST', 'COURIER_ASSIGNED', 'COURIER_CONFIRMED', 'PICKUP_EN_ROUTE',
      'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF',
    ] as const;

    const [
      activeCount,
      onlineCount,
      completedToday,
      disputesOpen,
      courierCount,
      userCount,
      revenueTodayRows,
      revenueWeekRows,
      revenueMonthRows,
      pendingVerifications,
      topCouriers,
      recentEvents,
      failedDeliveries,
    ] = await Promise.all([
      this.prisma.delivery.count({ where: { status: { in: ACTIVE_STATUSES as any } } }),
      this.prisma.courier.count({ where: { isOnline: true } }),
      this.prisma.delivery.count({ where: { status: 'DELIVERED', deliveredAt: { gte: today } } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.courier.count(),
      this.prisma.user.count(),
      this.prisma.delivery.findMany({ where: { status: 'DELIVERED', deliveredAt: { gte: today } },      select: { finalPriceRwf: true } }),
      this.prisma.delivery.findMany({ where: { status: 'DELIVERED', deliveredAt: { gte: weekAgo } },   select: { finalPriceRwf: true } }),
      this.prisma.delivery.findMany({ where: { status: 'DELIVERED', deliveredAt: { gte: monthAgo } },  select: { finalPriceRwf: true } }),
      this.prisma.courier.count({ where: { isApprovedByAdmin: false } }),
      this.prisma.courier.findMany({
        where: { isApprovedByAdmin: true },
        orderBy: { avgRating: 'desc' },
        take: 5,
        select: {
          id: true, totalDeliveries: true, avgRating: true, motorcyclePlate: true,
          user: { select: { fullName: true, phone: true } },
        },
      }),
      this.prisma.deliveryEvent.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 10,
        include: {
          delivery: { select: { trackingCode: true } },
          user: { select: { fullName: true } },
        },
      }),
      this.prisma.delivery.count({ where: { status: { in: ['FAILED', 'DISPUTED'] } } }),
    ]);

    const sum = (rows: { finalPriceRwf: number | null }[]) =>
      rows.reduce((s, d) => s + (d.finalPriceRwf ?? 0), 0);

    return {
      activeDeliveries:     activeCount,
      onlineCouriers:       onlineCount,
      completedToday:       completedToday,
      disputesOpen:         disputesOpen,
      totalCouriers:        courierCount,
      totalUsers:           userCount,
      revenueToday:         sum(revenueTodayRows),
      revenueWeek:          sum(revenueWeekRows),
      revenueMonth:         sum(revenueMonthRows),
      pendingVerifications: pendingVerifications,
      topCouriers,
      recentActivities:     recentEvents,
      failedDeliveries,
    };
  }

  async listCouriers(filters?: { tier?: string; approved?: string; zone?: string }) {
    const where: any = {};
    if (filters?.tier)            where.verificationTier  = filters.tier;
    if (filters?.approved === 'true')  where.isApprovedByAdmin = true;
    if (filters?.approved === 'false') where.isApprovedByAdmin = false;
    if (filters?.zone)            where.operatingZone     = filters.zone;

    return this.prisma.courier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, phone: true, isActive: true } } },
    });
  }

  async verifyCourier(courierId: string, dto: VerifyCourierDto) {
    const courier = await this.prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) throw new NotFoundException('Courier not found');

    return this.prisma.courier.update({
      where: { id: courierId },
      data: {
        isApprovedByAdmin: dto.approved,
        verificationTier:  (dto.tier as any) ?? courier.verificationTier,
        adminNotes:        dto.adminNotes,
      },
    });
  }

  async suspendCourier(courierId: string, dto: SuspendCourierDto) {
    const courier = await this.prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) throw new NotFoundException('Courier not found');

    await this.prisma.$transaction([
      this.prisma.courier.update({
        where: { id: courierId },
        data: { isOnline: false, isApprovedByAdmin: false, adminNotes: dto.reason },
      }),
      this.prisma.user.update({
        where: { id: courier.userId },
        data: { isActive: false },
      }),
    ]);

    return { message: 'Courier suspended successfully' };
  }

  async listUsers(filters?: { role?: string; search?: string }) {
    const where: any = {};
    if (filters?.role) where.role = filters.role;
    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email:    { contains: filters.search, mode: 'insensitive' } },
        { phone:    { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  async listDeliveries(filters?: { status?: string; zone?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    // Note: zone filtering on deliveries requires a courier join — skip for now

    return this.prisma.delivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: { select: { id: true, fullName: true, phone: true } },
        courier: { include: { user: { select: { fullName: true, phone: true } } } },
      },
    });
  }

  async listDisputes() {
    return this.prisma.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      include: { delivery: { select: { id: true, trackingCode: true, status: true } } },
    });
  }

  async updateDispute(disputeId: string, dto: { status?: string; resolution?: string }) {
    const data: any = {};
    if (dto.status)     data.status     = dto.status;
    if (dto.resolution) data.resolution = dto.resolution;
    if (dto.status === 'CLOSED' || dto.status?.startsWith('RESOLVED')) {
      data.resolvedAt = new Date();
    }

    return this.prisma.dispute.update({ where: { id: disputeId }, data });
  }

  async getLiveMap() {
    const [activeDeliveries, onlineCouriers] = await Promise.all([
      this.prisma.delivery.findMany({
        where: { status: { in: ['PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF'] } },
        include: {
          courier: {
            select: {
              id: true, currentLat: true, currentLng: true, motorcyclePlate: true,
              user: { select: { fullName: true, phone: true } },
            },
          },
          sender: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.courier.findMany({
        where: { isOnline: true, currentLat: { not: null }, currentLng: { not: null } },
        include: { user: { select: { fullName: true, phone: true } } },
      }),
    ]);

    return { activeDeliveries, onlineCouriers };
  }
}
