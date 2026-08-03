import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Throttle } from '@nestjs/throttler';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../types';

class TopUpDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  method?: string;
}

class WithdrawDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;
}

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@CurrentUser() user: User) {
    return this.walletService.getWallet(user.id);
  }

  @Post('topup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async topUp(@CurrentUser() user: User, @Body() dto: TopUpDto) {
    return this.walletService.topUp(user.id, dto.amount, dto.method || 'mobile_money');
  }

  @Post('withdraw')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async withdraw(@CurrentUser() user: User, @Body() dto: WithdrawDto) {
    return this.walletService.withdraw(
      user.id,
      dto.amount,
      dto.method || 'mobile_money',
      dto.provider,
      dto.accountNumber,
    );
  }
}
