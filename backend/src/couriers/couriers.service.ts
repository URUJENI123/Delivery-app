import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../db/prisma.service';
import { RegisterCourierDto, UpdateCourierDto, ToggleOnlineDto, UpdateLocationDto } from './dto/register-courier.dto';
import { StartOnboardingDto, SaveOnboardingStepDto, SubmitOnboardingDto } from './dto/onboarding.dto';
import { UserRole } from '../types';

@Injectable()
export class CouriersService {
  private readonly logger = new Logger(CouriersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, dto: RegisterCourierDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.courier.findUnique({ where: { userId } });
    if (existing) throw new ForbiddenException('Courier profile already exists');

    await this.prisma.user.update({ where: { id: userId }, data: { role: UserRole.COURIER } });

    return this.prisma.courier.create({ data: { userId, ...dto } });
  }

  // ─── Onboarding ────────────────────────────────────────────────────────────

  async startOnboarding(userId: string, dto: StartOnboardingDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.onboardingSession.findUnique({ where: { userId } });
    if (existing) return existing;

    const updates: any = {};
    if (dto.fullName) updates.fullName = dto.fullName;
    if (dto.phone) updates.phone = dto.phone;
    if (Object.keys(updates).length) {
      await this.prisma.user.update({ where: { id: userId }, data: updates });
    }

    // Send OTP if phone provided (for phone-based courier sign-up)
    if (dto.phone) {
      const otp = crypto.randomInt(100000, 999999).toString();
      this.logger.log(`[Onboarding OTP] Phone: ${dto.phone}, OTP: ${otp}`);
      // TODO: plug into NotificationsService
    }

    return this.prisma.onboardingSession.create({
      data: {
        userId,
        currentStep: 0,
        fullName: dto.fullName,
        phone: dto.phone,
      },
    });
  }

  async saveOnboardingStep(userId: string, dto: SaveOnboardingStepDto) {
    const session = await this.prisma.onboardingSession.findUnique({ where: { userId } });
    if (!session) throw new NotFoundException('Onboarding session not found. Start onboarding first.');

    if (dto.fullName) {
      await this.prisma.user.update({ where: { id: userId }, data: { fullName: dto.fullName } });
    }

    const updateData: any = { currentStep: dto.step };
    const fields = [
      'fullName', 'email', 'phone', 'nationalIdNumber', 'emergencyContactName',
      'emergencyContactPhone', 'motorcyclePlate', 'associationCode', 'jacketSerialNumber',
      'operatingZone', 'momoNumber', 'momoProvider', 'selfieUrl', 'idPhotoUrl',
      'vehiclePhotoFrontUrl', 'vehiclePhotoRearUrl', 'licensePhotoUrl', 'jacketPhotoUrl',
    ] as const;

    for (const field of fields) {
      if ((dto as any)[field] !== undefined) updateData[field] = (dto as any)[field];
    }

    return this.prisma.onboardingSession.update({ where: { userId }, data: updateData });
  }

  async getOnboardingStatus(userId: string) {
    const session = await this.prisma.onboardingSession.findUnique({ where: { userId } });
    return { hasSession: !!session, session };
  }

