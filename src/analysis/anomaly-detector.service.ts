import { Injectable } from '@nestjs/common';
import { Reading } from 'src/readings/entities/reading.entity';
import { BaselineService } from './baseline.service';
import { AnomalySeverity, AnomalyType } from 'src/anomalies/enums/anomaly.enum';

export interface AnomalyDetectionResult {
  detected: boolean;
  signals: {
    baselineDeviation: boolean;
    consumptionSpike: boolean;
    electricalChange: boolean;
  };
  confidence: number;
}

@Injectable()
export class AnomalyDetectorService {
  constructor(private readonly baselineService: BaselineService) {}

  detect(readings: Reading[], baseline: number): AnomalyDetectionResult {
    if (readings.length < 2)
      return {
        detected: false,
        signals: {
          baselineDeviation: false,
          consumptionSpike: false,
          electricalChange: false,
        },
        confidence: 100,
      };

    const current = readings[readings.length - 1];
    const previous = readings[readings.length - 2];

    const variation = this.baselineService.calculateVariation(
      current.consumption_kwh,
      baseline,
    );

    const spike = this.baselineService.detectConsumptionSpike(
      current,
      previous,
    );

    const electricalChange = this.baselineService.detectElectricalChange(
      current,
      previous,
    );

    const signals = {
      baselineDeviation: variation >= 50,
      consumptionSpike: spike,
      electricalChange,
    };

    const hasAnomaly =
      signals.baselineDeviation ||
      signals.consumptionSpike ||
      signals.electricalChange;

    if (!hasAnomaly) {
      return {
        detected: false,
        signals: {
          baselineDeviation: false,
          consumptionSpike: false,
          electricalChange: false,
        },
        confidence: 100,
      };
    }

    return {
      detected: true,
      signals,
      confidence: 0.96,
    };
  }

  determineType(signals: AnomalyDetectionResult['signals']): AnomalyType {
    if (
      signals.baselineDeviation &&
      signals.consumptionSpike &&
      signals.electricalChange
    ) {
      return AnomalyType.REAL_ANOMALY;
    }

    return AnomalyType.EXPLAINABLE_ANOMALY;
  }

  determineSeverity(
    signals: AnomalyDetectionResult['signals'],
  ): AnomalySeverity {
    const signalCount = Object.values(signals).filter(Boolean).length;

    if (signalCount >= 3) {
      return AnomalySeverity.HIGH;
    }

    if (signalCount === 2) {
      return AnomalySeverity.MEDIUM;
    }

    return AnomalySeverity.LOW;
  }
}
