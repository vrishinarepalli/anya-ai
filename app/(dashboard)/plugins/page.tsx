import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PluginCard } from "@/components/plugins/PluginCard";

export default async function PluginsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [pluginsResult, userPluginsResult] = await Promise.all([
    supabase.from("plugins").select("*").eq("is_system", true).order("name"),
    supabase.from("user_plugins").select("plugin_slug, is_enabled, config").eq("user_id", user.id),
  ]);

  const userPluginMap = Object.fromEntries(
    (userPluginsResult.data ?? []).map((up) => [up.plugin_slug, up])
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Plugins</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Enable tools the routing engine can call when handling your requests.
        </p>
      </div>

      <div className="space-y-3">
        {(pluginsResult.data ?? []).map((plugin) => {
          const up = userPluginMap[plugin.slug];
          return (
            <PluginCard
              key={plugin.slug}
              plugin={{
                slug: plugin.slug,
                name: plugin.name,
                description: plugin.description ?? "",
                version: plugin.version,
                capabilities: (plugin.capabilities ?? []) as string[],
                config_schema: (plugin.config_schema ?? {}) as Record<
                  string,
                  { type: "string" | "url" | "secret"; label: string; description: string; required: boolean; placeholder?: string }
                >,
              }}
              userPlugin={
                up
                  ? {
                      is_enabled: up.is_enabled,
                      config: (up.config ?? {}) as Record<string, string>,
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
