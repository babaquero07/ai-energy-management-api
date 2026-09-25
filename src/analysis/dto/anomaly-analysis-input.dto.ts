import { AnomalyType, AnomalySeverity } from 'src/anomalies/enums/anomaly.enum';

export class AnomalyAnalysisInput {
  anomaly_id: number;
  meter_id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  confidence: number;
  analysis_data: Record<string, any>;

  constructor(data: AnomalyAnalysisInput) {
    this.anomaly_id = data.anomaly_id;
    this.meter_id = data.meter_id;
    this.type = data.type;
    this.severity = data.severity;
    this.confidence = data.confidence;
    this.analysis_data = data.analysis_data;
  }
}
