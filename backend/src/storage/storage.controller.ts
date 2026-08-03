import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { StorageService, ALLOWED_FOLDERS, UploadFolder } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class GetSignedUploadDto {
  @IsString()
  @IsIn(ALLOWED_FOLDERS)
  folder: UploadFolder;
}

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * POST /storage/signed-upload
   * Returns a signed upload signature + URL.
   * The client uploads directly to Cloudinary — no file bytes hit this server.
   */
  @Post('signed-upload')
  getSignedUpload(@Body() dto: GetSignedUploadDto) {
    return this.storageService.generateSignedUpload(dto.folder);
  }
}
