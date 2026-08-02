import { IsEmail, IsString } from 'class-validator';

export class SenderSigninDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
