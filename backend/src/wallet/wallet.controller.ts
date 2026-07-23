import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WalletService } from './wallet.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../types';

@Controller('wallet')
@UseGuards(SupabaseAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@CurrentUser() user: User) {
    return this.walletService.getWallet(user.id);
  }

  @Post('topup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async topUp(@CurrentUser() user: User, @Body('amount') amount: number, @Body('method') method: string) {
    return this.walletService.topUp(user.id, amount, method || 'mobile_money');
  }

  @Post('withdraw')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async withdraw(@CurrentUser() user: User, @Body('amount') amount: number, @Body('method') method: string) {
    return this.walletService.withdraw(user.id, amount, method || 'mobile_money');
  }
}
