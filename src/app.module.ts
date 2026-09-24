import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetersModule } from './meters/meters.module';
import { AnomaliesModule } from './anomalies/anomalies.module';
import { AnalysisModule } from './analysis/analysis.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReadingsModule } from './readings/readings.module';
import { EventsModule } from './events/events.module';
import { Meter } from './meters/entities/meter.entity';
import { Reading } from './readings/entities/reading.entity';
import { Event } from './events/entities/event.entity';
import { Anomaly } from './anomalies/entities/anomaly.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'abaquero',
      password: 'jukiloju',
      database: 'ai-energy-management-db',
      entities: [Meter, Reading, Event, Anomaly],
      synchronize: true, // TODO: Change on production
    }),
    MetersModule,
    AnomaliesModule,
    AnalysisModule,
    DashboardModule,
    ReadingsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private datasource: DataSource) {}
}
