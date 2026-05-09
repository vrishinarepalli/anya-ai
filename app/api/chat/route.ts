import { NextResponse } from "next/server";
import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { route } from "@/lib/routing/engine";
import { getLanguageModel } from "@/lib/providers/index";
import { readSecret } from "@/lib/vault";
import { estimateTokens } from "@/lib/utils";
import type { ProviderType, OptimizationPreferences } from "@/types/routing";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // AI SDK v6: body is { id, messages: UIMessage[], trigger, messageId }
  const body = await req.json();
  const {
    messages,
    conversationId: existingConversationId,
  } = body as {
    id?: string;
    messages: UIMessage[];
    conversationId?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  // Extract last user message text for routing
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUserMessage?.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ") ?? "";

  if (!lastUserText) {
    return NextResponse.json({ error: "No user message content" }, { status: 400 });
  }

  // Fetch user data in parallel
  const [profileResult, keysResult, pluginsResult] = await Promise.all([
    supabase.from("profiles").select("optimization_preferences").eq("id", user.id).single(),
    supabase.from("api_keys").select("id, provider, base_url").eq("user_id", user.id).eq("is_active", true),
    supabase.from("user_plugins").select("plugin_slug").eq("user_id", user.id).eq("is_enabled", true),
  ]);

  const preferences = (profileResult.data?.optimization_preferences as unknown as OptimizationPreferences) ?? {
    accuracy: 0.7, speed: 0.5, cost: 0.5, creativity: 0.5, reasoning: 0.5, privacy: 0.0,
  };

  const availableProviders = (keysResult.data ?? []).map((k) => ({
    provider: k.provider as ProviderType,
    keyId: k.id,
    baseUrl: k.base_url ?? undefined,
    models: [],
  }));

  if (availableProviders.length === 0) {
    return NextResponse.json(
      { error: "No AI providers connected. Add an API key in Settings → API Keys." },
      { status: 422 }
    );
  }

  const enabledPluginSlugs = (pluginsResult.data ?? []).map((p) => p.plugin_slug);

  // Convert UIMessages to plain role/content for routing classifier
  const historyForRouter = messages.slice(0, -1).map((m) => ({
    role: m.role,
    content: m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" "),
  }));

  // Run routing engine
  let decision;
  try {
    decision = await route({
      prompt: lastUserText,
      history: historyForRouter,
      preferences,
      availableProviders,
      enabledPluginSlugs,
      estimatedContextTokens: estimateTokens(messages.map((m) => lastUserText).join(" ")),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Routing failed" },
      { status: 422 }
    );
  }

  // Retrieve the winning provider key from Vault
  const winnerKeyMeta = keysResult.data?.find((k) => k.provider === decision.provider);
  if (!winnerKeyMeta) {
    return NextResponse.json({ error: "Provider key not found" }, { status: 422 });
  }

  const { data: fullKey } = await supabase
    .from("api_keys")
    .select("vault_secret_id, base_url")
    .eq("id", winnerKeyMeta.id)
    .single();

  if (!fullKey) {
    return NextResponse.json({ error: "Key not found" }, { status: 422 });
  }

  let apiKey: string;
  try {
    apiKey = await readSecret(fullKey.vault_secret_id);
  } catch {
    return NextResponse.json({ error: "Failed to retrieve API key" }, { status: 500 });
  }

  // Ensure or create conversation
  let conversationId = existingConversationId;
  if (!conversationId) {
    const title = lastUserText.slice(0, 80).trim();
    const { data: convo } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    conversationId = convo?.id;
  }

  // Save the user message
  if (conversationId) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: lastUserText,
    });
  }

  const model = getLanguageModel(
    decision.provider,
    decision.model,
    apiKey,
    fullKey.base_url ?? undefined
  );

  const start = Date.now();

  // Convert UIMessage[] → ModelMessage[] for the AI provider (async in v6)
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    messages: modelMessages,
    onFinish: async ({ text, usage }) => {
      if (!conversationId) return;
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: text,
        model_used: decision.model,
        provider_used: decision.provider,
        routing_decision: decision as unknown as import("@/types/database").Json,
        tokens_input: usage?.inputTokens ?? null,
        tokens_output: usage?.outputTokens ?? null,
        cost_usd: decision.estimatedCostUsd,
        latency_ms: Date.now() - start,
        plugins_used: decision.tools.length > 0 ? decision.tools : null,
      });
    },
  });

  const routingHeader = JSON.stringify({
    model: decision.model,
    provider: decision.provider,
    label:
      decision.scoreSummary.find((s) => s.model === decision.model)?.label ?? decision.model,
    reasoning: decision.reasoning,
    estimatedCostUsd: decision.estimatedCostUsd,
    estimatedLatencyMs: decision.estimatedLatencyMs,
    intentDetected: decision.intentDetected,
    scoreSummary: decision.scoreSummary,
    tools: decision.tools,
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "X-Routing-Decision": routingHeader,
      "X-Conversation-Id": conversationId ?? "",
    },
  });
}
