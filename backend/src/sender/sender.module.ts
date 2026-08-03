import { Module } from '@nestjs/common';
import { SenderController } from './sender.controller';
import { SenderService } from './sender.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SenderController],
  providers: [SenderService],
  exports: [SenderService],
})
export class SenderModule {}
