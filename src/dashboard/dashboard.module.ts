import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MetersModule } from 'src/meters/meters.module';
import { ReadingsModule } from 'src/readings/readings.module';

@Module({
  imports: [MetersModule, ReadingsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
