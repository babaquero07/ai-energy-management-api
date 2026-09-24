// src/events/entities/event.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meter } from '../../meters/entities/meter.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'text' })
  description: string;

  // Relación N:1 con Meter (FK a meter_id varchar)
  @ManyToOne(() => Meter, (meter) => meter.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_id', referencedColumnName: 'meter_id' })
  meter: Meter;
}
