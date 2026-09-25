import { Controller, Get } from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';
import { AnomaliesResponseDto } from './dto/anomalies-response.dto';

@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  async findAll(): Promise<AnomaliesResponseDto> {
    return this.anomaliesService.findAll();
  }
}
