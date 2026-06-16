import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './order.service';
import { CreateOrderDto } from './dto/create-order-dto';
import { QueryOrdersDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Public — customer submits order via QR table link */
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  /** Public — check if table has a pending/approved order */
  @Get('active/:tableId')
  getActive(
    @Param('tableId', ParseIntPipe) tableId: number,
    @Query('t') token: string,
  ) {
    return this.ordersService.getActiveForTable(tableId, token);
  }

  /** Floor, manager, and kitchen — list orders, filterable by ?status= */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('floor', 'manager', 'kitchen')
  @Get()
  findAll(@Request() req, @Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(req.user.restaurantId, query);
  }

  /** Floor, manager, and kitchen — single order detail */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('floor', 'manager', 'kitchen')
  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id, req.user.restaurantId);
  }

  /** Floor only — approve incoming order */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('floor')
  @Patch(':id/approve')
  approve(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.updateStatus(id, 'approved', req.user.restaurantId, req.user.id);
  }

  /** Floor only — reject incoming order */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('floor')
  @Patch(':id/reject')
  reject(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.updateStatus(id, 'rejected', req.user.restaurantId, req.user.id);
  }

  /**
   * Kitchen only — advance order to the next stage.
   * Stage is determined server-side (approved→preparing, preparing→ready).
   * Client cannot choose the target stage.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('kitchen')
  @Patch(':id/advance')
  advance(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.advanceKitchen(id, req.user.restaurantId, req.user.id);
  }

  /** Floor only — mark served, auto-creates invoice */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('floor')
  @Patch(':id/serve')
  serve(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.updateStatus(id, 'served', req.user.restaurantId, req.user.id);
  }
}
