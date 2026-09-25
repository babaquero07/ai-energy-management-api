import { forwardRef, Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { Analysis } from './entities/analysis.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaselineService } from './baseline.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { MetersModule } from 'src/meters/meters.module';
import { AnomaliesModule } from 'src/anomalies/anomalies.module';
import { AIProvider } from './ai/ai.provider';
import { GeminiProvider } from './ai/gemini.provider';
import { AiService } from './ai/ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Analysis]),
    forwardRef(() => MetersModule),
    AnomaliesModule,
  ],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    BaselineService,
    AnomalyDetectorService,
    AiService,
    {
      provide: AIProvider,
      useClass: GeminiProvider,
    },
  ],
  exports: [BaselineService],
})
export class AnalysisModule {}
