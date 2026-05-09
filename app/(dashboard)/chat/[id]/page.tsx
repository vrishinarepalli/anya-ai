import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/chat/ChatInterface";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title, user_id")
    .eq("id", id)
    .single();

  if (!conversation || conversation.user_id !== user.id) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, routing_decision, latency_ms, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 flex items-center px-4 border-b border-zinc-800 shrink-0">
        <h1 className="text-sm font-medium text-zinc-300 truncate">
          {conversation.title ?? "Conversation"}
        </h1>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          conversationId={id}
          initialMessages={(messages ?? []).map((m) => ({
            role: m.role,
            content: m.content,
            routingDecision: m.routing_decision as never,
          }))}
        />
      </div>
    </div>
  );
}
