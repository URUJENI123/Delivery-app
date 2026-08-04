import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth';
import { UserRole } from '../types';

const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE  = { httpOnly: true, secure: IS_PROD, sameSite: 'lax' as const };

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token',  accessToken,  { ...COOKIE, maxAge: 60 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...COOKIE, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export async function senderSignup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName } = req.body;
    const result = await authService.senderSignup(email, password, fullName);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function senderSignin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.senderSignin(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json(result);
  } catch (err) { next(err); }
}

export async function adminSignin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.adminSignin(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json(result);
  } catch (err) { next(err); }
}

export async function courierSignup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName, phone } = req.body;
    const result = await authService.courierSignup(email, password, fullName, phone);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function courierSignin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.courierSignin(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json(result);
  } catch (err) { next(err); }
}

export async function checkCourierPhone(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.checkCourierPhone(req.body.phone));
  } catch (err) { next(err); }
}

export async function courierRequestOtp(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.courierRequestOtp(req.body.phone));
  } catch (err) { next(err); }
}

export async function courierVerifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, token } = req.body;
    const result = await authService.courierVerifyOtp(phone, token);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json(result);
  } catch (err) { next(err); }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.googleAuth(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json(result);
  } catch (err) { next(err); }
}

export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body.refresh_token || req.cookies?.refresh_token;
    const result = await authService.refreshToken(token);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.getProfile(req.user!.id));
  } catch (err) { next(err); }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, role } = req.body;
    res.json(await authService.updateRole(userId, role as UserRole));
  } catch (err) { next(err); }
}

export async function requestPasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.requestPasswordReset(req.body.email));
  } catch (err) { next(err); }
}

export async function updatePassword(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.updatePassword(req.user!.id, req.body.newPassword));
  } catch (err) { next(err); }
}

export async function getSessions(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await authService.getSessions(req.user!.id));
  } catch (err) { next(err); }
}

export async function revokeAllSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.revokeAllSessions(req.user!.id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json(result);
  } catch (err) { next(err); }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out successfully' });
}
