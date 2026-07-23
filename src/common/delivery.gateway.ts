import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class DeliveryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DeliveryGateway.name);
  private supabase: SupabaseClient | null = null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (url && key && !url.includes('placeholder')) {
      this.supabase = createClient(url, key);
    } else {
      this.logger.warn('Supabase not configured — WebSocket auth disabled (dev mode)');
    }
  }

  async handleConnection(client: Socket) {
    // Dev mode: allow all connections when Supabase is not configured
    if (!this.supabase) {
      client.data.userId = `dev-user-${client.id}`;
      this.logger.log(`Client connected (dev mode, no auth): ${client.id}`);
      return;
    }

    const token = client.handshake.auth?.token
      || client.handshake.headers?.authorization?.replace('Bearer ', '')
      || client.handshake.query?.token as string;

    if (!token) {
      this.logger.warn(`Client ${client.id} disconnected: no token`);
      client.disconnect();
      return;
    }

    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      if (error || !user) {
        this.logger.warn(`Client ${client.id} disconnected: invalid token`);
        client.disconnect();
        return;
      }
      client.data.userId = user.id;
      client.data.supabaseId = user.id;
      this.logger.log(`Client connected: ${client.id} (user: ${user.id})`);
    } catch {
      this.logger.warn(`Client ${client.id} disconnected: auth error`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:delivery')
  handleJoinDelivery(@ConnectedSocket() client: Socket, @MessageBody() deliveryId: string) {
    if (!client.data.userId) return;
    client.join(`delivery:${deliveryId}`);
    this.logger.log(`Client ${client.id} joined delivery:${deliveryId}`);
  }

  @SubscribeMessage('leave:delivery')
  handleLeaveDelivery(@ConnectedSocket() client: Socket, @MessageBody() deliveryId: string) {
    if (!client.data.userId) return;
    client.leave(`delivery:${deliveryId}`);
  }

  @SubscribeMessage('join:courier')
  handleJoinCourier(@ConnectedSocket() client: Socket, @MessageBody() courierId: string) {
    if (!client.data.userId) return;
    client.join(`courier:${courierId}`);
  }

  @SubscribeMessage('leave:courier')
  handleLeaveCourier(@ConnectedSocket() client: Socket, @MessageBody() courierId: string) {
    if (!client.data.userId) return;
    client.leave(`courier:${courierId}`);
  }

  @SubscribeMessage('location:update')
  handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deliveryId: string; lat: number; lng: number; accuracy?: number; heading?: number; speed?: number },
  ) {
    if (!client.data.userId) return;
    this.server.to(`delivery:${data.deliveryId}`).emit('courier:location', {
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
      heading: data.heading,
      speed: data.speed,
    });
  }

  @SubscribeMessage('status:update')
  handleStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deliveryId: string; status: string },
  ) {
    if (!client.data.userId) return;
    this.server.to(`delivery:${data.deliveryId}`).emit('delivery:status', {
      deliveryId: data.deliveryId,
      status: data.status,
      timestamp: new Date().toISOString(),
    });
  }

  emitJobAvailable(courierId: string, delivery: any) {
    this.server.to(`courier:${courierId}`).emit('job:available', { delivery });
  }

  emitJobCancelled(deliveryId: string) {
    this.server.to(`delivery:${deliveryId}`).emit('job:cancelled', { deliveryId });
  }

  emitCourierInterested(deliveryId: string, data: any) {
    this.server.to(`delivery:${deliveryId}`).emit('courier:interested', data);
  }

  emitMessageNew(deliveryId: string, message: any) {
    this.server.to(`delivery:${deliveryId}`).emit('message:new', message);
  }
}
