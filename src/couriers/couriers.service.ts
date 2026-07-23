import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { DbService, mapRow } from '../db/db.service';
import { RegisterCourierDto, UpdateCourierDto, ToggleOnlineDto, UpdateLocationDto } from './dto/register-courier.dto';
import { StartOnboardingDto, SaveOnboardingStepDto, SubmitOnboardingDto } from './dto/onboarding.dto';
import { UserRole } from '../types';

@Injectable()
export class CouriersService {
  private readonly logger = new Logger(CouriersService.name);
  private readonly supabaseAdmin: SupabaseClient | null = null;

  constructor(private readonly db: DbService) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key && !url.includes('placeholder')) {
      this.supabaseAdmin = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    } else {
      this.logger.warn('Supabase not configured — courier auth operations disabled (dev mode)');
    }
  }

  async register(userId: string, dto: RegisterCourierDto) {
    const user = await this.db.findOne('users', 'id', userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.db.findOne('couriers', 'userId', userId);
    if (existing) {
      throw new ForbiddenException('Courier profile already exists');
    }

    await this.db.update('users', 'id', userId, { role: UserRole.COURIER });

    return this.db.create('couriers', {
      userId,
      ...dto,
    });
  }

  async startOnboarding(userId: string, dto: StartOnboardingDto) {
    const user = await this.db.findOne('users', 'id', userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.db.findOne('onboarding_sessions', 'userId', userId);

    if (existing) {
      return existing;
    }

    if (dto.fullName) {
      await this.db.update('users', 'id', userId, { fullName: dto.fullName });
    }

    if (dto.phone && !user.supabaseId) {
      if (!this.supabaseAdmin) {
        this.logger.warn('Supabase admin not configured — skipping auth user creation (dev mode)');
      } else {
      const tempPassword = dto.password || crypto.randomBytes(16).toString('hex');
      const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        phone: dto.phone,
        password: tempPassword,
        phone_confirm: true,
      });

      if (authError || !authData.user) {
        this.logger.error(`Failed to create Supabase Auth user: ${authError?.message}`);
        throw new BadRequestException('Failed to create authentication account');
      }

      await this.db.update('users', 'id', userId, {
        supabaseId: authData.user.id,
        phone: dto.phone,
        phoneVerified: true,
      });
      }
    }

    if (dto.phone) {
      if (!this.supabaseAdmin) {
        this.logger.warn('Supabase admin not configured — skipping OTP send (dev mode)');
      } else {
      const { error: otpError } = await this.supabaseAdmin.auth.signInWithOtp({
        phone: dto.phone,
      });
      if (otpError) {
        this.logger.error(`Failed to send onboarding OTP: ${otpError.message}`);
      }
      }
    }

    return this.db.create('onboarding_sessions', {
      userId,
      currentStep: 0,
      fullName: dto.fullName,
      phone: dto.phone,
    });
  }

  async saveOnboardingStep(userId: string, dto: SaveOnboardingStepDto) {
    const session = await this.db.findOne('onboarding_sessions', 'userId', userId);

    if (!session) {
      throw new NotFoundException('Onboarding session not found. Start onboarding first.');
    }

    if (dto.fullName) {
      await this.db.update('users', 'id', userId, { fullName: dto.fullName });
    }

    const updateData: any = {
      currentStep: dto.step,
    };
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.nationalIdNumber !== undefined) updateData.nationalIdNumber = dto.nationalIdNumber;
    if (dto.emergencyContactName !== undefined) updateData.emergencyContactName = dto.emergencyContactName;
    if (dto.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = dto.emergencyContactPhone;
    if (dto.motorcyclePlate !== undefined) updateData.motorcyclePlate = dto.motorcyclePlate;
    if (dto.associationCode !== undefined) updateData.associationCode = dto.associationCode;
    if (dto.jacketSerialNumber !== undefined) updateData.jacketSerialNumber = dto.jacketSerialNumber;
    if (dto.operatingZone !== undefined) updateData.operatingZone = dto.operatingZone;
    if (dto.momoNumber !== undefined) updateData.momoNumber = dto.momoNumber;
    if (dto.momoProvider !== undefined) updateData.momoProvider = dto.momoProvider;
    if (dto.selfieUrl !== undefined) updateData.selfieUrl = dto.selfieUrl;
    if (dto.idPhotoUrl !== undefined) updateData.idPhotoUrl = dto.idPhotoUrl;
    if (dto.vehiclePhotoFrontUrl !== undefined) updateData.vehiclePhotoFrontUrl = dto.vehiclePhotoFrontUrl;
    if (dto.vehiclePhotoRearUrl !== undefined) updateData.vehiclePhotoRearUrl = dto.vehiclePhotoRearUrl;
    if (dto.licensePhotoUrl !== undefined) updateData.licensePhotoUrl = dto.licensePhotoUrl;
    if (dto.jacketPhotoUrl !== undefined) updateData.jacketPhotoUrl = dto.jacketPhotoUrl;

    return this.db.update('onboarding_sessions', 'userId', userId, updateData);
  }

  async getOnboardingStatus(userId: string) {
    const session = await this.db.findOne('onboarding_sessions', 'userId', userId);

    return {
      hasSession: !!session,
      session,
    };
  }

  async submitOnboarding(userId: string, dto: SubmitOnboardingDto) {
    if (!dto.agreeToTerms) {
      throw new BadRequestException('You must agree to the terms of service');
    }

    const session = await this.db.findOne('onboarding_sessions', 'userId', userId);

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    const existing = await this.db.findOne('couriers', 'userId', userId);

    if (existing) {
      throw new ForbiddenException('Courier profile already exists');
    }

    await this.db.update('users', 'id', userId, {
      role: UserRole.COURIER,
      fullName: session.fullName,
      email: session.email || undefined,
      phone: session.phone || undefined,
    });

    await this.db.update('onboarding_sessions', 'userId', userId, {
      isComplete: true,
      isSubmitted: true,
      currentStep: 4,
    });

    return this.db.create('couriers', {
      userId,
      nationalIdNumber: session.nationalIdNumber,
      motorcyclePlate: session.motorcyclePlate,
      associationCode: session.associationCode,
      jacketSerialNumber: session.jacketSerialNumber,
      operatingZone: session.operatingZone,
      emergencyContactName: session.emergencyContactName,
      emergencyContactPhone: session.emergencyContactPhone,
      momoNumber: session.momoNumber,
      momoProvider: session.momoProvider,
      selfieUrl: session.selfieUrl,
      idPhotoUrl: session.idPhotoUrl,
      vehiclePhotoFrontUrl: session.vehiclePhotoFrontUrl,
      vehiclePhotoRearUrl: session.vehiclePhotoRearUrl,
      licensePhotoUrl: session.licensePhotoUrl,
      jacketPhotoUrl: session.jacketPhotoUrl,
      verificationTier: 'BASIC',
      isApprovedByAdmin: false,
    });
  }

  async getProfile(userId: string) {
    const courier = await this.db.findOne('couriers', 'userId', userId);

    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    const user = await this.db.findOne('users', 'id', userId);
    return { ...courier, user };
  }

  async updateProfile(userId: string, dto: UpdateCourierDto) {
    const courier = await this.db.findOne('couriers', 'userId', userId);
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    return this.db.update('couriers', 'userId', userId, dto);
  }

  async toggleOnline(userId: string, dto: ToggleOnlineDto) {
    const courier = await this.db.findOne('couriers', 'userId', userId);
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    const data: any = { isOnline: dto.isOnline };
    if (dto.lat !== undefined) data.currentLat = dto.lat;
    if (dto.lng !== undefined) data.currentLng = dto.lng;
    if (dto.isOnline) data.lastLocationAt = new Date();

    return this.db.update('couriers', 'userId', userId, data);
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const courier = await this.db.findOne('couriers', 'userId', userId);
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    await this.db.update('couriers', 'userId', userId, {
      currentLat: dto.lat,
      currentLng: dto.lng,
      lastLocationAt: new Date(),
    });

    return this.db.create('courier_locations', {
      courierId: courier.id,
      lat: dto.lat,
      lng: dto.lng,
      accuracy: dto.accuracy,
      heading: dto.heading,
      speed: dto.speed,
    });
  }

  async getJobs(userId: string) {
    const courier = await this.db.findOne('couriers', 'userId', userId);
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    const { data, error } = await this.db.getClient()
      .from('deliveries')
      .select('*, sender:sender_id(id, full_name, phone)')
      .eq('courier_id', courier.id)
      .order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return mapRow(data);
  }

  async getEarnings(userId: string) {
    const courier = await this.db.findOne('couriers', 'userId', userId);
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    return {
      totalEarnings: courier.totalEarnings,
      totalDeliveries: courier.totalDeliveries,
      completionRate: courier.completionRate,
      avgRating: courier.avgRating,
    };
  }

  async getDashboard(userId: string) {
    const courier = await this.db.findOne('couriers', 'userId', userId);
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    const sb = this.db.getClient();
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const courierId = courier.id;

    const [
      activeJobResult,
      availableCount,
      todayDeliveries,
      weekDeliveries,
      monthDeliveries,
      todayEarningsResult,
      monthEarningsResult,
      ratingResult,
    ] = await Promise.all([
      sb.from('deliveries').select('*, sender:sender_id(id, full_name, phone, profile_photo_url)')
        .eq('courier_id', courierId)
        .in('status', ['COURIER_ASSIGNED', 'COURIER_CONFIRMED', 'PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF'])
        .maybeSingle(),
      sb.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'BROADCAST'),
      sb.from('deliveries').select('*', { count: 'exact', head: true })
        .eq('courier_id', courierId).in('status', ['DELIVERED', 'IN_TRANSIT', 'PICKED_UP'])
        .gte('created_at', today.toISOString()),
      sb.from('deliveries').select('*', { count: 'exact', head: true })
        .eq('courier_id', courierId).in('status', ['DELIVERED', 'IN_TRANSIT', 'PICKED_UP'])
        .gte('created_at', weekAgo.toISOString()),
      sb.from('deliveries').select('*', { count: 'exact', head: true })
        .eq('courier_id', courierId).in('status', ['DELIVERED', 'IN_TRANSIT', 'PICKED_UP'])
        .gte('created_at', monthStart.toISOString()),
      sb.from('deliveries').select('final_price_rwf').eq('courier_id', courierId).eq('status', 'DELIVERED').gte('delivered_at', today.toISOString()),
      sb.from('deliveries').select('final_price_rwf').eq('courier_id', courierId).eq('status', 'DELIVERED').gte('delivered_at', monthStart.toISOString()),
      sb.from('ratings').select('stars').eq('receiver_id', userId),
    ]);

    const todayEarnings = todayEarningsResult.data?.reduce((sum: number, d: any) => sum + (d.final_price_rwf || 0), 0) || 0;
    const monthEarnings = monthEarningsResult.data?.reduce((sum: number, d: any) => sum + (d.final_price_rwf || 0), 0) || 0;
    const ratings = ratingResult.data || [];
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.stars, 0) / ratings.length
      : 0;

    return {
      courier,
      activeJob: activeJobResult.data ? mapRow(activeJobResult.data) : null,
      availableJobs: availableCount.count || 0,
      todayDeliveries: todayDeliveries.count || 0,
      weekDeliveries: weekDeliveries.count || 0,
      monthDeliveries: monthDeliveries.count || 0,
      todayEarnings,
      monthEarnings,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length,
    };
  }

  async findNearby(lat: number, lng: number, radiusKm: number = 5) {
    const { data: couriers, error } = await this.db.getClient()
      .from('couriers')
      .select('*, user:user_id(id, full_name, phone)')
      .eq('is_online', true)
      .eq('is_approved_by_admin', true)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null);
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');

    return (couriers || []).filter((c: any) => {
      if (c.current_lat === null || c.current_lng === null) return false;
      const dist = this.haversineDistance(lat, lng, c.current_lat, c.current_lng);
      return dist <= radiusKm;
    }).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      verificationTier: c.verification_tier,
      avgRating: c.avg_rating,
      totalDeliveries: c.total_deliveries,
      motorcyclePlate: c.motorcycle_plate,
      user: c.user ? { id: c.user.id, fullName: c.user.full_name, phone: c.user.phone } : undefined,
    }));
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
