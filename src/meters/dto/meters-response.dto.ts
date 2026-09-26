import { MeterResponseDto } from './meter-response.dto';

export class MetersResponseDto {
  data: {
    meters: MeterResponseDto[];
    actives: number;
    inactives: number;
    maintenances: number;
    total: number;
  };

  constructor(meters: MetersResponseDto) {
    this.data = meters.data;
  }
}
