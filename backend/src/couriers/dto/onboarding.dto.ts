import { IsString, IsOptional, IsNumber, IsBoolean, MinLength, IsPhoneNumber } from 'class-validator';

export class StartOnboardingDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}

export class SaveOnboardingStepDto {
  @IsNumber()
  step: number;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  nationalIdNumber?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  motorcyclePlate?: string;

  @IsString()
  @IsOptional()
  associationCode?: string;

  @IsString()
  @IsOptional()
  jacketSerialNumber?: string;

  @IsString()
  @IsOptional()
  operatingZone?: string;

  @IsString()
  @IsOptional()
  momoNumber?: string;

  @IsString()
  @IsOptional()
  momoProvider?: string;

  @IsString()
  @IsOptional()
  selfieUrl?: string;

  @IsString()
  @IsOptional()
  idPhotoUrl?: string;

  @IsString()
  @IsOptional()
  vehiclePhotoFrontUrl?: string;

  @IsString()
  @IsOptional()
  vehiclePhotoRearUrl?: string;

  @IsString()
  @IsOptional()
  licensePhotoUrl?: string;

  @IsString()
  @IsOptional()
  jacketPhotoUrl?: string;
}

export class SubmitOnboardingDto {
  @IsBoolean()
  agreeToTerms: boolean;
}
