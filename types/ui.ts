export interface RoutingInfo {
  model: string;
  provider: string;
  label: string;
  reasoning: string;
  estimatedCostUsd: number;
  estimatedLatencyMs: number;
  intentDetected: string;
  scoreSummary: Array<{
    provider: string;
    model: string;
    label: string;
    score: number;
    breakdown: Record<string, number>;
    disqualified?: string;
  }>;
  tools: string[];
}
