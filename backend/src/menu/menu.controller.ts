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
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /** Public — customer ordering page. restaurantId comes from the table-verify response. */
  @Get()
  getPublicMenu(@Query('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.menuService.findAllPublic(restaurantId);
  }

  /** Manager only — all items including unavailable */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @Get('items')
  getManagerMenu(@Request() req) {
    return this.menuService.findAllManager(req.user.restaurantId);
  }

  /** Manager only — create a new item */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @Post('items')
  createItem(@Request() req, @Body() dto: CreateMenuItemDto) {
    return this.menuService.create(req.user.restaurantId, dto);
  }

  /** Manager only — update name / price / description / category */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @Patch('items/:id')
  updateItem(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.update(req.user.restaurantId, id, dto);
  }

  /** Manager only — toggle availability on/off */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @Patch('items/:id/toggle')
  toggleItem(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.menuService.toggleAvailability(req.user.restaurantId, id);
  }
}
