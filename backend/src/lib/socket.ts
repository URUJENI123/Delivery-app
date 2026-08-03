import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './jwt';

export class DeliveryGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.registerHandlers();
  }

  private registerHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.toString().replace('Bearer ', '') ||
        (socket.handshake.query?.token as string);

      if (!token) {
        socket.disconnect();
        return;
      }

      try {
        const payload = verifyAccessToken(token as string);
        socket.data.userId = payload.sub;
        socket.data.role = payload.role;
      } catch {
        socket.disconnect();
        return;
      }

      socket.on('join:delivery', (id: string) => socket.join(`delivery:${id}`));
      socket.on('leave:delivery', (id: string) => socket.leave(`delivery:${id}`));
      socket.on('join:courier', (id: string) => socket.join(`courier:${id}`));
      socket.on('leave:courier', (id: string) => socket.leave(`courier:${id}`));

      socket.on(
        'location:update',
        (data: {
          deliveryId: string;
          lat: number;
          lng: number;
          accuracy?: number;
          heading?: number;
          speed?: number;
        }) => {
          this.io.to(`delivery:${data.deliveryId}`).emit('courier:location', data);
        },
      );

      socket.on('status:update', (data: { deliveryId: string; status: string }) => {
        this.io
          .to(`delivery:${data.deliveryId}`)
          .emit('delivery:status', { ...data, timestamp: new Date().toISOString() });
      });
    });
  }

  emitJobAvailable(courierUserId: string, delivery: unknown) {
    this.io.to(`courier:${courierUserId}`).emit('job:available', { delivery });
  }

  emitJobCancelled(deliveryId: string) {
    this.io.to(`delivery:${deliveryId}`).emit('job:cancelled', { deliveryId });
  }

  emitCourierInterested(deliveryId: string, data: unknown) {
    this.io.to(`delivery:${deliveryId}`).emit('courier:interested', data);
  }

  emitDeliveryStatus(deliveryId: string, data: unknown) {
    this.io.to(`delivery:${deliveryId}`).emit('delivery:status', data);
  }

  emitMessageNew(deliveryId: string, message: unknown) {
    this.io.to(`delivery:${deliveryId}`).emit('message:new', message);
  }
}
