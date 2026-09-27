import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { MetersService } from 'src/meters/meters.service';
import { AnomaliesService } from 'src/anomalies/anomalies.service';
import {
  AnomalySeverity,
  AnomalyStatus,
  AnomalyType,
} from 'src/anomalies/enums/anomaly.enum';
import { AiService } from './ai/ai.service';
import { Anomaly } from 'src/anomalies/entities/anomaly.entity';
import { Meter } from 'src/meters/entities/meter.entity';

export interface MeterAnalysisResult {
  detected: boolean;
  anomaly: Anomaly | null;
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly anomalyDetectorService: AnomalyDetectorService,
    private readonly meterService: MetersService,
    private readonly anomaliesService: AnomaliesService,
    private readonly aiService: AiService,
  ) {}

  async analyzeMeter(meterId: string): Promise<MeterAnalysisResult> {
    const meter = await this.meterService.findOne(meterId);

    return this.persistDetection(meter);
  }

  async executeAnalysis(): Promise<void> {
    const meters = await this.meterService.findAllWithRelations();

    for (const meter of meters) {
      await this.persistDetection(meter);
    }
  }

  async getAnalysis(id: number): Promise<Anomaly> {
    return this.anomaliesService.findById(id);
  }

  async updateAnalysis(id: number): Promise<void> {
    const anomaly = await this.anomaliesService.findById(id);

    try {
      const aiResult = await this.aiService.analyzeAnomaly({
        anomaly_id: anomaly.id,
        meter_id: anomaly.meter.meter_id,
        type: anomaly.type as AnomalyType,
        severity: anomaly.severity as AnomalySeverity,
        confidence: anomaly.confidence,
        analysis_data: anomaly.analysis_data,
      });

      anomaly.reason = aiResult.reason;
      anomaly.recommended_action = aiResult.recommended_action;
      anomaly.status = AnomalyStatus.COMPLETED;

      await this.anomaliesService.update(anomaly);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `AI analysis failed for anomaly ${id}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'Failed to update anomaly analysis with IA',
      );
    }
  }

  private async persistDetection(meter: Meter): Promise<MeterAnalysisResult> {
    const detection = this.anomalyDetectorService.detect(
      meter.readings,
      meter.events ?? [],
    );

    if (!detection.detected || !detection.type || !detection.severity) {
      return { detected: false, anomaly: null };
    }

    const anomaly = await this.anomaliesService.create({
      meter,
      type: detection.type,
      severity: detection.severity,
      status: AnomalyStatus.DETECTED,
      confidence: detection.confidence,
      analysis_data: {
        baseline: detection.baseline,
        variation_percent: detection.variationPercent,
        signals: detection.signals,
        segment: detection.segment,
        max_abs_z: detection.maxAbsZ,
        worst_power_residual: detection.worstPowerResidual,
        related_events: detection.relatedEvent,
      },
      reason: 'Anomalía detectada. Pendiente de análisis IA.',
      recommended_action:
        'Por favor ejecute el análisis IA para obtener más información.',
    });

    return { detected: true, anomaly };
  }
}
