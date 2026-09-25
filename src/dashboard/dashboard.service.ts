import { Injectable } from '@nestjs/common';
import { MetersService } from 'src/meters/meters.service';
import { ReadingsService } from 'src/readings/readings.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly meterService: MetersService,
    private readonly ReadingService: ReadingsService,
  ) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const totalMeters = await this.meterService.countMeters();

    const consumption = await this.ReadingService.getTotalConsumption();

    return {
      meters: totalMeters,
      totalConsumption: +consumption.toFixed(2),

      // TODO: Replace when services are ready
      anomalies: 0,
      highPriorityAnomalies: 0,
      aiConfidence: null,
      lastAnalysisAt: null,
      lastAnalysisStatus: null,
    };
  }
}
