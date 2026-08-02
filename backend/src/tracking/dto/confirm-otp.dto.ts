import { IsString } from 'class-validator';

export class ConfirmOtpDto {
  @IsString()
  otp: string;
}
