import { Request, Response, NextFunction } from 'express';
import * as couriersService from '../services/couriers';

export async function register(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await couriersService.register(req.user!.id, req.body)); }
  catch (err) { next(err); }
}

export async function startOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await couriersService.startOnboarding(req.user!.id, req.body);
    res.status(result.created ? 201 : 200).json(result);
  } catch (err) { next(err); }
}

export async function saveOnboardingStep(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.saveOnboardingStep(req.user!.id, req.body)); }
  catch (err) { next(err); }
}

export async function getOnboardingStatus(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.getOnboardingStatus(req.user!.id)); }
  catch (err) { next(err); }
}

export async function submitOnboarding(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.submitOnboarding(req.user!.id, req.body)); }
  catch (err) { next(err); }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.getProfile(req.user!.id)); }
  catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.updateProfile(req.user!.id, req.body)); }
  catch (err) { next(err); }
}

export async function toggleOnline(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.toggleOnline(req.user!.id, req.body)); }
  catch (err) { next(err); }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.updateLocation(req.user!.id, req.body)); }
  catch (err) { next(err); }
}

export async function getJobs(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.getJobs(req.user!.id)); }
  catch (err) { next(err); }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.getDashboard(req.user!.id)); }
  catch (err) { next(err); }
}

export async function getEarnings(req: Request, res: Response, next: NextFunction) {
  try { res.json(await couriersService.getEarnings(req.user!.id)); }
  catch (err) { next(err); }
}

export async function findNearby(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng, radius } = req.query as { lat: string; lng: string; radius?: string };
    res.json(await couriersService.findNearby(Number(lat), Number(lng), radius ? Number(radius) : undefined));
  } catch (err) { next(err); }
}
