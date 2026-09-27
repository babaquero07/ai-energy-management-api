import { Controller, Get, Param, Query } from '@nestjs/common';
import { MetersService } from './meters.service';
import { MetersResponseDto } from './dto/meters-response.dto';
import { MeterDetailResponseDto } from './dto/meter-detail-response.dto';
import { ReadingsResponseDto } from 'src/readings/dto/readings-reponse.dto';
import { FindMetersQueryDto } from './dto/find-meters-query.dto';

@Controller('meters')
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Get()
  findAll(@Query() query: FindMetersQueryDto): Promise<MetersResponseDto> {
    return this.metersService.findAll(query);
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

  /** Only for development purposes. Uncomment to seed meters. if your db is empty. */
  // @Post('seed')
  // async seedMeters() {
  //   await this.metersService.seedMeters();

  //   return {
  //     message: 'Meters seeded successfully',
  //   };
  // }
}
