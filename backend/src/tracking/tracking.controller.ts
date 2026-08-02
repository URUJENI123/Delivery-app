import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { ConfirmOtpDto } from './dto/confirm-otp.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('track')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':token')
  async getByToken(@Param('token') token: string) {
    return this.trackingService.getByToken(token);
  }

  @Post(':token/confirm-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async confirmOtp(@Param('token') token: string, @Body() dto: ConfirmOtpDto) {
    return this.trackingService.confirmDropoffOtp(token, dto.otp);
  }
}
