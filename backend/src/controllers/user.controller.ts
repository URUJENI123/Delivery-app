import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, profilePhotoUrl } = req.body as { fullName?: string; profilePhotoUrl?: string };
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data:  { fullName: fullName ?? undefined, profilePhotoUrl: profilePhotoUrl ?? undefined },
    });
    const { passwordHash: _ph, ...safe } = user;
    res.json(safe);
  } catch (err) { next(err); }
}

export async function uploadPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const { photoUrl } = req.body as { photoUrl: string };
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data:  { profilePhotoUrl: photoUrl },
    });
    const { passwordHash: _ph, ...safe } = user;
    res.json(safe);
  } catch (err) { next(err); }
}
