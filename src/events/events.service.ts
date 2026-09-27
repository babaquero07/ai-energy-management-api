import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Meter } from '../meters/entities/meter.entity';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async seedEvents() {
    try {
      const filePath = join(process.cwd(), 'files', 'events.csv');
      const content = await readFile(filePath, 'utf-8');
      const events = this.parseEventsCsv(content);

      await this.eventRepository.save(events);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error seeding events');
    }
  }

  private parseEventsCsv(content: string): Partial<Event>[] {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const [, ...rows] = lines;

    return rows.map((line) => {
      const [meter_id, timestamp, type, ...descriptionParts] = line.split(',');

      return {
        timestamp: new Date(timestamp.trim().replace(' ', 'T')),
        type: type.trim(),
        description: descriptionParts.join(',').trim(),
        meter: { meter_id: meter_id.trim() } as Meter,
      };
    });
  }
}
