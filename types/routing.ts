export type IntentType =
  | "simple_qa"
  | "long_document_analysis"
  | "code_generation"
  | "code_review"
  | "creative_writing"
  | "data_analysis"
  | "web_research"
  | "math_reasoning"
  | "image_understanding"
  | "multi_step_task";

export type ProviderType = "openai" | "anthropic" | "google" | "ollama";

export interface OptimizationPreferences {
  accuracy: number;   // 0-1
  speed: number;      // 0-1
  cost: number;       // 0-1 (higher = prefer cheaper)
  creativity: number; // 0-1
  reasoning: number;  // 0-1
  privacy: number;    // 0-1 (higher = prefer local models)
}

export interface ModelConfig {
  provider: ProviderType;
  model: string;
  label: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  strengths: IntentType[];
  avgLatencyMs: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
}

export interface ProviderConfig {
  provider: ProviderType;
  keyId: string;
  baseUrl?: string; // for Ollama
  models: string[];
}

export interface ModelScore {
  provider: ProviderType;
  model: string;
  label: string;
  score: number;
  breakdown: {
    accuracy: number;
    speed: number;
    cost: number;
    contextFit: number;
    taskSuitability: number;
  };
  disqualified?: string;
}

export interface RoutingDecision {
  provider: ProviderType;
  model: string;
  tools: string[];
  reasoning: string;
  scoreSummary: ModelScore[];
  estimatedCostUsd: number;
  estimatedLatencyMs: number;
  intentDetected: IntentType;
  fallback?: { provider: ProviderType; model: string };
}

export interface RouterInput {
  prompt: string;
  history: Array<{ role: string; content: string }>;
  preferences: OptimizationPreferences;
  availableProviders: ProviderConfig[];
  enabledPluginSlugs: string[];
  estimatedContextTokens: number;
}
