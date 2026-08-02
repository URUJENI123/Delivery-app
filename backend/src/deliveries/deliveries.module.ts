import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { DeliveryStateMachineService } from './delivery-state-machine.service';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, WalletModule, NotificationsModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, DeliveryStateMachineService],
  exports: [DeliveriesService, DeliveryStateMachineService],
})
export class DeliveriesModule {}
