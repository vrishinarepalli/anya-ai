import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    pluginSlug: string;
    action: "toggle" | "configure";
    config?: Record<string, string>;
    enabled?: boolean;
  };
  const { pluginSlug, action, config, enabled } = body;

  if (!pluginSlug || !action) {
    return NextResponse.json({ error: "Missing pluginSlug or action" }, { status: 400 });
  }

  if (action === "toggle") {
    const { data: existing } = await supabase
      .from("user_plugins")
      .select("id, is_enabled")
      .eq("user_id", user.id)
      .eq("plugin_slug", pluginSlug)
      .single();

    if (existing) {
      await supabase
        .from("user_plugins")
        .update({ is_enabled: !existing.is_enabled })
        .eq("id", existing.id);
      return NextResponse.json({ enabled: !existing.is_enabled });
    }

    const { error: insertErr } = await supabase.from("user_plugins").insert({
      user_id: user.id,
      plugin_slug: pluginSlug,
      is_enabled: true,
    });
    if (insertErr) console.error("[plugins] insert failed", { pluginSlug, error: insertErr });
    return NextResponse.json({ enabled: true });
  }

  if (action === "configure") {
    const { data: existing } = await supabase
      .from("user_plugins")
      .select("id")
      .eq("user_id", user.id)
      .eq("plugin_slug", pluginSlug)
      .single();

    if (existing) {
      const { error: updateErr } = await supabase
        .from("user_plugins")
        .update({ config: config ?? {}, is_enabled: enabled ?? true })
        .eq("id", existing.id);
      if (updateErr) console.error("[plugins] update failed", { pluginSlug, error: updateErr });
    } else {
      const { error: insertErr } = await supabase.from("user_plugins").insert({
        user_id: user.id,
        plugin_slug: pluginSlug,
        config: config ?? {},
        is_enabled: enabled ?? true,
      });
      if (insertErr) console.error("[plugins] configure-insert failed", { pluginSlug, error: insertErr });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
