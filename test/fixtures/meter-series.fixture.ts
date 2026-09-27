import { Event } from '../../src/events/entities/event.entity';
import { Reading } from '../../src/readings/entities/reading.entity';

const VOLTAGE_V = 230;
const POWER_FACTOR = 0.9;
const HOUR_MS = 60 * 60 * 1000;

export const WEEK_HOURS = 24 * 7;
export const SPIKE_HOURS = 8;
export const SPIKE_START = WEEK_HOURS - SPIKE_HOURS;
export const BASELINE_KWH = 10;
export const SPIKE_KWH = 40;

function readingAt(
  timestamp: Date,
  consumptionKwh: number,
  id: number,
  electrical?: Pick<Reading, 'voltage_v' | 'current_a' | 'power_factor'>,
): Reading {
  const voltage = electrical?.voltage_v ?? VOLTAGE_V;
  const powerFactor = electrical?.power_factor ?? POWER_FACTOR;

  return {
    id,
    timestamp,
    consumption_kwh: consumptionKwh,
    voltage_v: voltage,
    current_a:
      electrical?.current_a ??
      (consumptionKwh * 1000) / (voltage * powerFactor),
    power_factor: powerFactor,
    status: 'OK',
    meter: undefined as unknown as Reading['meter'],
  };
}

export function hourlyReadings(
  hours: number,
  consumptionKwh: number,
  start = new Date('2026-01-01T00:00:00.000Z'),
): Reading[] {
  return Array.from({ length: hours }, (_, index) =>
    readingAt(
      new Date(start.getTime() + index * HOUR_MS),
      consumptionKwh,
      index + 1,
    ),
  );
}

export function stableWeek(): Reading[] {
  return hourlyReadings(WEEK_HOURS, BASELINE_KWH);
}

export function spikedWeek(): Reading[] {
  return stableWeek().map((reading, index) => {
    if (index < SPIKE_START || index >= SPIKE_START + SPIKE_HOURS) {
      return reading;
    }

    return readingAt(new Date(reading.timestamp), SPIKE_KWH, reading.id);
  });
}

export function inconsistentPowerWeek(): Reading[] {
  return stableWeek().map((reading) =>
    readingAt(
      new Date(reading.timestamp),
      reading.consumption_kwh,
      reading.id,
      {
        voltage_v: VOLTAGE_V,
        current_a: 5,
        power_factor: 0.5,
      },
    ),
  );
}

export function spikeWindow(readings: Reading[]): { from: Date; to: Date } {
  const segment = readings.slice(SPIKE_START, SPIKE_START + SPIKE_HOURS);

  return {
    from: new Date(segment[0].timestamp),
    to: new Date(segment[segment.length - 1].timestamp),
  };
}

export function meterEvent(timestamp: Date, type: string): Event {
  return {
    id: 1,
    timestamp,
    type,
    description: type,
    meter: undefined as unknown as Event['meter'],
  };
}
