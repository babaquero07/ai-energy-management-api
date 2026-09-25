import { Injectable } from '@nestjs/common';
import { Reading } from './entities/reading.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ReadingsService {
  constructor(
    @InjectRepository(Reading)
    private readingRepository: Repository<Reading>,
  ) {}

  async getTotalConsumption(): Promise<number> {
    return (await this.readingRepository.sum('consumption_kwh')) || 0;
  }
}
