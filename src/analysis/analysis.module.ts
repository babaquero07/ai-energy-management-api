import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { BaselineModule } from './baseline.module';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { MetersModule } from 'src/meters/meters.module';
import { AnomaliesModule } from 'src/anomalies/anomalies.module';
import { AIProvider } from './ai/ai.provider';
import { GeminiProvider } from './ai/gemini.provider';
import { AiService } from './ai/ai.service';

@Module({
  imports: [BaselineModule, MetersModule, AnomaliesModule],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    AnomalyDetectorService,
    AiService,
    {
      provide: AIProvider,
      useClass: GeminiProvider,
    },
  ],
})
export class AnalysisModule {}
