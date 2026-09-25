import { AnomalyAnalysisInput } from '../dto/anomaly-analysis-input.dto';
import { AIAnalysisResult } from './dto/ai-analysis-result.dto';

export abstract class AIProvider {
  abstract analyzeAnomaly(
    input: AnomalyAnalysisInput,
  ): Promise<AIAnalysisResult>;
}
