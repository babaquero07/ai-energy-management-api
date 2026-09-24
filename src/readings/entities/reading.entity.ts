// src/readings/entities/reading.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meter } from '../../meters/entities/meter.entity';

@Entity('readings')
export class Reading {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'float' })
  consumption_kwh: number;

  @Column({ type: 'float' })
  voltage_v: number;

  @Column({ type: 'float' })
  current_a: number;

  @Column({ type: 'float' })
  power_factor: number;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  // Relación N:1 con Meter (FK a meter_id varchar)
  @ManyToOne(() => Meter, (meter) => meter.readings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_id', referencedColumnName: 'meter_id' })
  meter: Meter;
}
