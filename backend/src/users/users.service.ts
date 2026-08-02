import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({ where: { id: userId }, data: dto as any });
  }

  async uploadPhoto(userId: string, photoUrl: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { profilePhotoUrl: photoUrl } });
  }
}
