import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { modelId, enabled } = await req.json() as { modelId: string; enabled: boolean };
  if (!modelId) return NextResponse.json({ error: "modelId required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("disabled_models")
    .eq("id", user.id)
    .single();

  const current: string[] = (profile?.disabled_models ?? []) as string[];
  const updated = enabled
    ? current.filter((m) => m !== modelId)
    : [...new Set([...current, modelId])];

  const { error } = await supabase
    .from("profiles")
    .update({ disabled_models: updated })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, disabled_models: updated });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("disabled_models")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ disabled_models: profile?.disabled_models ?? [] });
}
