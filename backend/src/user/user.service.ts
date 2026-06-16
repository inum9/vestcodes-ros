import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SAFE_SELECT = { id: true, email: true, role: true, restaurantId: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(restaurantId: number) {
    return this.prisma.user.findMany({
      where: { restaurantId },
      select: SAFE_SELECT,
      orderBy: { id: 'asc' },
    });
  }

  async create(restaurantId: number, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.user.create({
        data: { email: dto.email, passwordHash, role: dto.role, restaurantId },
        select: SAFE_SELECT,
      });
    } catch (error: any) {
      if (error.code === 'P2002') throw new ConflictException('Email already in use');
      throw error;
    }
  }

  async update(restaurantId: number, id: number, dto: UpdateUserDto) {
    await this.ensureExists(restaurantId, id);

    const data: Record<string, unknown> = {};
    if (dto.email) data.email = dto.email;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    });
  }

  async remove(restaurantId: number, id: number, requesterId: number) {
    if (id === requesterId) {
      throw new BadRequestException('Cannot delete your own account');
    }
    await this.ensureExists(restaurantId, id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(restaurantId: number, id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.restaurantId !== restaurantId) {
      throw new NotFoundException('User not found');
    }
  }
}
