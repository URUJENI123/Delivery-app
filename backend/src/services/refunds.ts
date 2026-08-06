/**
 * Refund Request Service
 * ─────────────────────
 * Handles the full refund lifecycle:
 *
 *   1. Sender requests a refund (POST /deliveries/:id/refund-request)
 *      → creates a RefundRequest row (status: PENDING_REVIEW)
 *      → emits 'refund:requested' WebSocket event to all admin sockets
 *
 *   2. Admin reviews in the admin panel (GET /admin/refunds)
 *
 *   3. Admin approves (PUT /admin/refunds/:id/approve)
 *      → fires real MoMo disbursement to sender's phone
 *      → marks status = DISBURSED on webhook confirmation
 *
 *   4. Admin rejects (PUT /admin/refunds/:id/reject)
 *      → status = REJECTED, optional adminNote stored
 *      → sender notified (stub)
 *
 * Rules:
 *   - Only deliveries with paymentStatus = HELD or RELEASED can have a refund request
 *   - One active refund request per delivery (throws if PENDING_REVIEW already exists)
 *   - Disbursement goes to the sender's MoMo phone (provided at request time)
 */

import prisma from '../lib/prisma';
import * as payments from './payments';
import * as notifications from './notifications';
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors';
import type { DeliveryGateway } from '../lib/socket';

let gateway: DeliveryGateway | null = null;
export function setGateway(gw: DeliveryGateway) { gateway = gw; }

// ─── Sender requests a refund ────────────────────────────────────────────────

export async function requestRefund(params: {
  deliveryId:   string;
  senderUserId: string;
  reason:       string;
  phoneNumber:  string;   // MoMo number to disburse to if approved
  provider?:    string;   // MTN | AIRTEL — auto-detected if omitted
}) {
  const { deliveryId, senderUserId, reason, phoneNumber, provider } = params;

  const delivery = await prisma.delivery.findUnique({
    where:   { id: deliveryId },
    include: { sender: { select: { id: true, fullName: true, phone: true } } },
  });
  if (!delivery)                          throw new NotFoundError('Delivery not found');
  if (delivery.senderId !== senderUserId) throw new ForbiddenError('Not your delivery');

  // Only makes sense if money was actually paid — HELD (escrow, not yet completed)
  // or RELEASED (completed — for post-delivery refunds like disputes).
  if (!['HELD', 'RELEASED'].includes(delivery.paymentStatus)) {
    throw new BadRequestError('No payment is being held for this delivery — nothing to refund');
  }

  // Prevent duplicate pending requests
  const existing = await prisma.refundRequest.findFirst({
    where: { deliveryId, status: 'PENDING_REVIEW' },
  });
  if (existing) {
    throw new BadRequestError('A refund request is already pending admin review for this delivery');
  }

  const amount = delivery.agreedPriceRwf ?? delivery.quotedPriceRwf ?? 0;
  if (amount <= 0) throw new BadRequestError('Cannot determine refund amount for this delivery');

  const refundRequest = await prisma.refundRequest.create({
    data: {
      deliveryId,
      requestedById: senderUserId,
      amountRwf:     amount,
      reason,
      phoneNumber,
      provider:      provider?.toUpperCase() ?? null,
      status:        'PENDING_REVIEW',
    },
    include: {
      delivery:    { select: { id: true, pickupAddress: true, dropoffAddress: true, status: true } },
      requestedBy: { select: { id: true, fullName: true, phone: true } },
    },
  });

  // Notify all admins via WebSocket (real-time) + console log (SMS stub)
  gateway?.emitToAdmins('refund:requested', {
    refundRequestId: refundRequest.id,
    deliveryId,
    senderName:  delivery.sender.fullName ?? 'Unknown',
    amountRwf:   amount,
    reason,
    createdAt:   refundRequest.createdAt,
  });
  notifications.notifyRefundRequested(
    delivery.sender.fullName ?? 'A sender',
    amount,
    deliveryId.slice(0, 8).toUpperCase(),
  ).catch(() => {});

  console.log(`[Refund] New request — delivery #${deliveryId.slice(0, 8).toUpperCase()}, amount: RWF ${amount}, from: ${delivery.sender.fullName}`);

  return refundRequest;
}

// ─── List refund requests (admin) ────────────────────────────────────────────

