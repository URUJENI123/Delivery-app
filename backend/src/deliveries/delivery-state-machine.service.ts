import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { DeliveryStatus, EventType } from '../types';

const VALID_TRANSITIONS: Record<string, DeliveryStatus[]> = {
  DRAFT:            ['BROADCAST'],
  BROADCAST:        ['COURIER_ASSIGNED', 'CANCELLED'],
  COURIER_ASSIGNED: ['COURIER_CONFIRMED', 'BROADCAST', 'CANCELLED'],
  COURIER_CONFIRMED:['PICKUP_EN_ROUTE', 'CANCELLED'],
  PICKUP_EN_ROUTE:  ['ARRIVED_PICKUP', 'CANCELLED'],
  ARRIVED_PICKUP:   ['PICKED_UP', 'CANCELLED'],
  PICKED_UP:        ['IN_TRANSIT', 'DISPUTED'],
  IN_TRANSIT:       ['ARRIVED_DROPOFF', 'DISPUTED'],
  ARRIVED_DROPOFF:  ['DELIVERED', 'FAILED', 'DISPUTED'],
  DELIVERED:        [],
  CANCELLED:        [],
  DISPUTED:         [],
  FAILED:           [],
} as any;

@Injectable()
export class DeliveryStateMachineService {
  private readonly logger = new Logger(DeliveryStateMachineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async transition(
    deliveryId: string,
    newStatus: DeliveryStatus,
    userId?: string,
    metadata?: Record<string, any>,
  ) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new BadRequestException('Delivery not found');

    const allowed: DeliveryStatus[] = VALID_TRANSITIONS[delivery.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${delivery.status} to ${newStatus}`,
      );
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'CANCELLED') updateData.cancelledAt = new Date();
    if (newStatus === 'PICKED_UP')  updateData.pickedUpAt  = new Date();
    if (newStatus === 'DELIVERED')  updateData.deliveredAt = new Date();

    const [updated] = await this.prisma.$transaction([
      this.prisma.delivery.update({ where: { id: deliveryId }, data: updateData }),
      this.prisma.deliveryEvent.create({
        data: {
          deliveryId,
          userId: userId || null,
          eventType: this.mapStatusToEvent(newStatus),
          metadata: metadata ?? {},
          lat: metadata?.lat ?? null,
          lng: metadata?.lng ?? null,
        },
      }),
    ]);

    this.logger.log(`Delivery ${deliveryId}: ${delivery.status} → ${newStatus}`);
    return updated;
  }

  private mapStatusToEvent(status: DeliveryStatus): EventType {
    const map: Record<string, EventType> = {
      DRAFT:            EventType.DELIVERY_CREATED,
      BROADCAST:        EventType.BROADCAST_SENT,
      COURIER_ASSIGNED: EventType.COURIER_SELECTED,
      COURIER_CONFIRMED:EventType.COURIER_CONFIRMED,
      PICKUP_EN_ROUTE:  EventType.COURIER_DEPARTED_PICKUP,
      ARRIVED_PICKUP:   EventType.COURIER_ARRIVED_PICKUP,
      PICKED_UP:        EventType.PACKAGE_PICKED_UP,
      IN_TRANSIT:       EventType.PACKAGE_PICKED_UP,
      ARRIVED_DROPOFF:  EventType.COURIER_ARRIVED_DROPOFF,
      DELIVERED:        EventType.DELIVERY_COMPLETED,
      CANCELLED:        EventType.DELIVERY_CANCELLED,
      DISPUTED:         EventType.DISPUTE_RAISED,
      FAILED:           EventType.DELIVERY_CANCELLED,
    };
    return map[status] ?? EventType.DELIVERY_CREATED;
  }

  canCancel(status: DeliveryStatus): boolean {
    return [
      DeliveryStatus.DRAFT,
      DeliveryStatus.BROADCAST,
      DeliveryStatus.COURIER_ASSIGNED,
      DeliveryStatus.COURIER_CONFIRMED,
      DeliveryStatus.PICKUP_EN_ROUTE,
      DeliveryStatus.ARRIVED_PICKUP,
    ].includes(status);
  }
}
