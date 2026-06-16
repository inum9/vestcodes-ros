import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ParseIntPipe,
  StreamableFile,
} from '@nestjs/common';
import { TablesService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('manager')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll(@Request() req) {
    return this.tablesService.findAll(req.user.restaurantId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateTableDto) {
    return this.tablesService.create(req.user.restaurantId, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.tablesService.remove(req.user.restaurantId, id);
  }

  /** Returns a PNG QR code for the table — browser will trigger a file download */
  @Get(':id/qr')
  async getQr(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const { buffer, tableNumber } = await this.tablesService.generateQrBuffer(
      req.user.restaurantId,
      id,
    );
    return new StreamableFile(buffer, {
      type: 'image/png',
      disposition: `attachment; filename="table-${tableNumber}.png"`,
    });
  }
}
