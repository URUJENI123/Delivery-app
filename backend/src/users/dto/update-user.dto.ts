import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsUrl()
  @IsOptional()
  profilePhotoUrl?: string;
}
