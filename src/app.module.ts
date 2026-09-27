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
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        // * Uncomment this if you are using a local database
        // port: 5432,
        // host: configService.get('DB_HOST'),
        // username: configService.get('POSTGRES_USER'),
        // password: configService.get('POSTGRES_PASSWORD'),
        // database: configService.get('POSTGRES_DB'),
        entities: [Meter, Reading, Event, Anomaly],
        synchronize: false,
        ssl: {
          rejectUnauthorized: false, // Render requires this to be false
        },
      }),
      inject: [ConfigService],
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
