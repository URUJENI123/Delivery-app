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
] as const;

export type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function generateSignedUpload(folder: UploadFolder) {
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    folder,
    resource_type: 'image',
    max_file_size: MAX_FILE_SIZE_BYTES,
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

export async function deleteFile(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`[Cloudinary] Failed to delete ${publicId}:`, (err as Error).message);
  }
}
