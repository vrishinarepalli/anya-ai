import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLanguageModel } from "@/lib/providers";
import { createOpenAI } from "@ai-sdk/openai";

const SUMMARIZER_PROMPT = (current: string | null, userText: string, assistantText: string) => `
You are maintaining a hybrid context log of a conversation between a user and an AI assistant.

Rules:
- PRESERVE VERBATIM: code snippets, file paths, URLs, exact numbers, proper nouns, API keys (redacted), specific decisions made, error messages, and any data the user explicitly stated.
- SUMMARIZE BRIEFLY: general explanations, reasoning, conversational filler, and repeated context.
- Format: write a short prose summary first (2–4 sentences of what was discussed), then a "Key Details" section listing any verbatim-critical facts as bullet points.
- Keep the total under 400 words.
- Never lose specific technical facts, even if it means using more space.

${current ? `Existing context log:\n${current}\n\n` : ""}New exchange to incorporate:
User: ${userText}
Assistant: ${assistantText}

Updated context log:
`.trim();

function getSummarizerModel() {
  if (process.env.PLATFORM_GROQ_KEY) {
    const client = createOpenAI({
      apiKey: process.env.PLATFORM_GROQ_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    return client("llama-3.1-8b-instant");
  }
  return null;
}

export async function updateConversationSummary(
  conversationId: string,
  userText: string,
  assistantText: string,
  currentSummary: string | null,
  supabase: SupabaseClient,
  fallbackModel?: ReturnType<typeof getLanguageModel>
): Promise<void> {
  const model = getSummarizerModel() ?? fallbackModel;
  if (!model) return;

  const prompt = SUMMARIZER_PROMPT(currentSummary, userText, assistantText);

  try {
    const { text } = await generateText({ model, prompt, maxOutputTokens: 500 });
    if (text.trim()) {
      await supabase
        .from("conversations")
        .update({ summary: text.trim() })
        .eq("id", conversationId);
    }
  } catch (err) {
    console.error("[summarizer] failed to update summary", { conversationId, error: err });
  }
}
