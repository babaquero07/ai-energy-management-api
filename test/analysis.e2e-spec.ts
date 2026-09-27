jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AnalysisController } from '../src/analysis/analysis.controller';
import { AnalysisService } from '../src/analysis/analysis.service';
import { AnomalyDetectorService } from '../src/analysis/anomaly-detector.service';
import { BaselineService } from '../src/analysis/baseline.service';
import { AIProvider } from '../src/analysis/ai/ai.provider';
import { AiService } from '../src/analysis/ai/ai.service';
import { AnomaliesService } from '../src/anomalies/anomalies.service';
import { Anomaly } from '../src/anomalies/entities/anomaly.entity';
import {
  AnomalySeverity,
  AnomalyStatus,
  AnomalyType,
} from '../src/anomalies/enums/anomaly.enum';
import { Meter } from '../src/meters/entities/meter.entity';
import { MetersService } from '../src/meters/meters.service';
import { spikedWeek } from './fixtures/meter-series.fixture';

const AI_REASON =
  'El consumo se mantuvo muy por encima de la línea base durante varias horas, sin un desajuste eléctrico que indique un error de medición.';
const AI_ACTION = 'Inspeccionar la carga conectada al medidor M-109.';

interface AnalyzeResponseBody {
  detected: boolean;
  anomaly: {
    id: number;
    meter_id: string;
    type: string;
    severity: string;
    status: string;
    confidence: number;
  };
}

interface AnomalyDetailBody {
  id: number;
  meter_id: string;
  type: string;
  severity: string;
  status: string;
  reason: string;
  recommended_action: string;
  analysis_data: {
    signals: {
      outliers: boolean;
    };
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Expected object response');
  }

  return value as Record<string, unknown>;
}

function readAnalyzeBody(body: unknown): AnalyzeResponseBody {
  const record = asRecord(body);
  const anomaly = asRecord(record.anomaly);

  return {
    detected: record.detected === true,
    anomaly: {
      id: Number(anomaly.id),
      meter_id: String(anomaly.meter_id),
      type: String(anomaly.type),
      severity: String(anomaly.severity),
      status: String(anomaly.status),
      confidence: Number(anomaly.confidence),
    },
  };
}

function readDetailBody(body: unknown): AnomalyDetailBody {
  const record = asRecord(body);
  const analysisData = asRecord(record.analysis_data);
  const signals = asRecord(analysisData.signals);

  return {
    id: Number(record.id),
    meter_id: String(record.meter_id),
    type: String(record.type),
    severity: String(record.severity),
    status: String(record.status),
    reason: String(record.reason),
    recommended_action: String(record.recommended_action),
    analysis_data: {
      signals: {
        outliers: signals.outliers === true,
      },
    },
  };
}

describe('Flujo crítico de análisis (e2e)', () => {
  let app: INestApplication<App>;
  let analyzeResponse: request.Response;

  const meter = {
    id: 1,
    meter_id: 'M-109',
    name: 'Compresor principal',
    location: 'Planta norte',
    status: 'Activo',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    readings: spikedWeek(),
    events: [],
    anomalies: [],
  } as Meter;

  const anomalies = new Map<number, Anomaly>();
  let nextAnomalyId = 1;

  const anomaliesService: Pick<
    AnomaliesService,
    'create' | 'findById' | 'update'
  > = {
    create: jest.fn((data: Partial<Anomaly>) => {
      const anomaly = {
        id: nextAnomalyId++,
        detected_at: new Date('2026-01-08T00:00:00.000Z'),
        ...data,
      } as Anomaly;

      anomalies.set(anomaly.id, anomaly);

      return Promise.resolve(anomaly);
    }),
    findById: jest.fn((id: number) => {
      const anomaly = anomalies.get(id);

      if (!anomaly) {
        return Promise.reject(new Error(`Anomaly ${id} not found`));
      }

      return Promise.resolve(anomaly);
    }),
    update: jest.fn((anomaly: Anomaly) => {
      anomalies.set(anomaly.id, anomaly);

      return Promise.resolve(anomaly);
    }),
  };

  const aiProvider = {
    analyzeAnomaly: jest.fn().mockResolvedValue({
      reason: AI_REASON,
      evidence: ['Racha de outliers de 8 horas'],
      recommended_action: AI_ACTION,
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        AnalysisService,
        AnomalyDetectorService,
        BaselineService,
        AiService,
        {
          provide: MetersService,
          useValue: { findOne: () => Promise.resolve(meter) },
        },
        { provide: AnomaliesService, useValue: anomaliesService },
        { provide: AIProvider, useValue: aiProvider },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    analyzeResponse = await request(app.getHttpServer())
      .post('/api/ai/analyze')
      .send({ meter_id: 'M-109' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('detecta una anomalía real y la deja pendiente de análisis IA', () => {
    const body = readAnalyzeBody(analyzeResponse.body as unknown);

    expect(analyzeResponse.status).toBe(201);
    expect(body.detected).toBe(true);
    expect(body.anomaly).toEqual(
      expect.objectContaining({
        meter_id: 'M-109',
        type: AnomalyType.REAL_ANOMALY,
        severity: AnomalySeverity.HIGH,
        status: AnomalyStatus.DETECTED,
      }),
    );
    expect(Number.isInteger(body.anomaly.id)).toBe(true);
    expect(body.anomaly.confidence).toBeGreaterThan(0.5);
  });

  it('completa el hallazgo con la IA y lo expone en el detalle', async () => {
    const anomalyId = readAnalyzeBody(analyzeResponse.body as unknown).anomaly
      .id;

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/ai/analysis/${anomalyId}`)
      .expect(200);

    expect(asRecord(updateResponse.body as unknown)).toMatchObject({
      success: true,
      message: 'Anomaly analysis updated successfully',
    });
    expect(aiProvider.analyzeAnomaly).toHaveBeenCalledWith(
      expect.objectContaining({
        anomaly_id: anomalyId,
        meter_id: 'M-109',
        type: AnomalyType.REAL_ANOMALY,
        severity: AnomalySeverity.HIGH,
      }),
    );

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/ai/analysis/${anomalyId}`)
      .expect(200);

    expect(readDetailBody(detailResponse.body as unknown)).toEqual({
      id: anomalyId,
      meter_id: 'M-109',
      status: AnomalyStatus.COMPLETED,
      type: AnomalyType.REAL_ANOMALY,
      severity: AnomalySeverity.HIGH,
      reason: AI_REASON,
      recommended_action: AI_ACTION,
      analysis_data: {
        signals: {
          outliers: true,
        },
      },
    });
  });
});
