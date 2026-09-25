import { Injectable } from '@nestjs/common';
import { Reading } from 'src/readings/entities/reading.entity';

export interface SeriesSignals {
  consumptionSpike: boolean;
  persistentBaselineChange: boolean;
  outliers: boolean;
  abnormalHourlyPattern: boolean;
  dataQuality: boolean;
  anomalousElectricalRelation: boolean;
}

export interface SeriesAnalysis {
  detected: boolean;
  baseline: number;
  variationPercent: number;
  signals: SeriesSignals;
  confidence: number;
  maxAbsZ: number;
  worstPowerResidual: number;
  badResidualCount: number;
  segment: {
    from: Date;
    to: Date;
    hours: number;
    meanConsumption: number;
  } | null;
}

const Z_OUTLIER = 3.5;
const MIN_OUTLIER_RUN = 6;
const PERSISTENT_HOURS = 24;
const SPIKE_PERCENT = 40;
const RESIDUAL_LIMIT = 0.4;
const MIN_BAD_RESIDUALS = 3;
const LOW_POWER_FACTOR = 0.8;
const MIN_HOURS_FOR_PATTERN = 18;
const MIN_ELECTRICAL_HOURS = 6;
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

  calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) {
      return 0;
    }

    return Math.abs(((current - previous) / previous) * 100);
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

  private median(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private longestTrueRun(flags: boolean[]) {
    let best = { length: 0, start: -1, end: -1 };
    let start = -1;

    for (let index = 0; index <= flags.length; index++) {
      const active = index < flags.length && flags[index];
      if (active && start === -1) start = index;

      if (!active && start !== -1) {
        const length = index - start;

        if (length > best.length) best = { length, start, end: index - 1 };

        start = -1;
      }
    }
    return best;
  }

  private hourlyProfile(readings: Reading[]) {
    const byHour = new Map<number, number[]>();

    for (const reading of readings) {
      const hour = new Date(reading.timestamp).getUTCHours();
      const bucket = byHour.get(hour) ?? [];

      bucket.push(reading.consumption_kwh);
      byHour.set(hour, bucket);
    }

    const profile = new Map<number, { median: number; scale: number }>();

    for (const [hour, values] of byHour) {
      const med = this.median(values);
      const deviation = this.median(
        values.map((value) => Math.abs(value - med)),
      );

      profile.set(hour, {
        median: med,
        scale: Math.max(1.4826 * deviation, med * 0.05, 0.5),
      });
    }

    return profile;
  }

  analyzeSeries(readings: Reading[]): SeriesAnalysis {
    const series = [...readings].sort(
      (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp),
    );

    const empty: SeriesAnalysis = {
      detected: false,
      baseline: this.calculate(series),
      variationPercent: 0,
      signals: {
        consumptionSpike: false,
        persistentBaselineChange: false,
        outliers: false,
        abnormalHourlyPattern: false,
        dataQuality: false,
        anomalousElectricalRelation: false,
      },
      confidence: 0,
      maxAbsZ: 0,
      worstPowerResidual: 0,
      badResidualCount: 0,
      segment: null,
    };

    if (series.length < 24) return empty;

    const profile = this.hourlyProfile(series);

    const scored = series.map((reading, index) => {
      const hour = new Date(reading.timestamp).getUTCHours();
      const { median, scale } = profile.get(hour)!;
      const expectedKw =
        (reading.voltage_v * reading.current_a * reading.power_factor) / 1000;
      const previous = index > 0 ? series[index - 1].consumption_kwh : null;
      const jumpPercent =
        previous === null || previous === 0
          ? 0
          : ((reading.consumption_kwh - previous) / previous) * 100;

      return {
        timestamp: new Date(reading.timestamp),
        hour,
        consumption: reading.consumption_kwh,
        powerFactor: reading.power_factor,
        baseline: median,
        z: (reading.consumption_kwh - median) / scale,
        residual:
          reading.consumption_kwh === 0
            ? 0
            : Math.abs(reading.consumption_kwh - expectedKw) /
              reading.consumption_kwh,
        jumpPercent,
      };
    });

    const outlierFlags = scored.map((point) => Math.abs(point.z) >= Z_OUTLIER);
    const run = this.longestTrueRun(outlierFlags);
    const runPoints =
      run.length > 0 ? scored.slice(run.start, run.end + 1) : [];
    const spikeCount = runPoints.filter(
      (point) => Math.abs(point.jumpPercent) >= SPIKE_PERCENT,
    ).length;
    const hoursInRun = new Set(runPoints.map((point) => point.hour));
    const lowPowerFactorHours = runPoints.filter(
      (point) => point.powerFactor < LOW_POWER_FACTOR,
    ).length;
    const badResiduals = scored.filter(
      (point) => point.residual >= RESIDUAL_LIMIT,
    );

    const signals: SeriesSignals = {
      consumptionSpike: spikeCount > 0,
      persistentBaselineChange: run.length >= PERSISTENT_HOURS,
      outliers: run.length >= MIN_OUTLIER_RUN,
      abnormalHourlyPattern:
        run.length >= PERSISTENT_HOURS &&
        hoursInRun.size >= MIN_HOURS_FOR_PATTERN,
      dataQuality: badResiduals.length >= MIN_BAD_RESIDUALS,
      anomalousElectricalRelation: lowPowerFactorHours >= MIN_ELECTRICAL_HOURS,
    };

    const detected = signals.outliers || signals.dataQuality;
    const maxAbsZ = Math.max(...scored.map((point) => Math.abs(point.z)));
    const worstPowerResidual = Math.max(
      ...scored.map((point) => point.residual),
    );

    const segmentMean = runPoints.length
      ? runPoints.reduce((sum, point) => sum + point.consumption, 0) /
        runPoints.length
      : 0;

    const segmentBaseline = runPoints.length
      ? runPoints.reduce((sum, point) => sum + point.baseline, 0) /
        runPoints.length
      : 0;
    const activeSignals = Object.values(signals).filter(Boolean).length;
    const extremity = Math.min(1, Math.max(maxAbsZ / 15, worstPowerResidual));

    return {
      detected,
      baseline:
        segmentBaseline || this.median(series.map((r) => r.consumption_kwh)),
      variationPercent:
        segmentBaseline === 0
          ? 0
          : ((segmentMean - segmentBaseline) / segmentBaseline) * 100,
      signals,
      confidence: detected
        ? Number(
            Math.min(
              0.99,
              0.55 + activeSignals * 0.08 + extremity * 0.2,
            ).toFixed(2),
          )
        : 0,
      maxAbsZ,
      worstPowerResidual,
      badResidualCount: badResiduals.length,
      segment: runPoints.length
        ? {
            from: runPoints[0].timestamp,
            to: runPoints[runPoints.length - 1].timestamp,
            hours: run.length,
            meanConsumption: segmentMean,
          }
        : null,
    };
  }
}
