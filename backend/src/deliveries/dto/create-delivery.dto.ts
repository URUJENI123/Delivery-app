import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { PackageCategory, PackageSize, PaymentMethod } from '../../types';

export class CreateDeliveryDto {
  @IsString()
  pickupAddress: string;

  @IsNumber()
  pickupLat: number;

  @IsNumber()
  pickupLng: number;

  @IsString()
  @IsOptional()
  pickupNotes?: string;

  @IsString()
  @IsOptional()
  pickupEmail?: string;

  @IsString()
  dropoffAddress: string;

  @IsNumber()
  dropoffLat: number;

  @IsNumber()
  dropoffLng: number;

  @IsString()
  @IsOptional()
  dropoffNotes?: string;

  @IsString()
  @IsOptional()
  dropoffEmail?: string;

  @IsString()
  itemDescription: string;

  @IsEnum(PackageCategory)
  category: PackageCategory;

  @IsEnum(PackageSize)
  size: PackageSize;

  @IsNumber()
  @IsOptional()
  estimatedValueRwf?: number;

  @IsBoolean()
  @IsOptional()
  isFragile?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresRecipientOtp?: boolean;

  @IsString()
  pickupContactName: string;

  @IsString()
  pickupContactPhone: string;

  @IsString()
  recipientName: string;

  @IsString()
  recipientPhone: string;

  @IsDateString()
  @IsOptional()
  scheduledPickupAt?: string;

  @IsBoolean()
  @IsOptional()
  preferAsap?: boolean;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsNumber()
  @IsOptional()
  quotedPriceRwf?: number;
}

export class SelectCourierDto {
  @IsString()
  courierId: string;
}

export class ConfirmPickupDto {
  @IsString()
  otp: string;
}

export class UpdateStatusDto {
  @IsString()
  status: string;
}

export class InterestDto {
  @IsNumber()
  @IsOptional()
  proposedPriceRwf?: number;

  @IsNumber()
  @IsOptional()
  etaMinutes?: number;
}

export class CompleteDeliveryDto {
  @IsString()
  @IsOptional()
  otp?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class TakeJobDto {
  @IsNumber()
  @IsOptional()
  proposedPriceRwf?: number;
}

export class ConfirmAgreementDto {
  @IsNumber()
  agreedPriceRwf: number;

  @IsNumber()
  @IsOptional()
  agreedDeliveryTime?: number;
}

export class PayDto {
  @IsNumber()
  @IsOptional()
  agreedDeliveryTime?: number;
}

export class ArrivedAtPickupDto {
  @IsString()
  otp: string;
}

export class CreateRatingDto {
  @IsString()
  deliveryId: string;

  @IsNumber()
  stars: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
