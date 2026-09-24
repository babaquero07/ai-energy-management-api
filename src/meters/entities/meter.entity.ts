// src/meters/entities/meter.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reading } from '../../readings/entities/reading.entity';
import { Event } from '../../events/entities/event.entity';
import { Anomaly } from '../../anomalies/entities/anomaly.entity';

@Entity('meters')
export class Meter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  meter_id: string; // Ej: M-109

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  // Relaciones 1:N
  @OneToMany(() => Reading, (reading) => reading.meter)
  readings: Reading[];

  @OneToMany(() => Event, (event) => event.meter)
  events: Event[];

  @OneToMany(() => Anomaly, (anomaly) => anomaly.meter)
  anomalies: Anomaly[];
}
