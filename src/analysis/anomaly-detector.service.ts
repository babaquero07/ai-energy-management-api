import { Injectable } from '@nestjs/common';
import { Reading } from 'src/readings/entities/reading.entity';
import {
  BaselineService,
  SeriesAnalysis,
  SeriesSignals,
} from './baseline.service';
import { AnomalySeverity, AnomalyType } from 'src/anomalies/enums/anomaly.enum';
import { Event } from 'src/events/entities/event.entity';

export interface AnomalyDetectionResult extends SeriesAnalysis {
  type: AnomalyType | null;
  severity: AnomalySeverity | null;
  relatedEvent: Event | null;
}

@Injectable()
export class AnomalyDetectorService {
  constructor(private readonly baselineService: BaselineService) {}

  detect(readings: Reading[], events: Event[] = []): AnomalyDetectionResult {
    const analysis = this.baselineService.analyzeSeries(readings);
    if (!analysis.detected) {
      return { ...analysis, type: null, severity: null, relatedEvent: null };
    }

    const relatedEvent = this.explainingEvent(events, analysis.segment);
    const type = this.determineType(analysis.signals, relatedEvent);
    const severity = this.determineSeverity(type, analysis);

    return { ...analysis, type, severity, relatedEvent };
  }

  private explainingEvent(events: Event[], segment: SeriesAnalysis['segment']) {
    if (!segment) return null;

    const explaining = new Set(['OPERATIONAL_CHANGE', 'SCHEDULED_OUTAGE']);
    const from = segment.from.getTime() - 2 * 60 * 60 * 1000;
    const to = segment.to.getTime() + 2 * 60 * 60 * 1000;

    return (
      events.find((event) => {
        const time = new Date(event.timestamp).getTime();

        return explaining.has(event.type) && time >= from && time <= to;
      }) ?? null
    );
  }

  determineType(
    signals: SeriesSignals,
    relatedEvent: Event | null,
  ): AnomalyType {
    if (signals.dataQuality && !signals.outliers)
      return AnomalyType.DATA_QUALITY;
    if (relatedEvent) return AnomalyType.FALSE_POSITIVE;

    return AnomalyType.REAL_ANOMALY;
  }

  determineSeverity(
    type: AnomalyType,
    analysis: SeriesAnalysis,
  ): AnomalySeverity {
    if (type === AnomalyType.DATA_QUALITY && !analysis.signals.outliers)
      return AnomalySeverity.LOW;

    if (type === AnomalyType.FALSE_POSITIVE) return AnomalySeverity.MEDIUM;

    return AnomalySeverity.HIGH;
  }
}
