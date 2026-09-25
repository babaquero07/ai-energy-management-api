import { Injectable } from '@nestjs/common';
import { Reading } from 'src/readings/entities/reading.entity';

@Injectable()
export class BaselineService {
  calculate(readings: Reading[]): number {
    if (readings.length === 0) {
      return 0;
    }

    const total = readings.reduce(
      (sum, reading) => sum + reading.consumption_kwh,
      0,
    );

    return total / readings.length;
  }

  calculateVariation(consumption: number, baseline: number): number {
    if (baseline === 0) {
      return 0;
    }

    return ((consumption - baseline) / baseline) * 100;
  }
}
