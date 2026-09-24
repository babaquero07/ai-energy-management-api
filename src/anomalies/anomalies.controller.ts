import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';
import { CreateAnomalyDto } from './dto/create-anomaly.dto';
import { UpdateAnomalyDto } from './dto/update-anomaly.dto';

@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Post()
  create(@Body() createAnomalyDto: CreateAnomalyDto) {
    return this.anomaliesService.create(createAnomalyDto);
  }

  @Get()
  findAll() {
    return this.anomaliesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.anomaliesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAnomalyDto: UpdateAnomalyDto) {
    return this.anomaliesService.update(+id, updateAnomalyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.anomaliesService.remove(+id);
  }
}
