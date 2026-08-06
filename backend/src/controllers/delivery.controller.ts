import { Request, Response, NextFunction } from 'express';
import * as deliveriesService from '../services/deliveries';

export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await deliveriesService.create(req.user!.id, req.body)); }
  catch (err) { next(err); }
}

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.findAll(req.user!.id, req.user!.role)); }
  catch (err) { next(err); }
}

export async function findOne(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.findOne(req.params.id)); }
  catch (err) { next(err); }
}

export async function getAvailable(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.getNearbyAvailable(req.user!.id)); }
  catch (err) { next(err); }
}

export async function expressInterest(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await deliveriesService.expressInterest(req.params.id, req.user!.id, req.body)); }
  catch (err) { next(err); }
}

export async function takeJob(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.takeJob(req.params.id, req.user!.id, req.body.proposedPriceRwf)); }
  catch (err) { next(err); }
}

export async function confirmAgreement(req: Request, res: Response, next: NextFunction) {
  try {
    const { agreedPriceRwf, agreedDeliveryTime } = req.body;
    res.json(await deliveriesService.confirmAgreement(req.params.id, req.user!.id, agreedPriceRwf, agreedDeliveryTime));
  } catch (err) { next(err); }
}

export async function pay(req: Request, res: Response, next: NextFunction) {
  try {
    const { agreedDeliveryTime, phoneNumber, provider } = req.body;
    res.json(
      await deliveriesService.submitPayment(
        req.params.id, req.user!.id, phoneNumber, provider, agreedDeliveryTime,
      ),
    );
  } catch (err) { next(err); }
}

export async function startDelivery(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.startDelivery(req.params.id, req.user!.id)); }
  catch (err) { next(err); }
}

export async function arrivedAtPickup(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.arrivedAtPickup(req.params.id, req.user!.id, req.body.otp)); }
  catch (err) { next(err); }
}

export async function pickedUp(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.pickedUp(req.params.id, req.user!.id)); }
  catch (err) { next(err); }
}

export async function inTransit(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.inTransit(req.params.id, req.user!.id)); }
  catch (err) { next(err); }
}

export async function courierArrived(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.courierArrived(req.params.id, req.user!.id)); }
  catch (err) { next(err); }
}

export async function completeDelivery(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.completeDelivery(req.params.id, req.user!.id, req.body.otp)); }
  catch (err) { next(err); }
}

export async function createRating(req: Request, res: Response, next: NextFunction) {
  try {
    const { stars, comment } = req.body;
    res.status(201).json(await deliveriesService.createRating(req.params.id, req.user!.id, stars, comment));
  } catch (err) { next(err); }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try { res.json(await deliveriesService.cancel(req.params.id, req.user!.id)); }
  catch (err) { next(err); }
}
