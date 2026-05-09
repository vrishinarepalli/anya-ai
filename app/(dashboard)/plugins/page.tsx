import { createClient } from "@/lib/supabase/server";

export default async function PluginsPage() {
  const supabase = await createClient();
  const { data: plugins } = await supabase
    .from("plugins")
    .select("*")
    .eq("is_system", true)
    .order("name");

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Plugins</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Enable tools that the routing engine can use when handling your requests.
        </p>
      </div>

      <div className="space-y-2">
        {(plugins ?? []).map((plugin) => (
          <div
            key={plugin.slug}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{plugin.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{plugin.description}</p>
              <div className="flex gap-1.5 mt-2">
                {plugin.capabilities.map((cap: string) => (
                  <span
                    key={cap}
                    className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-xs text-zinc-600 shrink-0">v{plugin.version}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
