"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Square, AlertCircle, ScrollText } from "lucide-react";
import { RoutingBadge } from "@/components/routing/RoutingBadge";
import { ContextPanel } from "@/components/chat/ContextPanel";
import type { RoutingInfo } from "@/types/ui";

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: Array<{ role: string; content: string; routingDecision?: RoutingInfo }>;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [routingByMessageIndex, setRoutingByMessageIndex] = useState<Record<number, RoutingInfo>>({});
  const [messageTimes, setMessageTimes] = useState<Record<number, number>>({});
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const [contextOpen, setContextOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingStart = useRef<number | null>(null);

  const customFetch = useCallback(
    async (url: RequestInfo | URL, options?: RequestInit) => {
      pendingStart.current = Date.now();
      const response = await globalThis.fetch(url, options);

      const routingHeader = response.headers.get("X-Routing-Decision");
      const convId = response.headers.get("X-Conversation-Id");

      if (convId && !activeConversationId) {
        setActiveConversationId(convId);
        window.history.replaceState(null, "", `/chat/${convId}`);
      }

      if (routingHeader) {
        try {
          const routing: RoutingInfo = JSON.parse(routingHeader);
          setRoutingByMessageIndex((prev) => ({ ...prev, ["pending"]: routing }));
        } catch {
          // malformed header
        }
      }

      return response;
    },
    [activeConversationId]
  );

  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      fetch: customFetch,
      body: activeConversationId ? { conversationId: activeConversationId } : undefined,
    })
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: transport.current,
    onFinish: () => {
      setRoutingByMessageIndex((prev) => {
        const { pending, ...rest } = prev as Record<string, RoutingInfo>;
        if (!pending) return rest;
        const idx = messages.length;
        const elapsed = pendingStart.current ? Date.now() - pendingStart.current : undefined;
        if (elapsed) setMessageTimes((t) => ({ ...t, [idx]: elapsed }));
        return { ...rest, [idx]: pending };
      });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    setInput("");
    sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full" style={{ background: "var(--bg-void)" }}>
      {/* Main chat column */}
      <div className="flex flex-col flex-1 min-w-0">
      {/* Topbar — context button appears once a conversation exists */}
      {activeConversationId && (
        <div
          className="h-[52px] shrink-0 flex items-center justify-end px-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setContextOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium transition-all"
            style={{
              color: contextOpen ? "var(--accent)" : "var(--text-muted)",
              background: contextOpen ? "var(--accent-dim)" : "transparent",
              border: `1px solid ${contextOpen ? "rgba(232,160,32,0.3)" : "var(--border)"}`,
            }}
            onMouseEnter={(e) => { if (!contextOpen) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            onMouseLeave={(e) => { if (!contextOpen) e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <ScrollText className="w-3 h-3" />
            Context Log
          </button>
        </div>
      )}
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-0">
            {messages.map((message, idx) => {
              const textContent = message.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("");

              const routing = routingByMessageIndex[idx];
              const latencyMs = messageTimes[idx];
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  style={{
                    borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                    paddingTop: idx > 0 ? "1.5rem" : 0,
                    paddingBottom: "1.5rem",
                  }}
                >
                  {/* Role label */}
                  <div
                    className="text-[10px] tracking-[0.15em] uppercase font-medium mb-2.5"
                    style={{ color: isUser ? "var(--text-muted)" : "var(--accent)" }}
                  >
                    {isUser ? "You" : "Anya"}
                  </div>

                  {/* Message text */}
                  <p
                    className="leading-7 whitespace-pre-wrap break-words"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13.5px",
                      color: isUser ? "var(--text-secondary)" : "var(--text-primary)",
                      fontWeight: isUser ? 300 : 400,
                    }}
                  >
                    {textContent}
                  </p>

                  {!isUser && routing && (
                    <div className="mt-2">
                      <RoutingBadge routing={routing} latencyMs={latencyMs} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming indicator */}
            {isStreaming && messages.at(-1)?.role !== "assistant" && (
              <div style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
                <div
                  className="text-[10px] tracking-[0.15em] uppercase font-medium mb-2.5"
                  style={{ color: "var(--accent)" }}
                >
                  Anya
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1 h-1 rounded-full animate-bounce"
                      style={{
                        background: "var(--text-muted)",
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div
                className="flex items-start gap-2.5 text-xs p-3 mt-4"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "#f87171",
                }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 px-6 py-4"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg-void)" }}
      >
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto"
        >
          <div
            className="flex items-end gap-3"
            style={{
              borderBottom: "1px solid var(--border-strong)",
              paddingBottom: "12px",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm focus:outline-none placeholder-[--text-dim]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13.5px",
                color: "var(--text-primary)",
                lineHeight: "1.6",
              }}
              disabled={isStreaming}
            />

            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                className="shrink-0 w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ background: "var(--text-muted)", color: "var(--bg-void)" }}
              >
                <Square className="w-3 h-3" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="shrink-0 w-7 h-7 flex items-center justify-center transition-all"
                style={{
                  background: input.trim() ? "var(--accent)" : "var(--bg-lift)",
                  color: input.trim() ? "var(--bg-void)" : "var(--text-dim)",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                }}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p
            className="text-center mt-3 text-[10px] tracking-[0.06em] uppercase"
            style={{ color: "var(--text-dim)" }}
          >
            Anya routes each request to the optimal model automatically
          </p>
        </form>
      </div>
      </div>{/* end main chat column */}

      {/* Context panel — slides in from right */}
      {contextOpen && activeConversationId && (
        <ContextPanel
          conversationId={activeConversationId}
          onClose={() => setContextOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 px-6 text-center">
      <div
        className="text-[10px] tracking-[0.25em] uppercase font-medium mb-6"
        style={{ color: "var(--accent)" }}
      >
        Meridian · AI Orchestration
      </div>
      <h2
        className="text-2xl font-semibold tracking-tight mb-3"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}
      >
        What do you need today?
      </h2>
      <p
        className="text-sm max-w-sm leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        Llama, Mixtral, and more — free by default. Add your own API keys to unlock GPT-4, Claude, and Gemini.
      </p>
    </div>
  );
}
