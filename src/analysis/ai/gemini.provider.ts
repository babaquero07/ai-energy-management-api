import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './ai.provider';
import { AnomalyAnalysisInput } from '../dto/anomaly-analysis-input.dto';
import { AIAnalysisResult } from './dto/ai-analysis-result.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiProvider extends AIProvider {
  private ai: GoogleGenAI | null = null;
  private readonly model: string = 'gemini-3.7-flash';

  private buildPrompt(input: AnomalyAnalysisInput): string {
    return `
  You are an AI assistant specialized in energy consumption analysis.
  
  Your task is to interpret an electrical energy anomaly detected by a deterministic
  analytics engine.
  
  IMPORTANT RULES:
  
  1. Use only the information provided in the anomaly data.
  2. Do not invent measurements, operational events, causes, or evidence.
  3. Do not perform a new anomaly detection.
  4. Explain the anomaly based on the detected signals and available evidence.
  5. If there is insufficient evidence to determine the cause, explicitly state that.
  6. Recommendations must be practical and related to the available evidence.
  7. Keep the explanation concise and suitable for an energy operations dashboard.
  8. Translate the explanation to Spanish.
  
  Anomaly information:
  
  ${JSON.stringify(input, null, 2)}
  `;
  }

  private readonly responseSchema = {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        description:
          'Concise explanation of why the anomaly was detected based only on the available evidence.',
      },
      evidence: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Specific pieces of evidence supporting the explanation.',
      },
      recommended_action: {
        type: 'string',
        description:
          'Practical recommended action based only on the available evidence.',
      },
    },
    required: ['reason', 'evidence', 'recommended_action'],
  };

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private getClient(): GoogleGenAI {
    if (this.ai) {
      return this.ai;
    }

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    this.ai = new GoogleGenAI({ apiKey });

    return this.ai;
  }

  async analyzeAnomaly(input: AnomalyAnalysisInput): Promise<AIAnalysisResult> {
    const prompt = this.buildPrompt(input);
    const client = this.getClient();

    const response = await client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: this.responseSchema,
      },
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response');
    }

    return JSON.parse(response.text) as AIAnalysisResult;
  }
}
