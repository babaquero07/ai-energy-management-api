import { Controller } from '@nestjs/common';
import { ReadingsService } from './readings.service';

@Controller('readings')
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  /** Only for development purposes. Uncomment to seed readings. if your db is empty. */
  // @Post('seed')
  // async seedReadings() {
  //   await this.readingsService.seedReadings();

  //   return {
  //     message: 'Readings seeded successfully',
  //   };
  // }
}
