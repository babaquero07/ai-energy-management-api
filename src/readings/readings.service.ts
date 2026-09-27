import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Reading } from './entities/reading.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Meter } from '../meters/entities/meter.entity';

@Injectable()
export class ReadingsService {
  constructor(
    @InjectRepository(Reading)
    private readingRepository: Repository<Reading>,
  ) {}

  async seedReadings() {
    try {
      const filePath = join(process.cwd(), 'files', 'readings.csv');
      const content = await readFile(filePath, 'utf-8');
      const readings = this.parseReadingsCsv(content);

      await this.readingRepository.save(readings, { chunk: 500 });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error seeding readings');
    }
  }

  async getTotalConsumption(): Promise<number> {
    return (await this.readingRepository.sum('consumption_kwh')) || 0;
  }

  private parseReadingsCsv(content: string): Partial<Reading>[] {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const [, ...rows] = lines;

    return rows.map((line) => {
      const [
        meter_id,
        timestamp,
        consumption_kwh,
        voltage_v,
        current_a,
        power_factor,
        status,
      ] = line.split(',');

      return {
        timestamp: new Date(timestamp.trim().replace(' ', 'T')),
        consumption_kwh: Number(consumption_kwh),
        voltage_v: Number(voltage_v),
        current_a: Number(current_a),
        power_factor: Number(power_factor),
        status: status.trim(),
        meter: { meter_id: meter_id.trim() } as Meter,
      };
    });
  }
}
