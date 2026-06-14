import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { TableTokenService } from '../auth/table-token.service';
import { CreateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tableToken: TableTokenService,
  ) {}

  findAll(restaurantId: number) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
    });
  }

  async create(restaurantId: number, dto: CreateTableDto) {
    try {
      return await this.prisma.table.create({
        data: { restaurantId, number: dto.number, zone: dto.zone },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Table number ${dto.number} already exists`);
      }
      throw new InternalServerErrorException('Failed to create table');
    }
  }

  async remove(restaurantId: number, id: number) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table || table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found');
    }
    await this.prisma.table.delete({ where: { id } });
    return { success: true };
  }

  async generateQrBuffer(
    restaurantId: number,
    id: number,
  ): Promise<{ buffer: Buffer; tableNumber: number }> {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table || table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found');
    }

    const token = this.tableToken.sign(table.id, table.restaurantId);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const url = `${frontendUrl}/table/${table.id}?t=${token}`;

    try {
      const buffer = await QRCode.toBuffer(url, { type: 'png', margin: 2, width: 300 });
      return { buffer, tableNumber: table.number };
    } catch {
      throw new InternalServerErrorException('QR code generation failed');
    }
  }
}
