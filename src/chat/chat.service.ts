import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService, mapRow } from '../db/db.service';
import { DeliveryGateway } from '../common/delivery.gateway';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly db: DbService,
    private readonly gateway: DeliveryGateway,
  ) {}

  async getConversations(userId: string) {
    const sb = this.db.getClient();

    const { data: courier } = await sb
      .from('couriers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let query = sb
      .from('deliveries')
      .select(`
        id,
        status,
        pickup_address,
        dropoff_address,
        tracking_code,
        courier:courier_id(
          id,
          user:user_id(id, full_name, phone, profile_photo_url)
        ),
        sender:sender_id(id, full_name, phone, profile_photo_url)
      `)
      .order('updated_at', { ascending: false });

    if (courier) {
      query = query.eq('courier_id', courier.id);
    } else {
      query = query.eq('sender_id', userId);
    }

    const { data: deliveries, error } = await query;
    if (error) throw new InternalServerErrorException(error.message || 'Database query failed');
    if (!deliveries || deliveries.length === 0) return [];

    const conversations = (
      await Promise.all(
        deliveries.map(async (delivery: any) => {
          const otherParty = courier
            ? delivery.sender
            : delivery.courier?.user;

          if (!otherParty) return null;

          const { data: lastMsg } = await sb
            .from('chat_messages')
            .select('body, sent_at, sender_id')
            .eq('delivery_id', delivery.id)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await sb
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('delivery_id', delivery.id)
            .neq('sender_id', userId);

          return {
            deliveryId: delivery.id,
            trackingCode: delivery.tracking_code,
            pickupAddress: delivery.pickup_address,
            dropoffAddress: delivery.dropoff_address,
            status: delivery.status,
            otherParty: {
              id: otherParty.id,
              fullName: otherParty.full_name || otherParty.phone || 'Unknown',
              phone: otherParty.phone,
              profilePhotoUrl: otherParty.profile_photo_url,
            },
            lastMessage: lastMsg?.body || null,
            lastMessageAt: lastMsg?.sent_at || null,
            lastMessageSenderId: lastMsg?.sender_id || null,
            unreadCount: count || 0,
          };
        }),
      )
    ).filter(Boolean);

    return conversations;
  }

  async getMessages(deliveryId: string, userId: string) {
    const { data: delivery, error } = await this.db.getClient()
      .from('deliveries')
      .select('*, courier:courier_id(user_id)')
      .eq('id', deliveryId)
      .maybeSingle();

    if (error || !delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.sender_id !== userId && delivery.courier?.user_id !== userId) {
      const user = await this.db.findOne('users', 'id', userId);
      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenException('Not authorized to view these messages');
      }
    }

    const { data: messages, error: msgError } = await this.db.getClient()
      .from('chat_messages')
      .select('*, sender:sender_id(id, full_name, role)')
      .eq('delivery_id', deliveryId)
      .order('sent_at', { ascending: true });
    if (msgError) throw new InternalServerErrorException(msgError.message || 'Database query failed');
    return mapRow(messages);
  }

  async sendMessage(deliveryId: string, userId: string, dto: SendMessageDto) {
    const { data: delivery, error } = await this.db.getClient()
      .from('deliveries')
      .select('*, courier:courier_id(user_id)')
      .eq('id', deliveryId)
      .maybeSingle();

    if (error || !delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.sender_id !== userId && delivery.courier?.user_id !== userId) {
      throw new ForbiddenException('Not authorized to send messages');
    }

    const { data: message, error: msgError } = await this.db.getClient()
      .from('chat_messages')
      .insert({ delivery_id: deliveryId, sender_id: userId, body: dto.body, photo_url: dto.photoUrl })
      .select('*, sender:sender_id(id, full_name, role)')
      .single();
    if (msgError) throw new InternalServerErrorException(msgError.message || 'Database query failed');

    const mapped = mapRow(message);
    this.gateway.emitMessageNew(deliveryId, mapped);
    return mapped;
  }
}
