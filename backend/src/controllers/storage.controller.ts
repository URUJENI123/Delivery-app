import { Request, Response, NextFunction } from 'express';
import { generateSignedUpload, ALLOWED_FOLDERS, UploadFolder } from '../lib/cloudinary';
import { BadRequestError } from '../lib/errors';

export function getSignedUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const { folder } = req.body as { folder: string };
    if (!ALLOWED_FOLDERS.includes(folder as UploadFolder)) {
      throw new BadRequestError(`Invalid folder. Allowed: ${ALLOWED_FOLDERS.join(', ')}`);
    }
    res.json(generateSignedUpload(folder as UploadFolder));
  } catch (err) { next(err); }
}
