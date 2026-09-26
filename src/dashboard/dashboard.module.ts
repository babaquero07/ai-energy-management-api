import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MetersModule } from 'src/meters/meters.module';
import { ReadingsModule } from 'src/readings/readings.module';
import { AnomaliesModule } from 'src/anomalies/anomalies.module';

@Module({
  imports: [MetersModule, ReadingsModule, AnomaliesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
