import { IsString, IsOptional } from 'class-validator';

export class GoogleCallbackDto {
  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}
