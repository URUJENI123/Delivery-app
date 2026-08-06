import { Request, Response, NextFunction } from 'express';
import * as refundService from '../services/refunds';

/** POST /deliveries/:id/refund-request — sender submits a refund request */
export async function requestRefund(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason, phoneNumber, provider } = req.body;
    res.status(201).json(
      await refundService.requestRefund({
        deliveryId:   req.params.id,
        senderUserId: req.user!.id,
        reason,
        phoneNumber,
        provider,
      }),
    );
  } catch (err) { next(err); }
}

/** GET /admin/refunds — list all refund requests (admin) */
export async function listRefunds(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as { status?: string };
    res.json(await refundService.listRefundRequests({ status }));
  } catch (err) { next(err); }
}

/** GET /admin/refunds/:id — get single refund request (admin) */
export async function getRefund(req: Request, res: Response, next: NextFunction) {
  try { res.json(await refundService.getRefundRequest(req.params.id)); }
  catch (err) { next(err); }
}

/** PUT /admin/refunds/:id/approve — admin approves and disburses (admin) */
export async function approveRefund(req: Request, res: Response, next: NextFunction) {
  try {
    const { adminNote } = req.body;
    res.json(
      await refundService.approveRefund(req.params.id, req.user!.id, adminNote),
    );
  } catch (err) { next(err); }
}

/** PUT /admin/refunds/:id/reject — admin rejects with reason (admin) */
export async function rejectRefund(req: Request, res: Response, next: NextFunction) {
  try {
    const { adminNote } = req.body;
    res.json(
      await refundService.rejectRefund(req.params.id, req.user!.id, adminNote),
    );
  } catch (err) { next(err); }
}
