import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { route } from "@/lib/routing/engine";
import { getLanguageModel } from "@/lib/providers/index";
import { readSecret } from "@/lib/vault";
import { estimateTokens } from "@/lib/utils";
import { buildTools } from "@/lib/plugins/executor";
import { updateConversationSummary } from "@/lib/summarizer";
import type { ProviderType, ProviderConfig, OptimizationPreferences } from "@/types/routing";

export const maxDuration = 60;

// How many recent messages to send verbatim — older ones are covered by the summary
const RECENT_MESSAGE_LIMIT = 10;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { messages, conversationId: existingConversationId } = body as {
    id?: string;
    messages: UIMessage[];
    conversationId?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUserMessage?.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ") ?? "";

  if (!lastUserText) {
    return NextResponse.json({ error: "No user message content" }, { status: 400 });
  }

  // Fetch user data + existing conversation summary in parallel
  const [profileResult, keysResult, pluginsResult, conversationResult] = await Promise.all([
    supabase.from("profiles").select("optimization_preferences, disabled_models").eq("id", user.id).single(),
    supabase.from("api_keys").select("id, provider, base_url").eq("user_id", user.id).eq("is_active", true),
    supabase.from("user_plugins").select("plugin_slug, config").eq("user_id", user.id).eq("is_enabled", true),
    existingConversationId
      ? supabase.from("conversations").select("summary").eq("id", existingConversationId).single()
      : Promise.resolve({ data: null }),
  ]);

  const preferences = (profileResult.data?.optimization_preferences as unknown as OptimizationPreferences) ?? {
    accuracy: 0.7, speed: 0.5, cost: 0.5, creativity: 0.5, reasoning: 0.5, privacy: 0.0,
  };
  const disabledModels = (profileResult.data?.disabled_models ?? []) as string[];
  const currentSummary: string | null = (conversationResult.data as { summary?: string | null } | null)?.summary ?? null;

  const availableProviders: ProviderConfig[] = (keysResult.data ?? []).map((k) => ({
    provider: k.provider as ProviderType,
    keyId: k.id,
    baseUrl: k.base_url ?? undefined,
    models: [],
  }));

  if (process.env.PLATFORM_GROQ_KEY) {
    availableProviders.unshift({ provider: "groq", keyId: "platform", models: [] });
  }

  if (availableProviders.length === 0) {
    return NextResponse.json(
      { error: "No AI providers available. Add an API key in Settings → API Keys." },
      { status: 422 }
    );
  }

  const enabledPluginSlugs = (pluginsResult.data ?? []).map((p) => p.plugin_slug);
  const userPluginConfigs = Object.fromEntries(
    (pluginsResult.data ?? []).map((p) => [p.plugin_slug, (p.config ?? {}) as Record<string, string>])
  );

  const historyForRouter = messages.slice(0, -1).map((m) => ({
    role: m.role,
    content: m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" "),
  }));

  let decision;
  try {
    decision = await route({
      prompt: lastUserText,
      history: historyForRouter,
      preferences,
      availableProviders,
      enabledPluginSlugs,
      estimatedContextTokens: estimateTokens(messages.map((m) => lastUserText).join(" ")),
      disabledModels,
    });
  } catch (err) {
    console.error("[chat] routing failed", { userId: user.id, error: err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Routing failed" },
      { status: 422 }
    );
  }

  // Retrieve the winning provider's API key
  let apiKey: string;
  let baseUrlForModel: string | undefined;

  const winnerProviderEntry = availableProviders.find((p) => p.provider === decision.provider);

  if (winnerProviderEntry?.keyId === "platform") {
    apiKey = process.env.PLATFORM_GROQ_KEY!;
  } else {
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

    try {
      apiKey = await readSecret(fullKey.vault_secret_id);
      baseUrlForModel = fullKey.base_url ?? undefined;
    } catch (err) {
      console.error("[chat] vault read failed", { keyId: winnerKeyMeta.id, error: err });
      return NextResponse.json({ error: "Failed to retrieve API key" }, { status: 500 });
    }
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

  if (conversationId) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: lastUserText,
    });
  }

  const model = getLanguageModel(decision.provider, decision.model, apiKey, baseUrlForModel);
  const start = Date.now();

  const tools = buildTools(enabledPluginSlugs, userPluginConfigs);
  const hasTools = Object.keys(tools).length > 0;

  // Send only the most recent messages — older context lives in the summary
  const recentMessages = messages.slice(-RECENT_MESSAGE_LIMIT);
  const modelMessages = await convertToModelMessages(recentMessages);

  // Build system prompt — inject conversation summary so every model has full context
  const systemPrompt = currentSummary
    ? `You are Anya, an intelligent AI assistant that routes requests to the best model.\n\nConversation context so far:\n${currentSummary}`
    : `You are Anya, an intelligent AI assistant that routes requests to the best model.`;

  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    ...(hasTools && { tools, stopWhen: stepCountIs(5) }),
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

      // Fire-and-forget — update the rolling summary without blocking the response
      updateConversationSummary(
        conversationId,
        lastUserText,
        text,
        currentSummary,
        supabase,
        model
      ).catch((err) => console.error("[chat] summary update failed", err));
    },
  });

  const routingHeader = JSON.stringify({
    model: decision.model,
    provider: decision.provider,
    label: decision.scoreSummary.find((s) => s.model === decision.model)?.label ?? decision.model,
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
