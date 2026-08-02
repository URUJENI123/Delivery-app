import { IsString } from 'class-validator';

export class PresignedUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsString()
  folder: string;
}
