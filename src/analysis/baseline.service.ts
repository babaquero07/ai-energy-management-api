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

  detectConsumptionSpike(current: Reading, previous: Reading): boolean {
    if (previous.consumption_kwh === 0) {
      return false;
    }

    const variation =
      ((current.consumption_kwh - previous.consumption_kwh) /
        previous.consumption_kwh) *
      100;

    return variation >= 50;
  }

  calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) {
      return 0;
    }

    return Math.abs(((current - previous) / previous) * 100);
  }

  detectElectricalChange(current: Reading, previous: Reading): boolean {
    const currentVariation = this.calculatePercentageChange(
      previous.current_a,
      current.current_a,
    );

    const voltageVariation = this.calculatePercentageChange(
      previous.voltage_v,
      current.voltage_v,
    );

    const powerFactorVariation = this.calculatePercentageChange(
      previous.power_factor,
      current.power_factor,
    );

    return (
      currentVariation >= 20 ||
      voltageVariation >= 10 ||
      powerFactorVariation >= 10
    );
  }

  getElectricalChanges(
    currentReading: Reading,
    previousReading: Reading,
  ): Record<string, any> {
    return {
      voltage: {
        previous: previousReading.voltage_v,
        current: currentReading.voltage_v,
        variation: this.calculatePercentageChange(
          previousReading.voltage_v,
          currentReading.voltage_v,
        ),
      },
      current: {
        previous: previousReading.current_a,
        current: currentReading.current_a,
        variation: this.calculatePercentageChange(
          previousReading.current_a,
          currentReading.current_a,
        ),
      },
      power_factor: {
        previous: previousReading.power_factor,
        current: currentReading.power_factor,
        variation: this.calculatePercentageChange(
          previousReading.power_factor,
          currentReading.power_factor,
        ),
      },
    };
  }
}
