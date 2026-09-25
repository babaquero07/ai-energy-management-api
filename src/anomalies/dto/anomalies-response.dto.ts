import { Anomaly } from '../entities/anomaly.entity';
import { AnomalyResponseDto } from './anomaly-response.dto';

export class AnomaliesResponseDto {
  data: AnomalyResponseDto[];
  total: number;

  constructor(anomalies: Anomaly[]) {
    this.data = anomalies.map((anomaly) => new AnomalyResponseDto(anomaly));
    this.total = anomalies.length;
  }
}
