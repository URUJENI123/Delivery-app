import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DbService, mapRow } from '../db/db.service';

@Injectable()
export class SenderService {
  constructor(private readonly db: DbService) {}

  async getDashboard(userId: string) {
    const sb = this.db.getClient();

    const safeQuery = async (query: Promise<any>) => {
      try {
        return await query;
      } catch {
        return { data: null, count: null, error: null };
      }
    };

    const [activeResult, totalResult, spentResult, recentResult, profileResult] = await Promise.all([
      safeQuery(sb.from('deliveries').select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .in('status', ['BROADCAST', 'COURIER_ASSIGNED', 'COURIER_CONFIRMED', 'PICKUP_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF'])),
      safeQuery(sb.from('deliveries').select('*', { count: 'exact', head: true }).eq('sender_id', userId)),
      safeQuery(sb.from('deliveries').select('final_price_rwf').eq('sender_id', userId).eq('status', 'DELIVERED')),
      safeQuery(sb.from('deliveries').select('*, courier:courier_id(id, user:user_id(full_name, phone))').eq('sender_id', userId)
        .order('created_at', { ascending: false }).limit(5)),
      safeQuery(sb.from('sender_profiles').select('*').eq('user_id', userId).maybeSingle()),
    ]);

    const totalSpent = spentResult.data?.reduce((sum: number, d: any) => sum + (d.final_price_rwf || 0), 0) || 0;

    return {
      activeDeliveries: activeResult.count || 0,
      totalDeliveries: totalResult.count || 0,
      totalSpent,
      recentDeliveries: recentResult.data ? mapRow(recentResult.data) : [],
      savedAddresses: profileResult.data?.default_pickup_address || null,
    };
  }
}
