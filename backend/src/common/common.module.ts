import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './http-exception.filter';
import { DeliveryGateway } from './delivery.gateway';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  providers: [
    DeliveryGateway,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
  exports: [DeliveryGateway],
})
export class CommonModule {}
