import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('storage')
@UseGuards(SupabaseAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  async generatePresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.storageService.generatePresignedUrl(dto.fileName, dto.contentType, dto.folder);
  }
}
