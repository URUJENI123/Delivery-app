import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { HttpExceptionFilter } from './http-exception.filter';
import { DeliveryGateway } from './delivery.gateway';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any },
    }),
  ],
  providers: [
    DeliveryGateway,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [DeliveryGateway, JwtModule],
})
export class CommonModule {}
