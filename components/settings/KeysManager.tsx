"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle, Clock, Loader2, ExternalLink } from "lucide-react";
import { PROVIDER_LABELS, PROVIDER_DOCS, PROVIDER_COST_WARNING } from "@/lib/providers/index";
import type { ProviderType } from "@/types/routing";

interface ApiKey {
  id: string;
  provider: string;
  label: string;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_status: string | null;
  base_url: string | null;
  created_at: string;
}

interface KeysManagerProps {
  initialKeys: ApiKey[];
}

const PROVIDERS: ProviderType[] = ["openai", "anthropic", "google", "ollama"];

export function KeysManager({ initialKeys }: KeysManagerProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [adding, setAdding] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    provider: "openai" as ProviderType,
    label: "",
    apiKey: "",
    baseUrl: "",
  });
  const [error, setError] = useState("");

  async function addKey() {
    setError("");
    if (!form.label || !form.apiKey) {
      setError("Label and API key are required.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.provider,
          label: form.label,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.[0] ?? data.error ?? "Failed to add key");
        return;
      }
      setKeys((prev) => [data.key, ...prev]);
      setForm({ provider: "openai", label: "", apiKey: "", baseUrl: "" });
    } finally {
      setAdding(false);
    }
  }

  async function testKey(id: string) {
    setTesting(id);
    try {
      const res = await fetch(`/api/keys/${id}/test`, { method: "POST" });
      const data = await res.json();
      setKeys((prev) =>
        prev.map((k) =>
          k.id === id
            ? { ...k, last_test_status: data.status, last_tested_at: new Date().toISOString() }
            : k
        )
      );
    } finally {
      setTesting(null);
    }
  }

  async function deleteKey(id: string) {
    setDeleting(id);
    try {
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setKeys((prev) => prev.filter((k) => k.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add new key */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h3 className="text-sm font-medium text-zinc-300">Add Provider</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Provider</label>
            <select
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as ProviderType }))}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Label</label>
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Personal"
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-500">API Key</label>
            <a
              href={PROVIDER_DOCS[form.provider]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
            >
              Get key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder={form.provider === "ollama" ? "Leave blank for local Ollama" : "sk-..."}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {form.provider === "ollama" && (
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Ollama Base URL</label>
            <input
              value={form.baseUrl}
              onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              placeholder="http://localhost:11434"
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        )}

        {PROVIDER_COST_WARNING[form.provider] && (
          <p className="text-xs text-amber-500/80">
            Usage with {PROVIDER_LABELS[form.provider]} is billed to your account by {PROVIDER_LABELS[form.provider]} directly.
          </p>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={addKey}
          disabled={adding}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Key
        </button>
      </div>

      {/* Existing keys */}
      {keys.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-1">
            Connected Providers
          </h3>
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{key.label}</span>
                  <span className="text-xs text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800">
                    {PROVIDER_LABELS[key.provider as ProviderType]}
                  </span>
                </div>
                {key.last_test_status && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusIcon status={key.last_test_status} />
                    <span className="text-xs text-zinc-500">
                      {key.last_test_status === "ok"
                        ? "Connected"
                        : key.last_test_status === "quota_exceeded"
                        ? "Quota exceeded"
                        : "Connection failed"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => testKey(key.id)}
                  disabled={testing === key.id}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {testing === key.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Test"
                  )}
                </button>
                <button
                  onClick={() => deleteKey(key.id)}
                  disabled={deleting === key.id}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {deleting === key.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {keys.length === 0 && (
        <p className="text-sm text-zinc-600 text-center py-4">No providers connected yet.</p>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="w-3 h-3 text-emerald-500" />;
  if (status === "quota_exceeded") return <Clock className="w-3 h-3 text-amber-500" />;
  return <XCircle className="w-3 h-3 text-red-500" />;
}
