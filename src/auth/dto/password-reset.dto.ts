import { IsString, IsEmail, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class UpdatePasswordDto {
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ResendConfirmationDto {
  @IsEmail()
  email: string;
}