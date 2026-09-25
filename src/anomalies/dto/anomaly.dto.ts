import { Anomaly } from '../entities/anomaly.entity';
import {
  AnomalySeverity,
  AnomalyStatus,
  AnomalyType,
} from '../enums/anomaly.enum';

export class AnomalyDto {
  id: number;
  meter_id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  confidence: number;
  detected_at: Date;
  status: AnomalyStatus;
  analysis_data: Record<string, any>;

  constructor(anomaly: Anomaly) {
    this.id = anomaly.id;
    this.meter_id = anomaly.meter.meter_id;
    this.type = anomaly.type as AnomalyType;
    this.severity = anomaly.severity as AnomalySeverity;
    this.confidence = anomaly.confidence;
    this.detected_at = anomaly.detected_at;
    this.status = anomaly.status as AnomalyStatus;
    this.analysis_data = anomaly.analysis_data;
  }
}
