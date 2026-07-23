import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { SenderController } from './sender.controller';
import { SenderService } from './sender.service';

@Module({
  imports: [DbModule],
  controllers: [SenderController],
  providers: [SenderService],
  exports: [SenderService],
})
export class SenderModule {}
