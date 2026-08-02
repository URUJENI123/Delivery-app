import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SenderSignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;
}
