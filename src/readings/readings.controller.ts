import { Controller, Post } from '@nestjs/common';
import { ReadingsService } from './readings.service';

@Controller('readings')
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Post('seed')
  async seedReadings() {
    await this.readingsService.seedReadings();

    return {
      message: 'Readings seeded successfully',
    };
  }
}
