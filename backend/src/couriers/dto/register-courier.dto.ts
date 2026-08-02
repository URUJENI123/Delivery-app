import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class RegisterCourierDto {
  @IsString()
  @IsOptional()
  nationalIdNumber?: string;

  @IsString()
  @IsOptional()
  motorcyclePlate?: string;

  @IsString()
  @IsOptional()
  associationCode?: string;

  @IsString()
  @IsOptional()
  operatingZone?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  momoNumber?: string;

  @IsString()
  @IsOptional()
  momoProvider?: string;
}

export class UpdateCourierDto {
  @IsString()
  @IsOptional()
  motorcyclePlate?: string;

  @IsString()
  @IsOptional()
  operatingZone?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  momoNumber?: string;

  @IsString()
  @IsOptional()
  momoProvider?: string;
}

export class ToggleOnlineDto {
  @IsBoolean()
  isOnline: boolean;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;
}

export class UpdateLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @IsNumber()
  @IsOptional()
  heading?: number;

  @IsNumber()
  @IsOptional()
  speed?: number;
}

export class NearbyQueryDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsNumber()
  @IsOptional()
  radiusKm?: number;
}
