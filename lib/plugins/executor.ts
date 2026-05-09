import { tool } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";

export function buildTools(
  enabledSlugs: string[],
  userConfigs: Record<string, Record<string, string>>
): ToolSet {
  const tools: ToolSet = {};

  if (enabledSlugs.includes("web-search")) {
    const apiKey = userConfigs["web-search"]?.tavily_api_key;
    if (apiKey) {
      tools.web_search = tool({
        description:
          "Search the web for current, up-to-date information. Use when asked about recent events, live data, or facts you may not know.",
        inputSchema: z.object({
          query: z.string().describe("The search query"),
        }),
        execute: async ({ query }) => {
          const resp = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: apiKey,
              query,
              max_results: 5,
              search_depth: "basic",
            }),
          });
          if (!resp.ok) return { error: "Search failed", status: resp.status };
          const data = await resp.json() as {
            results?: Array<{ title: string; url: string; content: string }>;
          };
          return {
            results: (data.results ?? []).map((r) => ({
              title: r.title,
              url: r.url,
              snippet: r.content?.slice(0, 500),
            })),
          };
        },
      });
    }
  }

  if (enabledSlugs.includes("url-reader")) {
    tools.url_reader = tool({
      description:
        "Fetch and extract the text content of a public URL. Use when the user shares a link and wants you to read it.",
      inputSchema: z.object({
        url: z.string().url().describe("The URL to fetch"),
      }),
      execute: async ({ url }) => {
        try {
          const resp = await fetch(url, {
            headers: { "User-Agent": "Anya/1.0" },
            signal: AbortSignal.timeout(10_000),
          });
          if (!resp.ok) return { error: `HTTP ${resp.status}` };
          const html = await resp.text();
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 6000);
          return { text, url };
        } catch (err) {
          return { error: err instanceof Error ? err.message : "Failed to fetch URL" };
        }
      },
    });
  }

  if (enabledSlugs.includes("calculator")) {
    tools.calculator = tool({
      description:
        "Evaluate a mathematical expression. Supports +, -, *, /, ** (exponentiation), parentheses, and % (modulo). Do not pass variables or function names.",
      inputSchema: z.object({
        expression: z.string().describe("A numeric expression, e.g. '(12 * 3.5) / 2 + 100'"),
      }),
      execute: async ({ expression }) => {
        if (!/^[\d\s+\-*/().^%]+$/.test(expression)) {
          return { error: "Invalid expression — only numeric operators allowed" };
        }
        try {
          const sanitized = expression.replace(/\^/g, "**");
          // eslint-disable-next-line no-new-func
          const result = Function('"use strict"; return (' + sanitized + ")")() as number;
          if (!isFinite(result)) return { error: "Result is not finite" };
          return { result: String(result), expression };
        } catch {
          return { error: "Could not evaluate expression" };
        }
      },
    });
  }

  return tools;
}
