import { Module } from '@nestjs/common';
import { TablesController } from './table.controller';
import { TablesService } from './table.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
