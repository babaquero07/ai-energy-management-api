import { Anomaly } from '../entities/anomaly.entity';
import { AnomalyResponseDto } from './anomaly-response.dto';

export class AnomalyDetailResponseDto extends AnomalyResponseDto {
  reason: string;
  recommended_action: string;

  analysis_data: Record<string, any>;

  constructor(anomaly: Anomaly) {
    super(anomaly);
    this.reason = anomaly.reason;
    this.recommended_action = anomaly.recommended_action;
    this.analysis_data = anomaly.analysis_data;
  }
}
