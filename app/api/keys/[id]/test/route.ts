import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSecret } from "@/lib/vault";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: keyRow, error: fetchErr } = await supabase
    .from("api_keys")
    .select("vault_secret_id, provider, base_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !keyRow) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  let status: "ok" | "error" | "quota_exceeded" = "error";
  let detail = "";

  try {
    const apiKey = await readSecret(keyRow.vault_secret_id);
    const result = await testProviderKey(keyRow.provider, apiKey, keyRow.base_url);
    status = result.status;
    detail = result.detail;
  } catch (err) {
    detail = err instanceof Error ? err.message : "Unknown error";
  }

  await supabase
    .from("api_keys")
    .update({ last_tested_at: new Date().toISOString(), last_test_status: status })
    .eq("id", id);

  return NextResponse.json({ status, detail });
}

async function testProviderKey(
  provider: string,
  apiKey: string,
  baseUrl: string | null
): Promise<{ status: "ok" | "error" | "quota_exceeded"; detail: string }> {
  try {
    switch (provider) {
      case "openai": {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.status === 429) return { status: "quota_exceeded", detail: "Rate limit or quota exceeded" };
        if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };
        return { status: "ok", detail: "Connection successful" };
      }
      case "anthropic": {
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        });
        if (res.status === 429) return { status: "quota_exceeded", detail: "Rate limit exceeded" };
        if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };
        return { status: "ok", detail: "Connection successful" };
      }
      case "google": {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };
        return { status: "ok", detail: "Connection successful" };
      }
      case "ollama": {
        const base = baseUrl ?? "http://localhost:11434";
        const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return { status: "error", detail: `Cannot reach Ollama at ${base}` };
        return { status: "ok", detail: `Ollama reachable at ${base}` };
      }
      default:
        return { status: "error", detail: `Unknown provider: ${provider}` };
    }
  } catch {
    return { status: "error", detail: "Connection failed — check key and network" };
  }
}
