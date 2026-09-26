export class CurrentReadingDto {
  consumption: number;
  voltage: number;
  current: number;
  powerFactor: number;
  timestamp: Date;

  constructor(reading: CurrentReadingDto) {
    this.consumption = reading.consumption;
    this.voltage = reading.voltage;
    this.current = reading.current;
    this.powerFactor = reading.powerFactor;
    this.timestamp = reading.timestamp;
  }
}
