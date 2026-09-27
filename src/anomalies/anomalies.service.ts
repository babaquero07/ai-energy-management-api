import { Injectable, NotFoundException } from '@nestjs/common';
import { Anomaly } from './entities/anomaly.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnomalySeverity } from './enums/anomaly.enum';

export interface AnomalySummaryStats {
  total: number;
  highPriority: number;
  averageConfidence: number | null;
  lastDetectedAt: Date | null;
  lastStatus: string | null;
}

@Injectable()
export class AnomaliesService {
  constructor(
    @InjectRepository(Anomaly)
    private readonly anomalyRepository: Repository<Anomaly>,
  ) {}

  async create(anomalyData: Partial<Anomaly>): Promise<Anomaly> {
    const anomaly = this.anomalyRepository.create(anomalyData);

    return this.anomalyRepository.save(anomaly);
  }

  async update(anomaly: Anomaly): Promise<Anomaly> {
    return this.anomalyRepository.save(anomaly);
  }

  async findAll(): Promise<Anomaly[]> {
    return this.anomalyRepository.find({
      relations: { meter: true },
      order: { detected_at: 'DESC' },
    });
  }

  async findById(id: number): Promise<Anomaly> {
    const anomaly = await this.anomalyRepository.findOne({
      where: { id },
      relations: { meter: true },
    });

    if (!anomaly) {
      throw new NotFoundException(`Anomaly ${id} not found`);
    }

    return anomaly;
  }

  async getSummaryStats(): Promise<AnomalySummaryStats> {
    const raw = await this.anomalyRepository
      .createQueryBuilder('anomaly')
      .select('COUNT(*)::int', 'total')
      .addSelect(
        `SUM(CASE WHEN anomaly.severity = :high THEN 1 ELSE 0 END)::int`,
        'highPriority',
      )
      .addSelect('AVG(anomaly.confidence)', 'averageConfidence')
      .setParameter('high', AnomalySeverity.HIGH)
      .getRawOne<{
        total: string | number | null;
        highPriority: string | number | null;
        averageConfidence: string | null;
      }>();

    const latest = await this.anomalyRepository.findOne({
      order: { detected_at: 'DESC' },
    });

    const total = Number(raw?.total ?? 0);

    return {
      total,
      highPriority: Number(raw?.highPriority ?? 0),
      averageConfidence:
        total === 0 || raw?.averageConfidence == null
          ? null
          : Number(raw.averageConfidence),
      lastDetectedAt: latest?.detected_at ?? null,
      lastStatus: latest?.status ?? null,
    };
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.anomalyRepository.delete(id);
  }
}
