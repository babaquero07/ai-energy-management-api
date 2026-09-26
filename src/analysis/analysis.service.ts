import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { MetersService } from 'src/meters/meters.service';
import { AnomaliesService } from 'src/anomalies/anomalies.service';
import { AnomalyStatus } from 'src/anomalies/enums/anomaly.enum';
import { AnomalyResponseDto } from 'src/anomalies/dto/anomaly-response.dto';
import { AiService } from './ai/ai.service';
import { AnomalyDetailResponseDto } from 'src/anomalies/dto/anomaly-detail-response.dto';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly anomalyDetectorService: AnomalyDetectorService,
    @Inject(forwardRef(() => MetersService))
    private readonly meterService: MetersService,
    private readonly anomaliesService: AnomaliesService,
    private readonly aiService: AiService,
  ) {}

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

    try {
      const ai_result = await this.aiService.analyzeAnomaly({
        anomaly_id: savedAnomaly.id,
        meter_id: meter.meter_id,
        type: detection.type!,
        severity: detection.severity!,
        confidence: detection.confidence,
        analysis_data,
      });

      savedAnomaly.reason = ai_result.reason;
      savedAnomaly.recommended_action = ai_result.recommended_action;
      savedAnomaly.status = AnomalyStatus.COMPLETED;

      await this.anomaliesService.update(savedAnomaly);
    } catch (error) {
      console.error(error);
    }

    return {
      detected: true,
      anomaly: new AnomalyResponseDto(savedAnomaly),
    };
  }

  async getAnalysis(id: number): Promise<AnomalyDetailResponseDto> {
    return await this.anomaliesService.findOne(id);
  }

  async executeAnalysis(): Promise<{ success: boolean }> {
    try {
      const meters = await this.meterService.findAllWithRelations();

      for (const meter of meters) {
        await this.analyzeMeter(meter.meter_id);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to execute meters analysis',
      );
    }
  }
}
