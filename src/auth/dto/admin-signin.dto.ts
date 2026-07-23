import { IsEmail, IsString } from 'class-validator';

export class AdminSigninDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