  async submitOnboarding(userId: string, dto: SubmitOnboardingDto) {
    if (!dto.agreeToTerms) throw new BadRequestException('You must agree to the terms of service');

    const session = await this.prisma.onboardingSession.findUnique({ where: { userId } });
    if (!session) throw new NotFoundException('Onboarding session not found');

    const existing = await this.prisma.courier.findUnique({ where: { userId } });
    if (existing) throw new ForbiddenException('Courier profile already exists');

    const userUpdates: any = { role: UserRole.COURIER };
    if (session.fullName) userUpdates.fullName = session.fullName;
    if (session.email)    userUpdates.email    = session.email;
    if (session.phone)    userUpdates.phone    = session.phone;

    const [, courier] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: userUpdates }),
      this.prisma.courier.create({
        data: {
          userId,
          nationalIdNumber:      session.nationalIdNumber     ?? undefined,
          motorcyclePlate:       session.motorcyclePlate      ?? undefined,
          associationCode:       session.associationCode      ?? undefined,
          jacketSerialNumber:    session.jacketSerialNumber   ?? undefined,
          operatingZone:         session.operatingZone        ?? undefined,
          emergencyContactName:  session.emergencyContactName ?? undefined,
          emergencyContactPhone: session.emergencyContactPhone ?? undefined,
          momoNumber:            session.momoNumber           ?? undefined,
          momoProvider:          session.momoProvider         ?? undefined,
          selfieUrl:             session.selfieUrl            ?? undefined,
          idPhotoUrl:            session.idPhotoUrl           ?? undefined,
          vehiclePhotoFrontUrl:  session.vehiclePhotoFrontUrl ?? undefined,
          vehiclePhotoRearUrl:   session.vehiclePhotoRearUrl  ?? undefined,
          licensePhotoUrl:       session.licensePhotoUrl      ?? undefined,
          jacketPhotoUrl:        session.jacketPhotoUrl       ?? undefined,
          verificationTier:      'BASIC',
          isApprovedByAdmin:     false,
        },
      }),
      this.prisma.onboardingSession.update({
        where: { userId },
        data: { isComplete: true, isSubmitted: true, currentStep: 4 },
      }),
    ]);

    return courier;
  }

  // ─── Profile ───────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!courier) throw new NotFoundException('Courier profile not found');
    return courier;
  }

  async updateProfile(userId: string, dto: UpdateCourierDto) {
    const courier = await this.prisma.courier.findUnique({ where: { userId } });
    if (!courier) throw new NotFoundException('Courier profile not found');
    return this.prisma.courier.update({ where: { userId }, data: dto as any });
  }

  async toggleOnline(userId: string, dto: ToggleOnlineDto) {
    const courier = await this.prisma.courier.findUnique({ where: { userId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const data: any = { isOnline: dto.isOnline };
    if (dto.lat !== undefined) data.currentLat = dto.lat;
    if (dto.lng !== undefined) data.currentLng = dto.lng;
    if (dto.isOnline) data.lastLocationAt = new Date();

    return this.prisma.courier.update({ where: { userId }, data });
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const courier = await this.prisma.courier.findUnique({ where: { userId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const [updatedCourier, location] = await this.prisma.$transaction([
      this.prisma.courier.update({
        where: { userId },
        data: { currentLat: dto.lat, currentLng: dto.lng, lastLocationAt: new Date() },
      }),
      this.prisma.courierLocation.create({
        data: {
          courierId: courier.id,
          lat: dto.lat,
          lng: dto.lng,
          accuracy: dto.accuracy,
          heading: dto.heading,
          speed: dto.speed,
        },
      }),
    ]);

    return location;
  }

  async getJobs(userId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    return this.prisma.delivery.findMany({
      where: { courierId: courier.id },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, fullName: true, phone: true } } },
    });
  }

  async getEarnings(userId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    return {
      totalEarnings: courier.totalEarnings,
      totalDeliveries: courier.totalDeliveries,
      completionRate: courier.completionRate,
      avgRating: courier.avgRating,
    };
  }

  async getDashboard(userId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { userId } });
    if (!courier) throw new NotFoundException('Courier profile not found');

    const today      = new Date(new Date().setHours(0, 0, 0, 0));
    const weekAgo    = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const ACTIVE_STATUSES = [
      'COURIER_ASSIGNED', 'COURIER_CONFIRMED', 'PICKUP_EN_ROUTE',
      'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF',
    ] as const;

    const [
      activeJob,
      availableCount,
      todayCount,
      weekCount,
      monthCount,
      todayDeliveries,
      monthDeliveries,
      ratings,
    ] = await Promise.all([
      this.prisma.delivery.findFirst({
        where: { courierId: courier.id, status: { in: ACTIVE_STATUSES as any } },
        include: { sender: { select: { id: true, fullName: true, phone: true, profilePhotoUrl: true } } },
      }),
      this.prisma.delivery.count({ where: { status: 'BROADCAST' } }),
      this.prisma.delivery.count({
        where: { courierId: courier.id, status: { in: ['DELIVERED', 'IN_TRANSIT', 'PICKED_UP'] }, createdAt: { gte: today } },
      }),
      this.prisma.delivery.count({
        where: { courierId: courier.id, status: { in: ['DELIVERED', 'IN_TRANSIT', 'PICKED_UP'] }, createdAt: { gte: weekAgo } },
      }),
      this.prisma.delivery.count({
        where: { courierId: courier.id, status: { in: ['DELIVERED', 'IN_TRANSIT', 'PICKED_UP'] }, createdAt: { gte: monthStart } },
      }),
      this.prisma.delivery.findMany({
        where: { courierId: courier.id, status: 'DELIVERED', deliveredAt: { gte: today } },
        select: { finalPriceRwf: true },
      }),
      this.prisma.delivery.findMany({
        where: { courierId: courier.id, status: 'DELIVERED', deliveredAt: { gte: monthStart } },
        select: { finalPriceRwf: true },
      }),
      this.prisma.rating.findMany({
        where: { receiverId: userId },
        select: { stars: true },
      }),
    ]);

    const todayEarnings  = todayDeliveries.reduce((s, d) => s + (d.finalPriceRwf ?? 0), 0);
    const monthEarnings  = monthDeliveries.reduce((s, d) => s + (d.finalPriceRwf ?? 0), 0);
    const avgRating      = ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) * 10) / 10
      : 0;

    return {
      courier,
      activeJob,
      availableJobs: availableCount,
      todayDeliveries: todayCount,
      weekDeliveries: weekCount,
      monthDeliveries: monthCount,
      todayEarnings,
      monthEarnings,
      avgRating,
      totalRatings: ratings.length,
    };
  }

  async findNearby(lat: number, lng: number, radiusKm = 5) {
    const couriers = await this.prisma.courier.findMany({
      where: {
        isOnline: true,
        isApprovedByAdmin: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    });

    return couriers
      .filter(c => {
        const dist = this.haversineDistance(lat, lng, c.currentLat!, c.currentLng!);
        return dist <= radiusKm;
      })
      .map(c => ({
        id: c.id,
        userId: c.userId,
        verificationTier: c.verificationTier,
        avgRating: c.avgRating,
        totalDeliveries: c.totalDeliveries,
        motorcyclePlate: c.motorcyclePlate,
        user: c.user,
      }));
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
