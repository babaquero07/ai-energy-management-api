import { Injectable } from '@nestjs/common';
import { MetersService } from 'src/meters/meters.service';
import { ReadingsService } from 'src/readings/readings.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { AnomaliesService } from 'src/anomalies/anomalies.service';
import { AnomalySeverity } from 'src/anomalies/enums/anomaly.enum';

@Injectable()
export class DashboardService {
  constructor(
    private readonly meterService: MetersService,
    private readonly ReadingService: ReadingsService,
    private readonly anomaliesService: AnomaliesService,
  ) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const [totalMeters, consumption, anomalies] = await Promise.all([
      this.meterService.countMeters(),
      this.ReadingService.getTotalConsumption(),
      this.anomaliesService.findAll(),
    ]);

    const latest = anomalies.data[0];

    const aiConfidence =
      anomalies.data.reduce((acc, anomaly) => {
        return acc + (anomaly.confidence ?? 0);
      }, 0) / anomalies.data.length;

    return {
      meters: totalMeters,
      totalConsumption: +consumption.toFixed(2),
      anomalies: anomalies.total,
      highPriorityAnomalies: anomalies.data.filter(
        (anomaly) => anomaly.severity === AnomalySeverity.HIGH,
      ).length,
      aiConfidence: +aiConfidence.toFixed(2) * 100,
      lastAnalysisAt: latest
        ? new Date(latest.detected_at).toISOString()
        : null,
      lastAnalysisStatus: latest?.status ?? null,
    };
  }
}
