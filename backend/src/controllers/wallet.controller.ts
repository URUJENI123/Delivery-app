import { Request, Response, NextFunction } from 'express';
import * as walletService from '../services/wallet';

export async function getWallet(req: Request, res: Response, next: NextFunction) {
  try { res.json(await walletService.getWallet(req.user!.id)); }
  catch (err) { next(err); }
}

export async function topUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, method } = req.body;
    res.status(201).json(await walletService.topUp(req.user!.id, amount, method ?? 'mobile_money'));
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
