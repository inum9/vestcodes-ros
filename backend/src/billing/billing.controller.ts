import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
  StreamableFile,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { QueryBillingDto } from './dto/query-billing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('manager')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  findAll(@Request() req, @Query() query: QueryBillingDto) {
    return this.billingService.findAll(req.user.restaurantId, query);
  }

  /** Declared BEFORE :id — prevents 'export' being parsed as an integer param */
  @Get('export')
  async exportXlsx(@Request() req): Promise<StreamableFile> {
    const buffer = await this.billingService.exportXlsx(req.user.restaurantId);
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="invoices.xlsx"',
    });
  }

  @Get(':id/pdf')
  async exportPdf(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const buffer = await this.billingService.exportPdf(id, req.user.restaurantId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="invoice-${id}.pdf"`,
    });
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.billingService.findOne(id, req.user.restaurantId);
  }
}
