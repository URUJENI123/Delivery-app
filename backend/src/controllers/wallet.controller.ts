import { Request, Response, NextFunction } from 'express';
import * as walletService from '../services/wallet';

export async function getWallet(req: Request, res: Response, next: NextFunction) {
  try { res.json(await walletService.getWallet(req.user!.id)); }
  catch (err) { next(err); }
}

export async function topUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, method, phoneNumber } = req.body;
    res.status(201).json(
      await walletService.topUp(req.user!.id, amount, method ?? 'mobile_money', phoneNumber),
    );
  } catch (err) { next(err); }
}

export async function withdraw(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, method, provider, accountNumber } = req.body;
    res.status(201).json(
      await walletService.withdraw(req.user!.id, amount, method ?? 'mobile_money', provider, accountNumber),
    );
  } catch (err) { next(err); }
}

/** GET /wallet/payment-status/:id — poll MoMo provider for a pending payment */
export async function checkPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try { res.json(await walletService.checkPaymentStatus(req.params.id)); }
  catch (err) { next(err); }
}

/** POST /wallet/webhook — receives MTN / Airtel payment callbacks (no auth — IP whitelist instead) */
export async function paymentWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await walletService.handleProviderWebhook(req.body);
    res.json(result);
  } catch (err) { next(err); }
}
