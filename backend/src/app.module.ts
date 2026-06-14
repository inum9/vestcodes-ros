import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/order.module';
import { TablesModule } from './table/table.module';

@Module({
  imports: [PrismaModule, AuthModule, MenuModule, OrdersModule, TablesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
