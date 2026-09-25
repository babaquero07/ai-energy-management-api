import { IsNotEmpty, IsString } from 'class-validator';

export class AnalyzeMeterDto {
  @IsString()
  @IsNotEmpty()
  meter_id: string;

  constructor(meter_id: string) {
    this.meter_id = meter_id;
  }
}
