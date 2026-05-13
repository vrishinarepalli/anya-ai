import type { ModelConfig, ModelScore, OptimizationPreferences } from "@/types/routing";
import type { IntentType } from "@/types/routing";

interface ScoringContext {
  intent: IntentType;
  requiresTools: boolean;
  requiresVision: boolean;
  estimatedContextTokens: number;
  preferences: OptimizationPreferences;
}

export function scoreModel(
  model: ModelConfig,
  ctx: ScoringContext
): ModelScore {
  // Hard disqualifications
  if (ctx.requiresVision && !model.supportsVision) {
    return disqualify(model, "Does not support image input");
  }
  if (ctx.requiresTools && !model.supportsTools) {
    return disqualify(model, "Does not support tool use");
  }
  if (ctx.estimatedContextTokens > model.contextWindow * 0.9) {
    return disqualify(model, `Context too large (${ctx.estimatedContextTokens.toLocaleString()} tokens)`);
  }

  // Task suitability: per-task benchmark score, fallback to generic capability * 0.6
  const taskSuitability = model.strengths[ctx.intent] ?? (model.capabilityScore * 0.6);

  // Accuracy: benchmark-derived capability score (replaces cost-as-proxy heuristic)
  const accuracy = model.capabilityScore;

  // Speed: invert latency, normalize 500ms–5000ms range
  const speedRaw = 1 - Math.min(Math.max(model.avgLatencyMs - 500, 0) / 4500, 1);
  const speed = speedRaw;

  // Cost efficiency: invert cost per token
  const maxOutputCost = 0.02;
  const costEfficiency = 1 - Math.min(model.costPer1kOutput / maxOutputCost, 1);

  // Context fit: reward large context for complex tasks
  const needsLargeContext = ["long_document_analysis", "multi_step_task"].includes(ctx.intent);
  const contextFit = needsLargeContext
    ? Math.min(model.contextWindow / 200000, 1)
    : 0.7;

  // Weighted composite score using user preferences
  const composite =
    accuracy * ctx.preferences.accuracy * 0.25 +
    speed * ctx.preferences.speed * 0.2 +
    costEfficiency * ctx.preferences.cost * 0.2 +
    taskSuitability * 0.25 +
    contextFit * 0.1;

  return {
    provider: model.provider,
    model: model.model,
    label: model.label,
    score: Math.min(composite, 1),
    breakdown: {
      accuracy: parseFloat(accuracy.toFixed(3)),
      speed: parseFloat(speed.toFixed(3)),
      cost: parseFloat(costEfficiency.toFixed(3)),
      contextFit: parseFloat(contextFit.toFixed(3)),
      taskSuitability: parseFloat(taskSuitability.toFixed(3)),
    },
  };
}

function disqualify(model: ModelConfig, reason: string): ModelScore {
  return {
    provider: model.provider,
    model: model.model,
    label: model.label,
    score: 0,
    breakdown: { accuracy: 0, speed: 0, cost: 0, contextFit: 0, taskSuitability: 0 },
    disqualified: reason,
  };
}
