"use client";

import { useState } from "react";
import Link from "next/link";
import { MODEL_REGISTRY } from "@/lib/routing/models";
import { PROVIDER_LABELS } from "@/lib/providers/index";
import type { ProviderType } from "@/types/routing";

interface ModelsManagerProps {
  initialDisabled: string[];
  connectedProviders: string[];
}

const PROVIDER_ORDER: ProviderType[] = ["groq", "openai", "anthropic", "google", "ollama"];

function speedTier(ms: number) {
  if (ms <= 800)  return { label: "Fast",   color: "#4ade80" };
  if (ms <= 2000) return { label: "Medium", color: "var(--accent)" };
  return                  { label: "Slow",   color: "#666" };
}

function fmtContext(tokens: number) {
  if (tokens >= 1_000_000) return `${tokens / 1_000_000}M ctx`;
  return `${tokens / 1_000}k ctx`;
}

const STRENGTH_LABELS: Record<string, string> = {
  simple_qa:              "Q&A",
  code_generation:        "Code",
  code_review:            "Review",
  creative_writing:       "Creative",
  data_analysis:          "Data",
  web_research:           "Search",
  math_reasoning:         "Math",
  long_document_analysis: "Docs",
  image_understanding:    "Vision",
  multi_step_task:        "Agents",
};

