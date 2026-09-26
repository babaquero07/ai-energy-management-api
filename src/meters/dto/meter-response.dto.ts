export class MeterResponseDto {
  id: number;
  meter_id: string;
  name: string;
  location: string;
  status: string;
  created_at: Date;

  constructor(meter: MeterResponseDto) {
    this.id = meter.id;
    this.meter_id = meter.meter_id;
    this.name = meter.name;
    this.location = meter.location;
    this.status = meter.status;
    this.created_at = meter.created_at;
  }
}
