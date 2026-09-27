import { Controller, Post } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('seed')
  async seedEvents() {
    await this.eventsService.seedEvents();

    return {
      message: 'Events seeded successfully',
    };
  }
}
