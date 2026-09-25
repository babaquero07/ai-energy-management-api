import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { MetersService } from 'src/meters/meters.service';
import { BaselineService } from './baseline.service';
import { AnomaliesService } from 'src/anomalies/anomalies.service';
import { AnomalyStatus } from 'src/anomalies/enums/anomaly.enum';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly anomalyDetectorService: AnomalyDetectorService,
    @Inject(forwardRef(() => MetersService))
    private readonly meterService: MetersService,
    private readonly baselineService: BaselineService,
    private readonly anomaliesService: AnomaliesService,
    // private readonly aiService: AIService,
  ) {}

  async analyzeMeter(meter_id: string) {
    const meter = await this.meterService.findOne(meter_id);

    const readings = meter.readings;

    const baseline = this.baselineService.calculate(readings);

    const detection = this.anomalyDetectorService.detect(readings, baseline);
    if (!detection.detected)
      return {
        detected: false,
        anomaly: null,
      };

    const type = this.anomalyDetectorService.determineType(detection.signals);
    const severity = this.anomalyDetectorService.determineSeverity(
      detection.signals,
    );

    const currentReading = readings[readings.length - 1];
    const previousReading = readings[readings.length - 2];

    const analysis_data = {
      baseline,
      current_consumption: currentReading.consumption_kwh,
      variation_percent: this.baselineService.calculateVariation(
        currentReading.consumption_kwh,
        baseline,
      ),
      signals: detection.signals,
      electrical_changes: this.baselineService.getElectricalChanges(
        currentReading,
        previousReading,
      ),

      // TODO: Add this data
      // related_events: {}
      // data_quality_issues: {}
    };

    const savedAnomaly = await this.anomaliesService.create({
      meter,
      type,
      severity,
      status: AnomalyStatus.DETECTED,
      confidence: detection.confidence,
      analysis_data,
      reason: 'Anomaly detected. Pending AI analysis.',
      recommended_action: 'Pending AI analysis.',
    });

    return {
      detected: true,
      anomaly: savedAnomaly,
    };
  }
}
