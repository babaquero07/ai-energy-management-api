import { AnomalyDetectorService } from './anomaly-detector.service';
import { BaselineService } from './baseline.service';
import { AnomalySeverity, AnomalyType } from '../anomalies/enums/anomaly.enum';
import {
  inconsistentPowerWeek,
  meterEvent,
  spikeWindow,
  spikedWeek,
  stableWeek,
} from '../../test/fixtures/meter-series.fixture';

describe('AnomalyDetectorService', () => {
  const detector = new AnomalyDetectorService(new BaselineService());

  it('no marca anomalía cuando el consumo se mantiene en la línea base', () => {
    const result = detector.detect(stableWeek());

    expect(result.detected).toBe(false);
    expect(result.type).toBeNull();
    expect(result.severity).toBeNull();
    expect(result.segment).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('clasifica un pico de consumo sostenido y eléctricamente coherente como anomalía real', () => {
    const result = detector.detect(spikedWeek());

    expect(result.detected).toBe(true);
    expect(result.signals.outliers).toBe(true);
    expect(result.signals.consumptionSpike).toBe(true);
    expect(result.signals.dataQuality).toBe(false);
    expect(result.type).toBe(AnomalyType.REAL_ANOMALY);
    expect(result.severity).toBe(AnomalySeverity.HIGH);
    expect(result.relatedEvent).toBeNull();
    expect(result.segment?.hours).toBeGreaterThanOrEqual(6);
    expect(result.variationPercent).toBeGreaterThan(40);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('clasifica un desajuste entre consumo y potencia eléctrica como problema de datos', () => {
    const result = detector.detect(inconsistentPowerWeek());

    expect(result.detected).toBe(true);
    expect(result.signals.dataQuality).toBe(true);
    expect(result.signals.outliers).toBe(false);
    expect(result.type).toBe(AnomalyType.DATA_QUALITY);
    expect(result.severity).toBe(AnomalySeverity.LOW);
  });

  it('degrada la anomalía a falso positivo si un evento operativo explica el tramo', () => {
    const readings = spikedWeek();
    const { from } = spikeWindow(readings);
    const event = meterEvent(from, 'OPERATIONAL_CHANGE');

    const result = detector.detect(readings, [event]);

    expect(result.type).toBe(AnomalyType.FALSE_POSITIVE);
    expect(result.severity).toBe(AnomalySeverity.MEDIUM);
    expect(result.relatedEvent).toBe(event);
  });

  it('mantiene la anomalía real si el evento operativo queda fuera de la ventana del tramo', () => {
    const readings = spikedWeek();
    const { from } = spikeWindow(readings);
    const event = meterEvent(
      new Date(from.getTime() - 3 * 60 * 60 * 1000),
      'OPERATIONAL_CHANGE',
    );

    const result = detector.detect(readings, [event]);

    expect(result.type).toBe(AnomalyType.REAL_ANOMALY);
    expect(result.severity).toBe(AnomalySeverity.HIGH);
    expect(result.relatedEvent).toBeNull();
  });
});
