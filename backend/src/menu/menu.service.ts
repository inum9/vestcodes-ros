import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic(restaurantId: number) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId, available: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  findAllManager(restaurantId: number) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  create(restaurantId: number, dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: { ...dto, restaurantId, available: true },
    });
  }

  async update(restaurantId: number, id: number, dto: UpdateMenuItemDto) {
    await this.assertOwnership(restaurantId, id);
    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async toggleAvailability(restaurantId: number, id: number) {
    const item = await this.assertOwnership(restaurantId, id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { available: !item.available },
    });
  }

  private async assertOwnership(restaurantId: number, id: number) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.restaurantId !== restaurantId) throw new ForbiddenException('Access denied');
    return item;
  }
}
