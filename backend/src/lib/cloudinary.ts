import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export const ALLOWED_FOLDERS = [
  'selfies',
  'id-photos',
  'vehicle-photos',
  'jacket-photos',
  'license-photos',
  'delivery-photos',
  'avatars',
  'courier-selfies',
  'courier-documents',
] as const;

export type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function generateSignedUpload(folder: UploadFolder) {
  const timestamp = Math.round(Date.now() / 1000);
  const publicId  = `${folder}/${timestamp}-${Math.random().toString(36).slice(2, 9)}`;

  const paramsToSign: Record<string, string | number> = {
    folder,
    public_id:     publicId,
    resource_type: 'image',
    max_file_size: MAX_FILE_SIZE_BYTES,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    publicUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
    fields: {
      api_key:       process.env.CLOUDINARY_API_KEY!,
      timestamp,
      signature,
      folder,
      public_id:     publicId,
      resource_type: 'image',
      max_file_size: MAX_FILE_SIZE_BYTES,
    },
    folder,
  };
}

export async function deleteFile(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`[Cloudinary] Failed to delete ${publicId}:`, (err as Error).message);
  }
}
