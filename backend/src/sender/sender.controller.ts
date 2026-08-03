import { Controller, Get, UseGuards } from '@nestjs/common';
import { SenderService } from './sender.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../types';

@Controller('sender')
@UseGuards(JwtAuthGuard)
export class SenderController {
  constructor(private readonly senderService: SenderService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: User) {
    return this.senderService.getDashboard(user.id);
  }
}
