import { Controller, Get, Param } from '@nestjs/common';
import { MetersService } from './meters.service';
import { MetersResponseDto } from './dto/meters-response.dto';

@Controller('meters')
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Get()
  findAll(): Promise<MetersResponseDto> {
    return this.metersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metersService.findOne(+id);
  }

  @Get(':id/readings')
  getMeterREadings(@Param('id') id: string) {
    return this.metersService.findOne(+id);
  }
}
