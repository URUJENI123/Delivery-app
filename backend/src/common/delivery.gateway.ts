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
import { JwtService } from '@nestjs/jwt';

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

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers?.authorization?.replace('Bearer ', '') as string) ||
      (client.handshake.query?.token as string);

    if (!token) {
      this.logger.warn(`Client ${client.id} disconnected: no token`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; role: string }>(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Client ${client.id} disconnected: invalid token`);
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

  emitJobAvailable(courierUserId: string, delivery: any) {
    this.server.to(`courier:${courierUserId}`).emit('job:available', { delivery });
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
