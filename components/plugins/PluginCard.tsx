"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ConfigField {
  type: "string" | "url" | "secret";
  label: string;
  description: string;
  required: boolean;
  placeholder?: string;
}

interface PluginCardProps {
  plugin: {
    slug: string;
    name: string;
    description: string;
    version: string;
    capabilities: string[];
    config_schema: Record<string, ConfigField>;
  };
  userPlugin?: {
    is_enabled: boolean;
    config: Record<string, string>;
  };
}

export function PluginCard({ plugin, userPlugin }: PluginCardProps) {
  const [enabled, setEnabled] = useState(userPlugin?.is_enabled ?? false);
  const [config, setConfig] = useState<Record<string, string>>(userPlugin?.config ?? {});
  const [saving, setSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const schemaEntries = Object.entries(plugin.config_schema ?? {});
  const hasConfig = schemaEntries.length > 0;
  const requiredMissing = schemaEntries.some(([k, f]) => f.required && !config[k]);

  async function toggle() {
    if (hasConfig && requiredMissing && !enabled) {
      setShowConfig(true);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/plugins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pluginSlug: plugin.slug, action: "toggle" }),
    });
    const data = await res.json() as { enabled: boolean };
    setEnabled(data.enabled);
    setSaving(false);
  }

  async function saveConfig() {
    setSaving(true);
    await fetch("/api/plugins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pluginSlug: plugin.slug,
        action: "configure",
        config,
        enabled: true,
      }),
    });
    setEnabled(true);
    setSaving(false);
    setShowConfig(false);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">{plugin.name}</p>
            <span className="text-xs text-zinc-600">v{plugin.version}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{plugin.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {plugin.capabilities.map((cap) => (
              <span key={cap} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {cap}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {hasConfig && (
            <button
              onClick={() => setShowConfig((s) => !s)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
            >
              Configure
            </button>
          )}
          <button
            onClick={toggle}
            disabled={saving}
            aria-label={enabled ? "Disable plugin" : "Enable plugin"}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
              enabled ? "bg-violet-600" : "bg-zinc-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                enabled ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {showConfig && hasConfig && (
        <div className="space-y-4 pt-3 border-t border-zinc-800">
          {schemaEntries.map(([key, field]) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                {field.label}
                {field.required && <span className="text-violet-400 ml-0.5">*</span>}
              </label>
              <p className="text-xs text-zinc-500">{field.description}</p>
              <input
                type={field.type === "secret" ? "password" : field.type === "url" ? "url" : "text"}
                value={config[key] ?? ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowConfig(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveConfig}
              disabled={saving || requiredMissing}
              className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save & Enable"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
