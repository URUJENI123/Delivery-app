import { IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  body: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}
