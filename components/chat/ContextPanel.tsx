"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, RefreshCw } from "lucide-react";

interface ContextPanelProps {
  conversationId: string;
  onClose: () => void;
}

export function ContextPanel({ conversationId, onClose }: ContextPanelProps) {
  const [summary, setSummary] = useState("");
  const [original, setOriginal] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/conversations/${conversationId}/context`)
      .then((r) => r.json())
      .then((data: { summary: string; title: string }) => {
        setSummary(data.summary ?? "");
        setOriginal(data.summary ?? "");
        setTitle(data.title ?? "Untitled");
      })
      .catch(() => setError("Failed to load context."))
      .finally(() => setLoading(false));
  }, [conversationId]);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/context`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });
      if (!res.ok) throw new Error("Save failed");
      setOriginal(summary);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = summary !== original;

  return (
    <div
      className="w-80 shrink-0 flex flex-col h-full"
      style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-surface)" }}
    >
      {/* Header */}
      <div
        className="h-[52px] flex items-center justify-between px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <div
            className="text-[9px] tracking-[0.2em] uppercase font-medium"
            style={{ color: "var(--accent)" }}
          >
            Context Log
          </div>
          <div
            className="text-xs font-medium truncate max-w-[180px]"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center transition-opacity hover:opacity-60"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-3">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : (
          <>
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              This is the running context log Anya passes to every model in this conversation. Edit it to correct facts, remove noise, or pin important details.
            </p>

            {summary === "" && !isDirty && (
              <div
                className="text-[10px] px-3 py-2.5 leading-relaxed"
                style={{ border: "1px dashed var(--border-strong)", color: "var(--text-muted)" }}
              >
                No context yet — Anya will build this automatically after the first exchange.
              </div>
            )}

            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="flex-1 resize-none text-xs leading-relaxed focus:outline-none bg-transparent w-full"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
                minHeight: "300px",
                caretColor: "var(--accent)",
              }}
              placeholder="Context will appear here after your first message…"
              spellCheck={false}
            />

            {error && (
              <p className="text-[10px]" style={{ color: "#f87171" }}>{error}</p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between gap-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          onClick={() => setSummary(original)}
          disabled={!isDirty || saving}
          className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase transition-opacity disabled:opacity-30 hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <RefreshCw className="w-3 h-3" />
          Reset
        </button>

        <button
          onClick={save}
          disabled={!isDirty || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.08em] uppercase font-medium transition-opacity disabled:opacity-30 hover:opacity-80"
          style={{
            background: saved ? "rgba(74,222,128,0.15)" : "var(--accent)",
            color: saved ? "#4ade80" : "var(--bg-void)",
          }}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
