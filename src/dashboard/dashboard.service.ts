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
    private readonly readingsService: ReadingsService,
    private readonly anomaliesService: AnomaliesService,
  ) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const [totalMeters, consumption, anomalies] = await Promise.all([
      this.meterService.countMeters(),
      this.readingsService.getTotalConsumption(),
      this.anomaliesService.findAll(),
    ]);

    let confidenceRatio = 0.9;
    if (anomalies.length > 0) {
      confidenceRatio =
        anomalies.reduce((acc, anomaly) => {
          return acc + (anomaly.confidence ?? 0);
        }, 0) / anomalies.length;
    }

    const latest = anomalies[0];

    return {
      meters: totalMeters,
      totalConsumption: +consumption.toFixed(2),
      anomalies: anomalies.length,
      highPriorityAnomalies: anomalies.filter(
        (anomaly) => anomaly.severity === AnomalySeverity.HIGH.toString(),
      ).length,
      aiConfidence: +confidenceRatio.toFixed(2) * 100,
      lastAnalysisAt: latest
        ? new Date(latest.detected_at).toISOString()
        : null,
      lastAnalysisStatus: latest?.status ?? null,
    };
  }
}
