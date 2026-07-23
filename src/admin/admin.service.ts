import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DbService, mapRow } from '../db/db.service';
import { VerifyCourierDto, SuspendCourierDto } from './dto/verify-courier.dto';

@Injectable()
export class AdminService {
  constructor(private readonly db: DbService) {}

  async getDashboard() {
    const sb = this.db.getClient();
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const safeQuery = async (query: Promise<any>) => {
      try {
        return await query;
      } catch {
        return { data: null, count: null, error: null };
      }
    };

    const [
      activeCount,
      onlineCount,
      completedToday,
      disputesOpen,
      courierCount,
      userCount,
      revenueTodayResult,
      revenueWeekResult,
      revenueMonthResult,
      pendingVerifications,
      topCouriersResult,
      recentEventsResult,
      failedDeliveries,
    ] = await Promise.all([
      safeQuery(sb.from('deliveries').select('*', { count: 'exact', head: true })
        .in('status', ['BROADCAST', 'COURIER_ASSIGNED', 'COURIER_CONFIRMED', 'PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF'])),
      safeQuery(sb.from('couriers').select('*', { count: 'exact', head: true }).eq('is_online', true)),
      safeQuery(sb.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'DELIVERED').gte('delivered_at', today.toISOString())),
      safeQuery(sb.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['OPEN', 'UNDER_REVIEW'])),
      safeQuery(sb.from('couriers').select('*', { count: 'exact', head: true })),
      safeQuery(sb.from('users').select('*', { count: 'exact', head: true })),
      safeQuery(sb.from('deliveries').select('final_price_rwf').eq('status', 'DELIVERED').gte('delivered_at', today.toISOString())),
      safeQuery(sb.from('deliveries').select('final_price_rwf').eq('status', 'DELIVERED').gte('delivered_at', weekAgo.toISOString())),
      safeQuery(sb.from('deliveries').select('final_price_rwf').eq('status', 'DELIVERED').gte('delivered_at', monthAgo.toISOString())),
      safeQuery(sb.from('couriers').select('*', { count: 'exact', head: true }).eq('is_approved_by_admin', false)),
      safeQuery(sb.from('couriers')
        .select('id, total_deliveries, avg_rating, motorcycle_plate, user:user_id(full_name, phone)')
        .eq('is_approved_by_admin', true)
        .order('avg_rating', { ascending: false })
        .limit(5)),
      safeQuery(sb.from('delivery_events')
        .select('*, delivery:delivery_id(tracking_code), user:user_id(full_name)')
        .order('occurred_at', { ascending: false })
        .limit(10)),
      safeQuery(sb.from('deliveries').select('*', { count: 'exact', head: true }).in('status', ['FAILED', 'DISPUTED'])),
    ]);

    const revenueToday = revenueTodayResult.data?.reduce((sum: number, d: any) => sum + (d.final_price_rwf || 0), 0) || 0;
    const revenueWeek = revenueWeekResult.data?.reduce((sum: number, d: any) => sum + (d.final_price_rwf || 0), 0) || 0;
    const revenueMonth = revenueMonthResult.data?.reduce((sum: number, d: any) => sum + (d.final_price_rwf || 0), 0) || 0;

    return {
      activeDeliveries: activeCount.count || 0,
      onlineCouriers: onlineCount.count || 0,
      completedToday: completedToday.count || 0,
      disputesOpen: disputesOpen.count || 0,
      totalCouriers: courierCount.count || 0,
      totalUsers: userCount.count || 0,
      revenueToday,
      revenueWeek,
      revenueMonth,
      pendingVerifications: pendingVerifications.count || 0,
      topCouriers: topCouriersResult.data ? mapRow(topCouriersResult.data) : [],
      recentActivities: recentEventsResult.data ? mapRow(recentEventsResult.data) : [],
      failedDeliveries: failedDeliveries.count || 0,
    };
  }

  async listCouriers(filters?: { tier?: string; approved?: string; zone?: string }) {
    const sb = this.db.getClient();
    let query = sb
      .from('couriers')
      .select('*, user:user_id(id, full_name, phone, is_active)')
      .order('created_at', { ascending: false });

    if (filters?.tier) query = query.eq('verification_tier', filters.tier);
    if (filters?.approved === 'true') query = query.eq('is_approved_by_admin', true);
    if (filters?.approved === 'false') query = query.eq('is_approved_by_admin', false);
    if (filters?.zone) query = query.eq('operating_zone', filters.zone);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return mapRow(data);
  }

  async verifyCourier(courierId: string, dto: VerifyCourierDto) {
    const courier = await this.db.findOne('couriers', 'id', courierId);

    if (!courier) {
      throw new NotFoundException('Courier not found');
    }

    return this.db.update('couriers', 'id', courierId, {
      isApprovedByAdmin: dto.approved,
      verificationTier: dto.tier || courier.verificationTier,
      adminNotes: dto.adminNotes,
    });
  }

  async suspendCourier(courierId: string, dto: SuspendCourierDto) {
    const courier = await this.db.findOne('couriers', 'id', courierId);

    if (!courier) {
      throw new NotFoundException('Courier not found');
    }

    await this.db.update('couriers', 'id', courierId, {
      isOnline: false,
      isApprovedByAdmin: false,
      adminNotes: dto.reason,
    });

    await this.db.update('users', 'id', courier.userId, { isActive: false });

    return { message: 'Courier suspended successfully' };
  }

  async listUsers(filters?: { role?: string; search?: string }) {
    const sb = this.db.getClient();
    let query = sb
      .from('users')
      .select('id, full_name, email, phone, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.search) query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return mapRow(data);
  }

  async listDeliveries(filters?: { status?: string; zone?: string }) {
    const sb = this.db.getClient();
    let query = sb
      .from('deliveries')
      .select('*, sender:sender_id(id, full_name, phone), courier:courier_id(id, user:user_id(full_name, phone))')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return mapRow(data);
  }

  async listDisputes() {
    const { data, error } = await this.db.getClient()
      .from('disputes')
      .select('*, delivery:delivery_id(id, tracking_code, status)')
      .order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    return mapRow(data);
  }

  async updateDispute(disputeId: string, dto: { status?: string; resolution?: string }) {
    const data: any = {};
    if (dto.status) data.status = dto.status;
    if (dto.resolution) data.resolution = dto.resolution;
    if (dto.status === 'CLOSED' || dto.status?.startsWith('RESOLVED')) {
      data.resolvedAt = new Date();
    }

    return this.db.update('disputes', 'id', disputeId, data);
  }

  async getLiveMap() {
    const sb = this.db.getClient();

    const [deliveriesResult, couriersResult] = await Promise.all([
      sb.from('deliveries')
        .select('*, courier:courier_id(id, current_lat, current_lng, motorcycle_plate, user:user_id(full_name, phone)), sender:sender_id(id, full_name)')
        .in('status', ['PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF']),
      sb.from('couriers')
        .select('*, user:user_id(full_name, phone)')
        .eq('is_online', true)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null),
    ]);

    return {
      activeDeliveries: deliveriesResult.data ? mapRow(deliveriesResult.data) : [],
      onlineCouriers: couriersResult.data ? mapRow(couriersResult.data) : [],
    };
  }
}
