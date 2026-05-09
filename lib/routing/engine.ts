import type { RouterInput, RoutingDecision } from "@/types/routing";
import { MODEL_REGISTRY, TASK_TYPE_LABELS } from "./models";
import { classifyIntent } from "./classifier";
import { scoreModel } from "./scorer";

export async function route(input: RouterInput): Promise<RoutingDecision> {
  const { intent, confidence, requiresTools, requiresVision, estimatedComplexity } =
    classifyIntent(input.prompt, input.history);

  // Filter to models available from user's connected providers
  const connectedProviders = new Set(input.availableProviders.map((p) => p.provider));
  const available = MODEL_REGISTRY.filter((m) => connectedProviders.has(m.provider));

  if (available.length === 0) {
    throw new Error("No AI providers connected. Add an API key in Settings → API Keys.");
  }

  // Score each model
  const scored = available.map((model) =>
    scoreModel(model, {
      intent,
      requiresTools,
      requiresVision,
      estimatedContextTokens: input.estimatedContextTokens,
      preferences: input.preferences,
    })
  );

  const eligible = scored.filter((s) => !s.disqualified && s.score > 0);
  const sorted = eligible.sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    // Fall back to first available model regardless of constraints
    const fallbackModel = available[0];
    return buildDecision(
      fallbackModel.provider,
      fallbackModel.model,
      scored,
      intent,
      [],
      input,
      "Fallback: no model met all requirements"
    );
  }

  const winner = sorted[0];
  const fallback = sorted[1] ?? null;

  // Determine which tools are needed
  const tools = requiresTools ? resolveTools(input.enabledPluginSlugs) : [];

  const reasoning = buildReasoning(winner, intent, estimatedComplexity, tools, confidence);

  return {
    provider: winner.provider,
    model: winner.model,
    tools,
    reasoning,
    scoreSummary: scored,
    estimatedCostUsd: estimateCost(winner, input.estimatedContextTokens),
    estimatedLatencyMs: getModelLatency(winner.model),
    intentDetected: intent,
    fallback: fallback
      ? { provider: fallback.provider, model: fallback.model }
      : undefined,
  };
}

function buildDecision(
  provider: string,
  model: string,
  scored: ReturnType<typeof scoreModel>[],
  intent: Parameters<typeof buildReasoning>[1],
  tools: string[],
  input: RouterInput,
  overrideReason: string
): RoutingDecision {
  return {
    provider: provider as RoutingDecision["provider"],
    model,
    tools,
    reasoning: overrideReason,
    scoreSummary: scored,
    estimatedCostUsd: 0,
    estimatedLatencyMs: 1500,
    intentDetected: intent,
  };
}

function resolveTools(enabledSlugs: string[]): string[] {
  const toolMap: Record<string, string> = {
    "web-search": "web_search",
    "url-reader": "url_reader",
    calculator: "calculator",
    "document-parser": "document_parser",
  };
  return enabledSlugs.flatMap((slug) => (toolMap[slug] ? [toolMap[slug]] : []));
}

function buildReasoning(
  winner: ReturnType<typeof scoreModel>,
  intent: Parameters<typeof classifyIntent>[0] extends string ? never : ReturnType<typeof classifyIntent>["intent"],
  complexity: string,
  tools: string[],
  confidence: number
): string {
  const taskLabel = TASK_TYPE_LABELS[intent as keyof typeof TASK_TYPE_LABELS] ?? intent;
  const parts: string[] = [];

  parts.push(`${winner.label} selected for ${taskLabel.toLowerCase()}.`);

  if (winner.breakdown.taskSuitability >= 0.9) {
    parts.push(`Optimized for this task type.`);
  }

  if (complexity === "high") {
    parts.push(`Request complexity is high — prioritizing capability over speed.`);
  }

  if (tools.length > 0) {
    parts.push(`Tools enabled: ${tools.join(", ")}.`);
  }

  if (winner.breakdown.cost > 0.8) {
    parts.push(`Cost-efficient choice given your preferences.`);
  }

  return parts.join(" ");
}

function estimateCost(winner: ReturnType<typeof scoreModel>, contextTokens: number): number {
  const model = MODEL_REGISTRY.find(
    (m) => m.provider === winner.provider && m.model === winner.model
  );
  if (!model) return 0;
  const outputEstimate = Math.ceil(contextTokens * 0.3);
  return (
    (contextTokens / 1000) * model.costPer1kInput +
    (outputEstimate / 1000) * model.costPer1kOutput
  );
}

function getModelLatency(modelId: string): number {
  return MODEL_REGISTRY.find((m) => m.model === modelId)?.avgLatencyMs ?? 2000;
}
