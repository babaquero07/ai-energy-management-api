import { Injectable, NotFoundException } from '@nestjs/common';
import { Anomaly } from './entities/anomaly.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnomaliesResponseDto } from './dto/anomalies-response.dto';
import { AnomalyDetailResponseDto } from './dto/anomaly-detail-response.dto';

@Injectable()
export class AnomaliesService {
  constructor(
    @InjectRepository(Anomaly)
    private anomalyRepository: Repository<Anomaly>,
  ) {}

  async create(anomalyData: Partial<Anomaly>) {
    const anomaly = this.anomalyRepository.create(anomalyData);

    return await this.anomalyRepository.save(anomaly);
  }

  async update(data: Partial<Anomaly>) {
    return this.anomalyRepository.save(data);
  }

  async findAll(): Promise<AnomaliesResponseDto> {
    const anomalies = await this.anomalyRepository.find({
      relations: {
        meter: true,
      },
      order: {
        detected_at: 'DESC',
      },
    });

    return new AnomaliesResponseDto(anomalies);
  }

  async findOne(id: number): Promise<AnomalyDetailResponseDto> {
    const anomaly = await this.anomalyRepository.findOne({
      where: { id },
      relations: {
        meter: true,
      },
    });

    if (!anomaly) throw new NotFoundException(`Anomaly ${id} not found`);

    return new AnomalyDetailResponseDto(anomaly);
  }

  async delete(id: number) {
    const anomaly = await this.anomalyRepository.findOne({
      where: { id },
    });

    if (!anomaly) throw new NotFoundException(`Anomaly ${id} not found`);

    await this.anomalyRepository.delete(id);
  }
}
