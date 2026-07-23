import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DbService) {}

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.db.findOne('users', 'id', userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.db.update('users', 'id', userId, dto);
  }

  async uploadPhoto(userId: string, photoUrl: string) {
    return this.db.update('users', 'id', userId, { profilePhotoUrl: photoUrl });
  }
}
