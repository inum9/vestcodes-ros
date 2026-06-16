import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Optional,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TableTokenService } from '../auth/table-token.service';
import { CreateOrderDto } from './dto/create-order-dto';
import { QueryOrdersDto } from './dto/query-order.dto';
import { OrdersGateway } from '../gateway/orders.gateway';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:   ['approved', 'rejected'],
  approved:  ['preparing'],
  preparing: ['ready'],
  ready:     ['served'],
  served:    [],
  rejected:  [],
};

// Server-side only — kitchen cannot choose the target stage
const NEXT_KITCHEN_STAGE: Record<string, string> = {
  approved:  'preparing',
  preparing: 'ready',
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tableToken: TableTokenService,
    @Optional() @Inject(forwardRef(() => OrdersGateway))
    private readonly gateway?: OrdersGateway,
  ) {}

  async getActiveForTable(tableId: number, tableToken: string) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new NotFoundException('Table not found');

    const valid = this.tableToken.verify(tableToken, table.id, table.restaurantId);
    if (!valid) throw new UnauthorizedException('Invalid table token');

    const order = await this.prisma.order.findFirst({
      where: {
        tableId: table.id,
        status: { in: ['pending', 'approved'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, total: true },
    });

    return {
      hasActiveOrder: !!order,
      order: order ?? null,
    };
  }

  async create(dto: CreateOrderDto) {
    const table = await this.prisma.table.findUnique({ where: { id: dto.tableId } });
    if (!table) throw new NotFoundException('Table not found');

    const valid = this.tableToken.verify(dto.tableToken, table.id, table.restaurantId);
    if (!valid) throw new UnauthorizedException('Invalid table token');

    const active = await this.prisma.order.findFirst({
      where: { tableId: table.id, status: { notIn: ['served', 'rejected'] } },
    });
    if (active) throw new BadRequestException('An order is already in progress for this table');

    // Resolve prices server-side — never trust client-supplied prices
    let total = 0;
    const items: { menuItemId: number; quantity: number; unitPrice: number }[] = [];

    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem || !menuItem.available) {
        throw new NotFoundException(`Menu item ${item.menuItemId} is unavailable`);
      }
      total += menuItem.price * item.quantity;
      items.push({ menuItemId: item.menuItemId, quantity: item.quantity, unitPrice: menuItem.price });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          restaurantId: table.restaurantId,
          tableId: table.id,
          status: 'pending',
          total,
          orderItems: { create: items },
        },
        include: { orderItems: true, table: true },
      });
      await tx.auditLog.create({
        data: { orderId: created.id, fromStatus: 'none', toStatus: 'pending' },
      });
      return created;
    });

    this.broadcast('order_created', order as unknown as Record<string, unknown>);
    return order;
  }

  findAll(restaurantId: number, query: QueryOrdersDto) {
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        status: query.status ? query.status : { notIn: ['served', 'rejected'] },
      },
      include: { orderItems: { include: { menuItem: true } }, table: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, restaurantId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, restaurantId },
      include: { orderItems: { include: { menuItem: true } }, table: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(orderId: number, newStatus: string, restaurantId: number, userId?: number) {
    const order = await this.findOne(orderId, restaurantId);

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Invalid transition: ${order.status} → ${newStatus}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.update({ where: { id: orderId }, data: { status: newStatus } });

      await tx.auditLog.create({
        data: { orderId, userId: userId ?? null, fromStatus: order.status, toStatus: newStatus },
      });

      if (newStatus === 'served') {
        const restaurant = await tx.restaurant.findUnique({ where: { id: restaurantId } });
        const gstAmount = o.total * (restaurant?.gstRate ?? 0.05);
        await tx.invoice.create({
          data: { orderId, subtotal: o.total, gstAmount, total: o.total + gstAmount },
        });
      }

      return o;
    });

    this.broadcast('order_updated', { orderId, status: newStatus, updatedAt: new Date(), restaurantId });
    return updated;
  }

  async advanceKitchen(orderId: number, restaurantId: number, userId?: number) {
    const order = await this.findOne(orderId, restaurantId);
    const next = NEXT_KITCHEN_STAGE[order.status];
    if (!next) {
      throw new BadRequestException(`Order cannot be advanced from status: ${order.status}`);
    }
    return this.updateStatus(orderId, next, restaurantId, userId);
  }

  private broadcast(event: string, payload: Record<string, unknown>) {
    if (!this.gateway) return;
    const restaurantId = payload['restaurantId'] as number | undefined;
    if (restaurantId !== undefined) {
      this.gateway.broadcastToRestaurant(restaurantId, event, payload);
    }
  }
}
