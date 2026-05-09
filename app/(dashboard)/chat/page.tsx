import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ count: keyCount }, { data: recentConversations }] = await Promise.all([
    supabase
      .from("api_keys")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  if ((keyCount ?? 0) === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <div className="max-w-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto text-2xl">
            🔑
          </div>
          <h2 className="text-lg font-medium text-white">Connect your first AI provider</h2>
          <p className="text-sm text-zinc-400">
            Anya routes your requests to the best model automatically. Add an API key to get started.
          </p>
          <a
            href="/settings/keys"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Add API Key
          </a>
          <p className="text-xs text-zinc-600">
            API usage is billed directly by your provider based on your own account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {(recentConversations?.length ?? 0) > 0 && (
        <div className="w-52 shrink-0 border-r border-zinc-800 flex flex-col">
          <div className="h-14 flex items-center justify-between px-3 border-b border-zinc-800">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">History</span>
            <Link
              href="/chat"
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {recentConversations?.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-900 transition-colors group"
              >
                <MessageSquare className="w-3 h-3 shrink-0 text-zinc-600 group-hover:text-zinc-400" />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 truncate">
                  {conv.title ?? "Untitled"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
