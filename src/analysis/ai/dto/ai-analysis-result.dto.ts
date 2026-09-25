export class AIAnalysisResult {
  reason: string;
  evidence: string[];
  recommended_action: string;

  constructor(data: AIAnalysisResult) {
    this.reason = data.reason;
    this.evidence = data.evidence;
    this.recommended_action = data.recommended_action;
  }
}
