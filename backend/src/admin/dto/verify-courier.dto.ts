import { IsBoolean, IsString, IsOptional, IsEnum } from 'class-validator';
import { CourierVerificationTier } from '../../types';

export class VerifyCourierDto {
  @IsBoolean()
  approved: boolean;

  @IsEnum(CourierVerificationTier)
  @IsOptional()
  tier?: CourierVerificationTier;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class SuspendCourierDto {
  @IsString()
  reason: string;
}
