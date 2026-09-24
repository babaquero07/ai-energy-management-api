// src/anomalies/entities/anomaly.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meter } from '../../meters/entities/meter.entity';

@Entity('anomalies')
export class Anomaly {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  detected_at: Date;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar', length: 50 })
  severity: string;

  @Column({ type: 'float' })
  confidence: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text' })
  recommended_action: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  // Relación N:1 con Meter
  @ManyToOne(() => Meter, (meter) => meter.anomalies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_id' })
  meter: Meter;
}
