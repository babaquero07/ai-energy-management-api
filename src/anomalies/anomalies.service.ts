import { Injectable } from '@nestjs/common';
import { Anomaly } from './entities/anomaly.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnomaliesResponseDto } from './dto/anomalies-response.dto';

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
}
