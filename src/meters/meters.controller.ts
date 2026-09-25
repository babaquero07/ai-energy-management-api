import { Controller, Get, Param } from '@nestjs/common';
import { MetersService } from './meters.service';
import { MetersResponseDto } from './dto/meters-response.dto';
import { MeterDetailResponseDto } from './dto/meter-detail-response.dto';
import { ReadingsResponseDto } from './dto/readings-reponse.dto';

@Controller('meters')
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Get()
  findAll(): Promise<MetersResponseDto> {
    return this.metersService.findAll();
  }

  @Get(':id')
  async getMeterById(
    @Param('id') id: string,
  ): Promise<{ data: MeterDetailResponseDto }> {
    const meter = await this.metersService.getMeterById(id);

    return {
      data: meter,
    };
  }

  @Get(':id/readings')
  async getMeterREadings(
    @Param('id') id: string,
  ): Promise<ReadingsResponseDto> {
    return this.metersService.getMeterReadings(id);
  }
}
