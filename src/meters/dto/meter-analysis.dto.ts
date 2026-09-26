export class MeterAnalysisDto {
  baseline: number;
  variationPercent: number;

  constructor(analysis: MeterAnalysisDto) {
    this.baseline = analysis.baseline;
    this.variationPercent = analysis.variationPercent;
  }
}
