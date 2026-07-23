import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.R2_BUCKET_NAME || 'delivery-media';
    this.publicUrl = process.env.R2_PUBLIC_URL || 'https://media.delivery.rw';
  }

  async generatePresignedUrl(fileName: string, contentType: string, folder: string) {
    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    try {
      const url = await getSignedUrl(this.s3, command, { expiresIn: 900 });
      return {
        uploadUrl: url,
        publicUrl: `${this.publicUrl}/${key}`,
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${(error as Error).message}`);
      throw new Error('Failed to generate upload URL');
    }
  }
}
