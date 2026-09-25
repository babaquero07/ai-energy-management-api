import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalyzeMeterDto } from './dto/analyze-meter.dto';
import { AnomalyResponseDto } from 'src/anomalies/dto/anomaly-response.dto';
import { AnomalyDetailResponseDto } from 'src/anomalies/dto/anomaly-detail-response.dto';

@Controller('ai')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('analyze')
  async analyzeMeter(
    @Body() analyzeMeterDto: AnalyzeMeterDto,
  ): Promise<{ detected: boolean; anomaly: AnomalyResponseDto | null }> {
    return this.analysisService.analyzeMeter(analyzeMeterDto.meter_id);
  }

  @Get('analysis/:id')
  async getAnalysis(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnomalyDetailResponseDto> {
    return this.analysisService.getAnalysis(id);
  }
}
