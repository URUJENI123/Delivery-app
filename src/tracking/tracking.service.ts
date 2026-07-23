import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DbService, mapRow } from '../db/db.service';
import { DeliveryStateMachineService } from '../deliveries/delivery-state-machine.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly db: DbService,
    private readonly stateMachine: DeliveryStateMachineService,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService,
  ) {}

  async getByToken(token: string) {
    const { data: delivery, error } = await this.db.getClient()
      .from('deliveries')
      .select(`
        *,
        sender:sender_id(id, full_name, phone),
        courier:courier_id(
          id, current_lat, current_lng, total_deliveries, avg_rating,
          verification_tier, motorcycle_plate, user_id,
          user:user_id(full_name, phone, profile_photo_url)
        ),
        events:delivery_events(*)
      `)
      .eq('recipient_tracking_token', token)
      .order('occurred_at', { foreignTable: 'delivery_events', ascending: true })
      .limit(20, { foreignTable: 'delivery_events' })
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return mapRow(delivery);
  }

  async confirmDropoffOtp(token: string, otp: string) {
    const sb = this.db.getClient();
    const { data: delivery, error } = await sb
      .from('deliveries')
      .select('*')
      .eq('recipient_tracking_token', token)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== 'ARRIVED_DROPOFF') {
      throw new BadRequestException('Courier has not arrived at drop-off yet');
    }

    if (!delivery.dropoff_otp_hash) {
      throw new BadRequestException('No drop-off OTP set');
    }

    const isValid = await bcrypt.compare(otp, delivery.dropoff_otp_hash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Use state machine for the transition
    await this.stateMachine.transition(delivery.id, 'DELIVERED' as any, undefined, {
      otpVerified: true,
    });

    // Release payment from escrow
    const finalPrice = delivery.agreed_price_rwf || delivery.final_price_rwf || delivery.quoted_price_rwf || 0;
    const SERVICE_FEE_RWF = 100;

    await sb
      .from('deliveries')
      .update({
        payment_status: 'RELEASED',
        payment_released_at: new Date().toISOString(),
        otp_verified_at: new Date().toISOString(),
      })
      .eq('id', delivery.id);

    // Credit courier wallet (minus service fee)
    if (finalPrice > 0 && delivery.courier_id) {
      const courierRow = await sb
        .from('couriers')
        .select('user_id, total_deliveries, total_earnings')
        .eq('id', delivery.courier_id)
        .single();
      if (courierRow.data) {
        await this.walletService.creditCourier(
          courierRow.data.user_id,
          finalPrice,
          delivery.id,
        );

        // Update courier stats
        await sb
          .from('couriers')
          .update({
            total_deliveries: (courierRow.data.total_deliveries || 0) + 1,
            total_earnings: (courierRow.data.total_earnings || 0) + finalPrice,
          })
          .eq('id', delivery.courier_id);
      }
    }

    // Notify sender about completion
    const senderUser = await sb
      .from('users')
      .select('phone')
      .eq('id', delivery.sender_id)
      .single();
    if (senderUser.data?.phone) {
      try {
        await this.notifications.notifyDeliveryCompleted(senderUser.data.phone, 'Courier');
      } catch (e) {
        this.logger.warn(`Failed to notify sender: ${e}`);
      }
    }

    const mapped = mapRow(delivery);
    return { ...mapped, delivered: true, finalPrice, fee: SERVICE_FEE_RWF, netAmount: finalPrice - SERVICE_FEE_RWF };
  }
}
