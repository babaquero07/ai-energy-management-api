import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { MetersService } from 'src/meters/meters.service';
import { BaselineService } from './baseline.service';
import { AnomaliesService } from 'src/anomalies/anomalies.service';
import { AnomalyStatus } from 'src/anomalies/enums/anomaly.enum';
import { AnomalyResponseDto } from 'src/anomalies/dto/anomaly-response.dto';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly anomalyDetectorService: AnomalyDetectorService,
    @Inject(forwardRef(() => MetersService))
    private readonly meterService: MetersService,
    private readonly baselineService: BaselineService,
    private readonly anomaliesService: AnomaliesService,
    // private readonly aiService: AIService,
  ) { }

  async analyzeMeter(meter_id: string) {
    const meter = await this.meterService.findOne(meter_id);

    const detection = this.anomalyDetectorService.detect(
      meter.readings,
      meter.events ?? [],
    );

    if (!detection.detected) {
      return {
        detected: false,
        anomaly: null,
      };
    }

    const analysis_data = {
      baseline: detection.baseline,
      variation_percent: detection.variationPercent,
      signals: detection.signals,
      segment: detection.segment,
      max_abs_z: detection.maxAbsZ,
      worst_power_residual: detection.worstPowerResidual,
      related_events: detection.relatedEvent,
    };

    const savedAnomaly = await this.anomaliesService.create({
      meter,
      type: detection.type!,
      severity: detection.severity!,
      status: AnomalyStatus.DETECTED,
      confidence: detection.confidence,
      analysis_data,
      reason: 'Anomaly detected. Pending AI analysis.',
      recommended_action: 'Pending AI analysis.',
    });

    return {
      detected: true,
      anomaly: new AnomalyResponseDto(savedAnomaly),
    };
  }
}
