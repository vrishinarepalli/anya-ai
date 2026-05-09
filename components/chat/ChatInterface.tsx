"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoutingBadge } from "@/components/routing/RoutingBadge";
import type { RoutingInfo } from "@/types/ui";

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: Array<{ role: string; content: string; routingDecision?: RoutingInfo }>;
}

export function ChatInterface({ conversationId, initialMessages = [] }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [routingByMessageIndex, setRoutingByMessageIndex] = useState<Record<number, RoutingInfo>>({});
  const [messageTimes, setMessageTimes] = useState<Record<number, number>>({});
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingStart = useRef<number | null>(null);

  // Custom fetch to capture routing headers from the response
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
          // Will be associated with next assistant message on finish
          setRoutingByMessageIndex((prev) => ({
            ...prev,
            ["pending"]: routing,
          }));
        } catch {
          // malformed header — ignore
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
      // Associate pending routing info with the latest assistant message
      setRoutingByMessageIndex((prev) => {
        const { pending, ...rest } = prev as Record<string, RoutingInfo>;
        if (!pending) return rest;
        const idx = messages.length; // next index after this assistant message
        const elapsed = pendingStart.current ? Date.now() - pendingStart.current : undefined;
        if (elapsed) {
          setMessageTimes((t) => ({ ...t, [idx]: elapsed }));
        }
        return { ...rest, [idx]: pending };
      });
    },
  });

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
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
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <EmptyState />
        )}

        {messages.map((message, idx) => {
          const textContent = message.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("");

          const routing = routingByMessageIndex[idx];
          const latencyMs = messageTimes[idx];

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-3xl",
                message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-medium mt-0.5">
                {message.role === "user" ? (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                    U
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
                    A
                  </div>
                )}
              </div>

              <div className={cn("flex-1 min-w-0", message.role === "user" ? "items-end" : "")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                    message.role === "user"
                      ? "bg-zinc-800 text-zinc-100 rounded-tr-sm"
                      : "bg-transparent text-zinc-100 rounded-tl-sm"
                  )}
                >
                  {textContent}
                </div>

                {message.role === "assistant" && routing && (
                  <RoutingBadge routing={routing} latencyMs={latencyMs} />
                )}
              </div>
            </div>
          );
        })}

        {isStreaming && messages.at(-1)?.role !== "assistant" && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-medium mt-0.5 shrink-0">
              A
            </div>
            <div className="flex items-center gap-1 px-4 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3 max-w-2xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error.message}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 focus-within:border-zinc-600 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — Anya picks the best model…"
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              disabled={isStreaming}
            />
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        <p className="text-center text-[10px] text-zinc-700 mt-2">
          API costs are billed by your provider · Anya routes to the best model automatically
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
      <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
        <span className="text-xl">⚡</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-300">Start a conversation</p>
        <p className="text-xs text-zinc-600 max-w-xs">
          Anya automatically routes your request to the best model based on your task and preferences.
        </p>
      </div>
    </div>
  );
}
