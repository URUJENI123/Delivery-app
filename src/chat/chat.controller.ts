import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../types';

@Controller('deliveries/:id/chat')
@UseGuards(SupabaseAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getMessages(@Param('id') id: string, @CurrentUser() user: User) {
    return this.chatService.getMessages(id, user.id);
  }

  @Post()
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.chatService.sendMessage(id, user.id, dto);
  }
}

@Controller('chat')
@UseGuards(SupabaseAuthGuard)
export class ConversationsController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@CurrentUser() user: User) {
    return this.chatService.getConversations(user.id);
  }
}
