// src/anomalies/entities/anomaly.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meter } from '../../meters/entities/meter.entity';
import {
  AnomalySeverity,
  AnomalyStatus,
  AnomalyType,
} from '../enums/anomaly.enum';

@Entity('anomalies')
export class Anomaly {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  detected_at: Date;

  @Column({ type: 'enum', enum: AnomalyType })
  type: string;

  @Column({ type: 'enum', enum: AnomalySeverity })
  severity: string;

  @Column({ type: 'float' })
  confidence: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text' })
  recommended_action: string;

  @Column({ type: 'enum', enum: AnomalyStatus })
  status: string;

  @Column({ type: 'json', nullable: true })
  analysis_data: Record<string, any>;

  // Relación N:1 con Meter (FK a meter_id varchar)
  @ManyToOne(() => Meter, (meter) => meter.anomalies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_id', referencedColumnName: 'meter_id' })
  meter: Meter;
}
