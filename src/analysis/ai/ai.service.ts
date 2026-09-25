import { Injectable } from '@nestjs/common';
import { AIProvider } from './ai.provider';
import { AnomalyAnalysisInput } from '../dto/anomaly-analysis-input.dto';
import { AIAnalysisResult } from './dto/ai-analysis-result.dto';

@Injectable()
export class AiService {
  constructor(private readonly aiProvider: AIProvider) {}

  async analyzeAnomaly(input: AnomalyAnalysisInput): Promise<AIAnalysisResult> {
    return this.aiProvider.analyzeAnomaly(input);
  }
}
