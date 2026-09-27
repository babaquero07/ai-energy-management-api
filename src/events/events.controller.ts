import { Controller } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /** Only for development purposes. Uncomment to seed events. if your db is empty. */
  // @Post('seed')
  // async seedEvents() {
  //   await this.eventsService.seedEvents();

  //   return {
  //     message: 'Events seeded successfully',
  //   };
  // }
}
