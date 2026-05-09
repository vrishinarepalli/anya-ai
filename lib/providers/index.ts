import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ProviderType } from "@/types/routing";

interface ProviderKey {
  provider: ProviderType;
  apiKey: string;
  baseUrl?: string;
}

export function getLanguageModel(
  provider: ProviderType,
  model: string,
  apiKey: string,
  baseUrl?: string
) {
  switch (provider) {
    case "openai": {
      const client = createOpenAI({ apiKey, baseURL: baseUrl });
      return client(model);
    }
    case "anthropic": {
      const client = createAnthropic({ apiKey });
      return client(model);
    }
    case "google": {
      const client = createGoogleGenerativeAI({ apiKey });
      return client(model);
    }
    case "ollama": {
      // Ollama is OpenAI-compatible
      const client = createOpenAI({
        apiKey: "ollama",
        baseURL: baseUrl ?? "http://localhost:11434/v1",
      });
      return client(model);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google Gemini",
  ollama: "Ollama (Local)",
};

export const PROVIDER_DOCS: Record<ProviderType, string> = {
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  google: "https://aistudio.google.com/app/apikey",
  ollama: "https://ollama.com",
};

export const PROVIDER_COST_WARNING: Record<ProviderType, boolean> = {
  openai: true,
  anthropic: true,
  google: true,
  ollama: false,
};
