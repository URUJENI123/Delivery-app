import { Module } from '@nestjs/common';
import { ChatController, ConversationsController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController, ConversationsController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
