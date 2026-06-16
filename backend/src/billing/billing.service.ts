import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryBillingDto } from './dto/query-billing.dto';
import * as XLSX from 'xlsx';
import PDFDocument = require('pdfkit');

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private get include() {
    return {
      order: {
        include: {
          table: true,
          orderItems: { include: { menuItem: true } },
        },
      },
    };
  }

  private get includeWithRestaurant() {
    return {
      order: {
        include: {
          table: true,
          restaurant: true,
          orderItems: { include: { menuItem: true } },
        },
      },
    };
  }

  findAll(restaurantId: number, query: QueryBillingDto) {
    const searchNum = query.search && !isNaN(Number(query.search))
      ? Number(query.search)
      : undefined;

    return this.prisma.invoice.findMany({
      where: {
        order: {
          restaurantId,
          ...(searchNum !== undefined
            ? { OR: [{ id: searchNum }, { table: { number: searchNum } }] }
            : {}),
        },
      },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, restaurantId: number) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, order: { restaurantId } },
      include: this.include,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async exportXlsx(restaurantId: number): Promise<Buffer> {
    const invoices = await this.prisma.invoice.findMany({
      where: { order: { restaurantId } },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });

    const rows = invoices.map((inv) => ({
      'Invoice ID': inv.id,
      Date: inv.createdAt.toISOString().slice(0, 10),
      Table: inv.order.table.number,
      Items: inv.order.orderItems.map((i) => `${i.menuItem.name} x${i.quantity}`).join(', '),
      Subtotal: inv.subtotal,
      GST: inv.gstAmount,
      Total: inv.total,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportPdf(id: number, restaurantId: number): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, order: { restaurantId } },
      include: this.includeWithRestaurant,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const { order } = invoice;
    const restaurantName = order.restaurant.name;
    const currency = order.restaurant.currency ?? 'INR';
    const dateStr = invoice.createdAt.toISOString().slice(0, 10);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).text(restaurantName, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#555555').text('Tax Invoice', { align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(1.5);

      doc.fontSize(11);
      doc.text(`Invoice #: ${invoice.id}`);
      doc.text(`Order #: ${order.id}`);
      doc.text(`Table: ${order.table.number}`);
      doc.text(`Date: ${dateStr}`);
      doc.moveDown(1);

      doc.fontSize(12).text('Items', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);

      for (const line of order.orderItems) {
        const lineTotal = line.quantity * line.unitPrice;
        doc.text(
          `${line.menuItem.name}  x${line.quantity}  @ ${this.formatMoney(line.unitPrice, currency)}  =  ${this.formatMoney(lineTotal, currency)}`,
        );
      }

      doc.moveDown(1.5);
      doc.fontSize(11);
      doc.text(`Subtotal: ${this.formatMoney(invoice.subtotal, currency)}`, { align: 'right' });
      doc.text(`GST: ${this.formatMoney(invoice.gstAmount, currency)}`, { align: 'right' });
      doc.fontSize(13).text(`Total: ${this.formatMoney(invoice.total, currency)}`, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(9).fillColor('#888888').text('Thank you for dining with us!', { align: 'center' });

      doc.end();
    });
  }

  private formatMoney(amount: number, currency: string) {
    if (currency === 'INR') return `₹${Math.round(amount)}`;
    return `${currency} ${amount.toFixed(2)}`;
  }
}
