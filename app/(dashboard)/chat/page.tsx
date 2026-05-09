import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if user has any connected providers
  const { count } = await supabase
    .from("api_keys")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      {count === 0 ? (
        <div className="max-w-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto">
            <span className="text-2xl">🔑</span>
          </div>
          <h2 className="text-lg font-medium text-white">Connect your first AI provider</h2>
          <p className="text-sm text-zinc-400">
            Nexus routes your requests to the best model automatically. Add an API key to get started.
          </p>
          <a
            href="/settings/keys"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Add API Key
          </a>
          <p className="text-xs text-zinc-600">
            API usage costs are billed directly by your provider based on your own keys.
          </p>
        </div>
      ) : (
        <div className="max-w-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚡</span>
          </div>
          <h2 className="text-lg font-medium text-white">Start a conversation</h2>
          <p className="text-sm text-zinc-400">
            Nexus will automatically choose the best model for your request.
          </p>
          <a
            href="/chat/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            New Chat
          </a>
        </div>
      )}
    </div>
  );
}
