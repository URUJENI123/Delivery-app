import prisma from '../lib/prisma';
import { BadRequestError } from '../lib/errors';
import { DeliveryStatus, EventType } from '../types';

const VALID_TRANSITIONS: Record<string, DeliveryStatus[]> = {
  DRAFT:             [DeliveryStatus.BROADCAST],
  BROADCAST:         [DeliveryStatus.COURIER_ASSIGNED, DeliveryStatus.CANCELLED],
  COURIER_ASSIGNED:  [DeliveryStatus.COURIER_CONFIRMED, DeliveryStatus.BROADCAST, DeliveryStatus.CANCELLED],
  COURIER_CONFIRMED: [DeliveryStatus.PICKUP_EN_ROUTE, DeliveryStatus.CANCELLED],
  PICKUP_EN_ROUTE:   [DeliveryStatus.ARRIVED_PICKUP, DeliveryStatus.CANCELLED],
  ARRIVED_PICKUP:    [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED],
  PICKED_UP:         [DeliveryStatus.IN_TRANSIT, DeliveryStatus.DISPUTED],
  IN_TRANSIT:        [DeliveryStatus.ARRIVED_DROPOFF, DeliveryStatus.DISPUTED],
  ARRIVED_DROPOFF:   [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.DISPUTED],
  DELIVERED:         [],
  CANCELLED:         [],
  DISPUTED:          [],
  FAILED:            [],
};

const STATUS_EVENT_MAP: Record<string, EventType> = {
  DRAFT:             EventType.DELIVERY_CREATED,
  BROADCAST:         EventType.BROADCAST_SENT,
  COURIER_ASSIGNED:  EventType.COURIER_SELECTED,
  COURIER_CONFIRMED: EventType.COURIER_CONFIRMED,
  PICKUP_EN_ROUTE:   EventType.COURIER_DEPARTED_PICKUP,
  ARRIVED_PICKUP:    EventType.COURIER_ARRIVED_PICKUP,
  PICKED_UP:         EventType.PACKAGE_PICKED_UP,
  IN_TRANSIT:        EventType.PACKAGE_IN_TRANSIT,
  ARRIVED_DROPOFF:   EventType.COURIER_ARRIVED_DROPOFF,
  DELIVERED:         EventType.DELIVERY_COMPLETED,
  CANCELLED:         EventType.DELIVERY_CANCELLED,
  DISPUTED:          EventType.DISPUTE_RAISED,
  FAILED:            EventType.DELIVERY_CANCELLED,
};

export async function transition(
  deliveryId: string,
  newStatus: DeliveryStatus,
  userId?: string,
  metadata?: Record<string, unknown>,
) {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new BadRequestError('Delivery not found');

  const allowed = VALID_TRANSITIONS[delivery.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(`Cannot transition from ${delivery.status} to ${newStatus}`);
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === DeliveryStatus.CANCELLED) updateData.cancelledAt = new Date();
  if (newStatus === DeliveryStatus.PICKED_UP)  updateData.pickedUpAt  = new Date();
  if (newStatus === DeliveryStatus.DELIVERED)  updateData.deliveredAt = new Date();

  const [updated] = await prisma.$transaction([
    prisma.delivery.update({ where: { id: deliveryId }, data: updateData }),
    prisma.deliveryEvent.create({
      data: {
        deliveryId,
        userId:    userId ?? null,
        eventType: (STATUS_EVENT_MAP[newStatus] ?? EventType.DELIVERY_CREATED) as any,
        metadata:  (metadata ?? {}) as any,
        lat:       (metadata?.lat as number) ?? null,
        lng:       (metadata?.lng as number) ?? null,
      },
    }),
  ]);

  console.log(`[StateMachine] Delivery ${deliveryId}: ${delivery.status} → ${newStatus}`);
  return updated;
}

export function canCancel(status: DeliveryStatus): boolean {
  return [
    DeliveryStatus.DRAFT,
    DeliveryStatus.BROADCAST,
    DeliveryStatus.COURIER_ASSIGNED,
    DeliveryStatus.COURIER_CONFIRMED,
    DeliveryStatus.PICKUP_EN_ROUTE,
    DeliveryStatus.ARRIVED_PICKUP,
  ].includes(status);
}
