import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLanguageModel } from "@/lib/providers";
import { readSecret } from "@/lib/vault";
import type { WorkflowNode, WorkflowEdge, WorkflowStep } from "@/types/workflows";
import type { ProviderType } from "@/types/routing";

interface ModelNodeConfig {
  promptTemplate?: string;
  systemPrompt?: string;
  provider?: string;
  model?: string;
}

interface RunnerResult {
  output: string;
  steps: WorkflowStep[];
  costUsd: number;
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "anthropic": return "claude-3-haiku-20240307";
    case "openai": return "gpt-4o-mini";
    case "google": return "gemini-2.0-flash";
    default: return "llama3.2";
  }
}

export async function runWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  inputText: string,
  userId: string,
  supabase: SupabaseClient
): Promise<RunnerResult> {
  // Build adjacency list (outgoing edges per node)
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    const targets = adjacency.get(edge.source) ?? [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
  }

  const triggerNode = nodes.find((n) => n.type === "trigger");
  if (!triggerNode) throw new Error("Workflow must have a Trigger node.");

  const outputNode = nodes.find((n) => n.type === "output");

  // Fetch all active API keys once (avoid per-step DB round trips)
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, provider, base_url, vault_secret_id")
    .eq("user_id", userId)
    .eq("is_active", true);

  const steps: WorkflowStep[] = [];
  const context: Record<string, string> = {};
  let totalCost = 0;

  // BFS from trigger
  const queue: string[] = [triggerNode.id];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const startedAt = new Date().toISOString();

    if (node.type === "trigger") {
      context[nodeId] = inputText;
      steps.push({
        nodeId,
        nodeType: "trigger",
        status: "completed",
        input: inputText,
        output: inputText,
        startedAt,
        completedAt: new Date().toISOString(),
      });
    } else if (node.type === "model") {
      const incomingSource = edges.filter((e) => e.target === nodeId)[0]?.source;
      const predecessorOutput = incomingSource ? (context[incomingSource] ?? inputText) : inputText;

      const cfg = (node.data.config ?? {}) as ModelNodeConfig;
      const promptTemplate = cfg.promptTemplate?.trim() || "{{input}}";
      const prompt = promptTemplate.replace(/\{\{input\}\}/g, predecessorOutput);

      const preferredProvider = cfg.provider && cfg.provider !== "auto" ? cfg.provider : null;
      const keyMeta = preferredProvider
        ? keys?.find((k) => k.provider === preferredProvider) ?? keys?.[0]
        : keys?.[0];

      if (!keyMeta) {
        steps.push({
          nodeId,
          nodeType: "model",
          status: "failed",
          error: "No API key found. Add a key in Settings → API Keys.",
          startedAt,
          completedAt: new Date().toISOString(),
        });
        break;
      }

      try {
        const apiKey = await readSecret(keyMeta.vault_secret_id);
        const modelId = cfg.model?.trim() || getDefaultModel(keyMeta.provider);
        const languageModel = getLanguageModel(
          keyMeta.provider as ProviderType,
          modelId,
          apiKey,
          keyMeta.base_url ?? undefined
        );

        const { text, usage } = await generateText({
          model: languageModel,
          ...(cfg.systemPrompt?.trim() && { system: cfg.systemPrompt.trim() }),
          prompt,
        });

        const stepCost =
          ((usage?.inputTokens ?? 0) / 1000) * 0.003 +
          ((usage?.outputTokens ?? 0) / 1000) * 0.015;
        totalCost += stepCost;
        context[nodeId] = text;
        steps.push({
          nodeId,
          nodeType: "model",
          status: "completed",
          input: prompt,
          output: text,
          startedAt,
          completedAt: new Date().toISOString(),
          costUsd: stepCost,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "LLM call failed";
        console.error("[runner] model node failed", { nodeId, error: err });
        steps.push({
          nodeId,
          nodeType: "model",
          status: "failed",
          error: message,
          startedAt,
          completedAt: new Date().toISOString(),
        });
        break;
      }
    } else if (node.type === "output") {
      const incomingSource = edges.filter((e) => e.target === nodeId)[0]?.source;
      const result = incomingSource ? (context[incomingSource] ?? "") : "";
      context[nodeId] = result;
      steps.push({
        nodeId,
        nodeType: "output",
        status: "completed",
        input: result,
        output: result,
        startedAt,
        completedAt: new Date().toISOString(),
      });
    }

    // Enqueue successors
    for (const target of adjacency.get(nodeId) ?? []) {
      if (!visited.has(target)) queue.push(target);
    }
  }

  const finalOutput = outputNode
    ? (context[outputNode.id] ?? "")
    : (steps.findLast((s) => s.nodeType === "model")?.output as string | undefined) ?? "";

  return { output: String(finalOutput), steps, costUsd: totalCost };
}
