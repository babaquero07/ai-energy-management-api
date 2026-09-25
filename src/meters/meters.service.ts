import { Injectable, NotFoundException } from '@nestjs/common';
import { MetersResponseDto } from './dto/meters-response.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Meter } from './entities/meter.entity';
import { MeterDetailResponseDto } from './dto/meter-detail-response.dto';
import { BaselineService } from 'src/analysis/baseline.service';
import { ReadingsResponseDto } from './dto/readings-reponse.dto';

@Injectable()
export class MetersService {
  constructor(
    @InjectRepository(Meter)
    private meterRepository: Repository<Meter>,

    private readonly baselineService: BaselineService,
  ) {}

  async findAll(): Promise<MetersResponseDto> {
    const meters = await this.meterRepository.find();

    return {
      data: meters,
      total: meters.length,
    };
  }

  async getMeterById(id: string): Promise<MeterDetailResponseDto> {
    const meter = await this.meterRepository.findOne({
      where: { meter_id: id },
      relations: {
        readings: true,
      },
      order: {
        readings: {
          timestamp: 'DESC',
        },
      },
    });

    if (!meter) throw new NotFoundException(`Meter ${id} not found`);

    const currentReading = meter.readings[0];

    const baseline = this.baselineService.calculate(meter.readings);

    const variationPercent = this.baselineService.calculateVariation(
      currentReading.consumption_kwh,
      baseline,
    );

    return {
      id: meter.id,
      meter_id: meter.meter_id,
      name: meter.name,
      location: meter.location,
      status: meter.status,
      created_at: meter.created_at,

      current: {
        consumption: currentReading.consumption_kwh,
        voltage: currentReading.voltage_v,
        current: currentReading.current_a,
        powerFactor: currentReading.power_factor,
        timestamp: currentReading.timestamp,
      },

      analysis: {
        baseline,
        variationPercent,
      },

      history: meter.readings.map((reading) => ({
        timestamp: reading.timestamp,
        consumption: reading.consumption_kwh,
        voltage: reading.voltage_v,
        current: reading.current_a,
        powerFactor: reading.power_factor,
      })),
    };
  }

  async getMeterReadings(meter_id: string): Promise<ReadingsResponseDto> {
    const meter = await this.meterRepository.findOne({
      where: { meter_id },
      relations: {
        readings: true,
      },
      order: {
        readings: {
          timestamp: 'ASC',
        },
      },
    });

    if (!meter) throw new NotFoundException(`Meter ${meter_id} not found`);

    return {
      data: meter.readings.map((reading) => ({
        timestamp: reading.timestamp,
        consumption: reading.consumption_kwh,
        voltage: reading.voltage_v,
        current: reading.current_a,
        powerFactor: reading.power_factor,
      })),
      total: meter.readings.length,
    };
  }

  async countMeters(): Promise<number> {
    return await this.meterRepository.count();
  }
}