export function ModelsManager({ initialDisabled, connectedProviders }: ModelsManagerProps) {
  const connected = new Set(connectedProviders);

  // Only models whose provider is connected count as "available"
  const availableModelIds = new Set(
    MODEL_REGISTRY.filter((m) => connected.has(m.provider)).map((m) => m.model)
  );

  // Seed disabled: unconnected models are implicitly off (not stored, just not shown as on)
  const [disabled, setDisabled] = useState<Set<string>>(new Set(initialDisabled));
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [lastModelError, setLastModelError] = useState(false);

  // Count of currently enabled available models
  const enabledCount = [...availableModelIds].filter((id) => !disabled.has(id)).length;

  async function toggle(modelId: string) {
    if (pending.has(modelId)) return;
    const willEnable = disabled.has(modelId);

    // Prevent disabling the last active model
    if (!willEnable && enabledCount <= 1) {
      setLastModelError(true);
      setTimeout(() => setLastModelError(false), 2500);
      return;
    }
    setLastModelError(false);

    setPending((p) => new Set([...p, modelId]));
    setDisabled((d) => {
      const next = new Set(d);
      willEnable ? next.delete(modelId) : next.add(modelId);
      return next;
    });

    try {
      await fetch("/api/settings/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, enabled: willEnable }),
      });
    } catch {
      setDisabled((d) => {
        const next = new Set(d);
        willEnable ? next.add(modelId) : next.delete(modelId);
        return next;
      });
    } finally {
      setPending((p) => { const next = new Set(p); next.delete(modelId); return next; });
    }
  }

  const grouped = PROVIDER_ORDER.reduce<Record<string, typeof MODEL_REGISTRY>>((acc, provider) => {
    const models = MODEL_REGISTRY.filter((m) => m.provider === provider);
    if (models.length) acc[provider] = models;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Last model warning */}
      {lastModelError && (
        <div
          className="px-4 py-3 text-xs"
          style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.06)" }}
        >
          At least one model must remain active.
        </div>
      )}

      {Object.entries(grouped).map(([provider, models]) => {
        const isConnected = connected.has(provider);
        const isFree = provider === "groq";
        const providerLabel = PROVIDER_LABELS[provider as ProviderType] ?? provider;

        // Don't show providers with no connection and no platform key (except as a "add key" section)
        // Always show free (groq) and connected providers
        const shouldShow = isFree || isConnected;

        return (
          <div key={provider}>
            {/* Group header */}
            <div
              className="flex items-center gap-3 pb-3 mb-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                className="text-[10px] tracking-[0.15em] uppercase font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {providerLabel}
              </span>

              {isFree && (
                <span
                  className="text-[9px] tracking-[0.1em] uppercase px-1.5 py-px font-medium"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(232,160,32,0.2)" }}
                >
                  Free · Platform
                </span>
              )}

              {!isFree && isConnected && (
                <span
                  className="text-[9px] tracking-[0.1em] uppercase px-1.5 py-px font-medium"
                  style={{ background: "rgba(74,222,128,0.08)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
                >
                  Connected
                </span>
              )}

              {shouldShow && (
                <span className="ml-auto text-[10px]" style={{ color: "var(--text-dim)" }}>
                  {models.filter((m) => !disabled.has(m.model)).length}/{models.length} active
                </span>
              )}
            </div>

            {shouldShow ? (
              /* Models the user can actually use */
              <div className="space-y-2">
                {models.map((model) => {
                  const isDisabled = disabled.has(model.model);
                  const isPending = pending.has(model.model);
                  const isLastEnabled = !isDisabled && enabledCount <= 1;
                  const speed = speedTier(model.avgLatencyMs);

                  return (
                    <div
                      key={model.model}
                      className="flex items-center gap-4 px-4 py-3 transition-all duration-150"
                      style={{
                        background: isDisabled ? "transparent" : "var(--bg-surface)",
                        border: `1px solid ${isDisabled ? "var(--border)" : "var(--border-strong)"}`,
                        opacity: isDisabled ? 0.45 : 1,
                      }}
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {model.label}
                          </span>
                          {model.isPlatformDefault && (
                            <span className="text-[9px] tracking-wider uppercase px-1.5 py-px" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                              Free
                            </span>
                          )}
                          {!isFree && (
                            <span className="text-[9px] tracking-wider uppercase px-1.5 py-px" style={{ background: "var(--bg-hover)", color: "var(--text-dim)" }}>
                              Your key
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{fmtContext(model.contextWindow)}</span>
                          <span className="text-[10px]" style={{ color: speed.color }}>{speed.label}</span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {model.costPer1kOutput === 0 ? "Free" : `$${model.costPer1kOutput.toFixed(4)}/1k`}
                          </span>
                          {model.supportsTools && <span className="text-[9px] px-1 py-px tracking-wider uppercase" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>Tools</span>}
                          {model.supportsVision && <span className="text-[9px] px-1 py-px tracking-wider uppercase" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>Vision</span>}
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          {Object.entries(model.strengths)
                            .filter(([, v]) => v >= 0.75)
                            .sort(([, a], [, b]) => b - a)
                            .map(([s]) => (
                            <span key={s} className="text-[9px] px-1.5 py-px" style={{ background: "var(--bg-lift)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                              {STRENGTH_LABELS[s] ?? s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => toggle(model.model)}
                        disabled={isPending || isLastEnabled}
                        title={isLastEnabled ? "Can't disable the last active model" : undefined}
                        className="shrink-0 relative w-10 h-5 transition-all duration-200 disabled:cursor-not-allowed"
                        style={{
                          background: isDisabled ? "var(--bg-hover)" : "var(--accent)",
                          border: `1px solid ${isDisabled ? "var(--border-strong)" : "var(--accent)"}`,
                          opacity: isLastEnabled ? 0.4 : 1,
                        }}
                        aria-label={isDisabled ? "Enable model" : "Disable model"}
                      >
                        <span
                          className="absolute top-0.5 w-3.5 h-3.5 transition-all duration-200"
                          style={{
                            background: isDisabled ? "var(--text-muted)" : "var(--bg-void)",
                            left: isDisabled ? "2px" : "calc(100% - 18px)",
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Provider not connected — show add key prompt, no models listed */
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ border: "1px dashed var(--border-strong)" }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {models.length} model{models.length !== 1 ? "s" : ""} available
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Add your {providerLabel} API key to unlock. Usage billed by {providerLabel} directly — not by Anya.
                  </p>
                </div>
                <Link
                  href="/settings/keys"
                  className="shrink-0 text-xs px-3 py-1.5 font-medium tracking-wide transition-opacity hover:opacity-80 ml-4"
                  style={{ background: "var(--bg-lift)", color: "var(--text-secondary)", border: "1px solid var(--border-strong)" }}
                >
                  Connect →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
