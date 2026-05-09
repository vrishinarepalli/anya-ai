import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storeSecret, deleteSecret } from "@/lib/vault";
import { z } from "zod";

const createKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "ollama"]),
  label: z.string().min(1).max(64),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, provider, label, is_active, last_tested_at, last_test_status, base_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { provider, label, apiKey, baseUrl } = parsed.data;

  try {
    const vaultSecretId = await storeSecret(user.id, provider, apiKey);

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        provider,
        label,
        vault_secret_id: vaultSecretId,
        base_url: baseUrl ?? null,
        is_active: true,
      })
      .select("id, provider, label, is_active, created_at")
      .single();

    if (error) {
      await deleteSecret(vaultSecretId).catch(() => {});
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ key: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to store key" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: keyRow, error: fetchErr } = await supabase
    .from("api_keys")
    .select("vault_secret_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !keyRow) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  await deleteSecret(keyRow.vault_secret_id).catch(() => {});

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