export async function listRefundRequests(filter?: { status?: string }) {
  return prisma.refundRequest.findMany({
    where:   { status: filter?.status ? (filter.status as any) : undefined },
    include: {
      delivery:    { select: { id: true, pickupAddress: true, dropoffAddress: true, status: true, paymentStatus: true } },
      requestedBy: { select: { id: true, fullName: true, phone: true } },
      reviewedBy:  { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Admin approves refund ────────────────────────────────────────────────────

export async function approveRefund(refundRequestId: string, adminUserId: string, adminNote?: string) {
  const req = await prisma.refundRequest.findUnique({
    where:   { id: refundRequestId },
    include: { delivery: true, requestedBy: { select: { phone: true, fullName: true } } },
  });
  if (!req) throw new NotFoundError('Refund request not found');
  if (req.status !== 'PENDING_REVIEW') {
    throw new BadRequestError(`Refund is already ${req.status.toLowerCase().replace('_', ' ')}`);
  }
  if (!req.phoneNumber) {
    throw new BadRequestError('No MoMo phone number on this refund request');
  }

  // Mark as approved first — then attempt disbursement
  await prisma.refundRequest.update({
    where: { id: refundRequestId },
    data:  {
      status:       'APPROVED',
      reviewedById: adminUserId,
      reviewedAt:   new Date(),
      adminNote:    adminNote ?? null,
    },
  });

  // Fire MoMo disbursement to sender's phone
  try {
    const result = await payments.disburse({
      phoneNumber: req.phoneNumber,
      amountRwf:   req.amountRwf,
      referenceId: req.id,
      note:        `Delivery App refund — delivery #${req.deliveryId.slice(0, 8).toUpperCase()}`,
      provider:    req.provider ? (req.provider as payments.MobileProvider) : undefined,
    });

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data:  {
        status:        'DISBURSED',
        disbursedAt:   new Date(),
        transactionId: result.transactionId,
      },
    });

    // Update delivery paymentStatus to REFUNDED
    await prisma.delivery.update({
      where: { id: req.deliveryId },
      data:  { paymentStatus: 'REFUNDED' },
    });

    // Notify sender
    notifications.notifyRefundApproved(
      req.requestedBy.phone ?? '',
      req.amountRwf,
      req.requestedBy.fullName ?? 'Sender',
    ).catch(() => {});

    // Notify via WebSocket
    gateway?.emitToUser(req.requestedById, 'refund:approved', {
      refundRequestId,
      amountRwf:     req.amountRwf,
      transactionId: result.transactionId,
      message:       `Your refund of RWF ${req.amountRwf.toLocaleString()} has been approved and sent to ${req.phoneNumber}.`,
    });

    console.log(`[Refund] APPROVED & DISBURSED — ${refundRequestId}, RWF ${req.amountRwf} → ${req.phoneNumber}`);

    return {
      success:       true,
      status:        'DISBURSED',
      transactionId: result.transactionId,
      amountRwf:     req.amountRwf,
      phone:         req.phoneNumber,
    };
  } catch (disbErr: any) {
    // Disbursement failed — revert to PENDING_REVIEW so admin can retry
    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data:  {
        status:    'PENDING_REVIEW',
        adminNote: `Disbursement failed: ${disbErr.message}`,
      },
    });
    throw new BadRequestError(`Refund disbursement failed: ${disbErr.message}`);
  }
}

// ─── Admin rejects refund ─────────────────────────────────────────────────────

export async function rejectRefund(refundRequestId: string, adminUserId: string, adminNote: string) {
  const req = await prisma.refundRequest.findUnique({
    where:   { id: refundRequestId },
    include: { requestedBy: { select: { phone: true, fullName: true } } },
  });
  if (!req) throw new NotFoundError('Refund request not found');
  if (req.status !== 'PENDING_REVIEW') {
    throw new BadRequestError(`Refund is already ${req.status.toLowerCase().replace('_', ' ')}`);
  }
  if (!adminNote?.trim()) {
    throw new BadRequestError('A reason is required when rejecting a refund request');
  }

  await prisma.refundRequest.update({
    where: { id: refundRequestId },
    data:  {
      status:       'REJECTED',
      reviewedById: adminUserId,
      reviewedAt:   new Date(),
      adminNote,
    },
  });

  // Notify sender via WebSocket
  gateway?.emitToUser(req.requestedById, 'refund:rejected', {
    refundRequestId,
    adminNote,
    message: `Your refund request has been reviewed. Reason: ${adminNote}`,
  });

  // Notify via SMS (stub)
  notifications.notifyRefundRejected(
    req.requestedBy.phone ?? '',
    adminNote,
  ).catch(() => {});

  console.log(`[Refund] REJECTED — ${refundRequestId} by admin ${adminUserId}`);

  return { success: true, status: 'REJECTED', adminNote };
}

// ─── Get single refund request ────────────────────────────────────────────────

export async function getRefundRequest(refundRequestId: string) {
  const req = await prisma.refundRequest.findUnique({
    where:   { id: refundRequestId },
    include: {
      delivery:    { select: { id: true, pickupAddress: true, dropoffAddress: true, status: true, paymentStatus: true, agreedPriceRwf: true } },
      requestedBy: { select: { id: true, fullName: true, phone: true } },
      reviewedBy:  { select: { id: true, fullName: true } },
    },
  });
  if (!req) throw new NotFoundError('Refund request not found');
  return req;
}
