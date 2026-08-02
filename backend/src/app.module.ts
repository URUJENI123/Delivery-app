import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CouriersModule } from './couriers/couriers.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { TrackingModule } from './tracking/tracking.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';
import { SenderModule } from './sender/sender.module';
import { WalletModule } from './wallet/wallet.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    // CommonModule is @Global() — exports DeliveryGateway and JwtModule to all modules
    CommonModule,
    // DbModule is @Global() — exports PrismaService to all modules
    DbModule,
    AuthModule,
    UsersModule,
    CouriersModule,
    DeliveriesModule,
    TrackingModule,
    ChatModule,
    NotificationsModule,
    StorageModule,
    AdminModule,
    SenderModule,
    WalletModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
