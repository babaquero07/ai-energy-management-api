import { MeterResponseDto } from './meter-response.dto';

export class MetersResponseDto {
  data: MeterResponseDto[];
  total: number;

  constructor(meters: MetersResponseDto) {
    this.data = meters.data;
    this.total = meters.total;
  }
}
