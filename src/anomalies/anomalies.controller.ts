import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';
import { AnomaliesResponseDto } from './dto/anomalies-response.dto';
import { AnomalyDetailResponseDto } from './dto/anomaly-detail-response.dto';

@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  async findAll(): Promise<AnomaliesResponseDto> {
    return this.anomaliesService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnomalyDetailResponseDto> {
    return this.anomaliesService.findOne(id);
  }
}
