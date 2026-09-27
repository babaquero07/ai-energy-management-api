import { Controller, Delete, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';
import { AnomaliesResponseDto } from './dto/anomalies-response.dto';
import { AnomalyDetailResponseDto } from './dto/anomaly-detail-response.dto';

@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  async findAll(): Promise<AnomaliesResponseDto> {
    const anomalies = await this.anomaliesService.findAll();

    return new AnomaliesResponseDto(anomalies);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnomalyDetailResponseDto> {
    const anomaly = await this.anomaliesService.findById(id);

    return new AnomalyDetailResponseDto(anomaly);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.anomaliesService.delete(id);

    return {
      success: true,
      message: 'Anomaly deleted successfully',
    };
  }
}
