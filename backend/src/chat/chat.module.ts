import { Module } from '@nestjs/common';
import { ChatController, ConversationsController } from './chat.controller';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ChatController, ConversationsController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
