import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

/** Folders we allow uploads to — prevents clients from writing arbitrary paths */
export const ALLOWED_FOLDERS = [
  'selfies',
  'id-photos',
  'vehicle-photos',
  'jacket-photos',
  'license-photos',
  'delivery-photos',
  'avatars',
] as const;

export type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

export interface SignedUploadParams {
  /** POST this URL from the client */
  uploadUrl: string;
  /** Include all of these fields in the multipart form alongside the file */
  fields: {
    api_key: string;
    timestamp: number;
    signature: string;
    folder: string;
    /** Restricts what file types are accepted (e.g. 'image') */
    resource_type: string;
    /** Max file size in bytes enforced by Cloudinary */
    max_file_size: number;
  };
  /** Cloudinary public_id prefix so the app can build a predictable URL */
  folder: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    cloudinary.config({
      cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
      api_key:     process.env.CLOUDINARY_API_KEY,
      api_secret:  process.env.CLOUDINARY_API_SECRET,
      secure:      true,
    });
  }

  /**
   * Generates a short-lived signed upload signature.
   * The client POSTs directly to Cloudinary using the returned URL + fields —
   * file bytes never pass through this server.
   *
   * @param folder  One of the ALLOWED_FOLDERS values
   * @returns       Signed upload parameters the client needs
   */
  generateSignedUpload(folder: UploadFolder): SignedUploadParams {
    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new InternalServerErrorException(`Invalid upload folder: ${folder}`);
    }

    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign: Record<string, string | number> = {
      folder,
      resource_type:  'image',
      max_file_size:  MAX_FILE_SIZE_BYTES,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!,
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      fields: {
        api_key:       process.env.CLOUDINARY_API_KEY!,
        timestamp,
        signature,
        folder,
        resource_type: 'image',
        max_file_size: MAX_FILE_SIZE_BYTES,
      },
      folder,
    };
  }

  /**
   * Deletes a file from Cloudinary by its public_id.
   * Used when replacing profile photos or cleaning up failed onboardings.
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${(error as Error).message}`);
      // Non-critical — don't throw, just log
    }
  }
}
