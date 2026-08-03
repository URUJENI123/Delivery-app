import { Controller, Put, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../types';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('me')
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/photo')
  async uploadPhoto(
    @CurrentUser() user: User,
    @Body('photoUrl') photoUrl: string,
  ) {
    return this.usersService.uploadPhoto(user.id, photoUrl);
  }
}
