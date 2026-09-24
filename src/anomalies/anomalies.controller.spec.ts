import { Test, TestingModule } from '@nestjs/testing';
import { AnomaliesController } from './anomalies.controller';
import { AnomaliesService } from './anomalies.service';

describe('AnomaliesController', () => {
  let controller: AnomaliesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnomaliesController],
      providers: [AnomaliesService],
    }).compile();

    controller = module.get<AnomaliesController>(AnomaliesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
