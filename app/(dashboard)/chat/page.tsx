import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: recentConversations } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex h-full">
      {/* Conversation history */}
      {(recentConversations?.length ?? 0) > 0 && (
        <div
          className="w-48 shrink-0 flex flex-col"
          style={{ borderRight: "1px solid var(--border)", background: "var(--bg-surface)" }}
        >
          <div
            className="h-[52px] flex items-center justify-between px-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span
              className="text-[10px] tracking-[0.15em] uppercase font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              History
            </span>
            <Link
              href="/chat"
              className="w-5 h-5 flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <Plus className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {recentConversations?.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center px-4 py-2 text-xs truncate transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "var(--bg-lift)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {conv.title ?? "Untitled"}
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
