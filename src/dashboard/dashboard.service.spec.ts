import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { MetersService } from 'src/meters/meters.service';
import { ReadingsService } from 'src/readings/readings.service';
import { AnomaliesService } from 'src/anomalies/anomalies.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: MetersService, useValue: {} },
        { provide: ReadingsService, useValue: {} },
        { provide: AnomaliesService, useValue: {} },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
