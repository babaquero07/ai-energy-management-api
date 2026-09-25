export class DashboardSummaryDto {
  meters: number;
  totalConsumption: number;
  anomalies: number;
  highPriorityAnomalies: number;
  aiConfidence: number | null;
  lastAnalysisAt: string | null;
  lastAnalysisStatus: string | null;
}
