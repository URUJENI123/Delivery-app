import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin';

export async function getDashboard(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await adminService.getDashboard()); }
  catch (err) { next(err); }
}

export async function listCouriers(req: Request, res: Response, next: NextFunction) {
  try {
    const { tier, approved, zone } = req.query as Record<string, string>;
    res.json(await adminService.listCouriers({
      tier,
      approved: approved !== undefined ? approved === 'true' : undefined,
      zone,
    }));
  } catch (err) { next(err); }
}

export async function verifyCourier(req: Request, res: Response, next: NextFunction) {
  try { res.json(await adminService.verifyCourier(req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function suspendCourier(req: Request, res: Response, next: NextFunction) {
  try { res.json(await adminService.suspendCourier(req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, search } = req.query as Record<string, string>;
    res.json(await adminService.listUsers({ role, search }));
  } catch (err) { next(err); }
}

export async function listDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as Record<string, string>;
    res.json(await adminService.listDeliveries({ status }));
  } catch (err) { next(err); }
}

export async function listDisputes(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await adminService.listDisputes()); }
  catch (err) { next(err); }
}

export async function updateDispute(req: Request, res: Response, next: NextFunction) {
  try { res.json(await adminService.updateDispute(req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function getLiveMap(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await adminService.getLiveMap()); }
  catch (err) { next(err); }
}

export async function getPlatformRevenue(_req: Request, res: Response, next: NextFunction) {
  try {
    const { getPlatformRevenue } = await import('../services/wallet');
    res.json(await getPlatformRevenue());
  } catch (err) { next(err); }
}

export async function withdrawPlatformRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const { withdrawPlatformRevenue } = await import('../services/wallet');
    const { amount, phoneNumber, provider } = req.body;
    res.status(201).json(
      await withdrawPlatformRevenue(req.user!.id, amount, phoneNumber, provider),
    );
  } catch (err) { next(err); }
}
