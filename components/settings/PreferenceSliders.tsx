"use client";

import { useState, useCallback, useRef } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import type { OptimizationPreferences } from "@/types/routing";

// ─── Budget constants ────────────────────────────────────────────────────────
const TOTAL_PTS = 100;
const SLIDER_MIN = 5;
const SLIDER_MAX = 60;

type PrefKey = "accuracy" | "speed" | "cost" | "creativity" | "reasoning";

type PointPrefs = Record<PrefKey, number>;

// Converts stored 0-1 values → integer point allocations summing to TOTAL_PTS
function fromStored(stored: OptimizationPreferences): PointPrefs {
  const keys: PrefKey[] = ["accuracy", "speed", "cost", "creativity", "reasoning"];
  const raw: PointPrefs = {
    accuracy: Math.round(stored.accuracy * 60),
    speed: Math.round(stored.speed * 60),
    cost: Math.round(stored.cost * 60),
    creativity: Math.round(stored.creativity * 60),
    reasoning: Math.round(stored.reasoning * 60),
  };
  // Clamp to slider range, then normalize to TOTAL_PTS
  for (const k of keys) raw[k] = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, raw[k]));
  const total = keys.reduce((s, k) => s + raw[k], 0);
  const scale = TOTAL_PTS / total;
  for (const k of keys) raw[k] = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, Math.round(raw[k] * scale)));
  // Fix rounding residual
  const diff = TOTAL_PTS - keys.reduce((s, k) => s + raw[k], 0);
  if (diff !== 0) raw.accuracy = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, raw.accuracy + diff));
  return raw;
}

// Converts point allocations → 0-1 values for storage/scoring
function toStored(pts: PointPrefs): Omit<OptimizationPreferences, "privacy"> {
  return {
    accuracy: parseFloat((pts.accuracy / 60).toFixed(3)),
    speed: parseFloat((pts.speed / 60).toFixed(3)),
    cost: parseFloat((pts.cost / 60).toFixed(3)),
    creativity: parseFloat((pts.creativity / 60).toFixed(3)),
    reasoning: parseFloat((pts.reasoning / 60).toFixed(3)),
  };
}

// Redistribute budget when one slider changes
function redistribute(current: PointPrefs, changedKey: PrefKey, newValue: number): PointPrefs {
  const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, newValue));
  const delta = clamped - current[changedKey];
  if (delta === 0) return current;

  const keys: PrefKey[] = ["accuracy", "speed", "cost", "creativity", "reasoning"];
  const others = keys.filter((k) => k !== changedKey);
  const result: PointPrefs = { ...current, [changedKey]: clamped };

  if (delta > 0) {
    // Taking points — drain from highest first, respecting SLIDER_MIN
    let debt = delta;
    const sorted = [...others].sort((a, b) => result[b] - result[a]);
    for (const k of sorted) {
      if (debt <= 0) break;
      const canGive = result[k] - SLIDER_MIN;
      const take = Math.min(canGive, debt);
      result[k] -= take;
      debt -= take;
    }
    // If still in debt (all at min), clamp the changed slider back
    if (debt > 0) result[changedKey] -= debt;
  } else {
    // Giving points — fill lowest first, respecting SLIDER_MAX
    let surplus = -delta;
    const sorted = [...others].sort((a, b) => result[a] - result[b]);
    for (const k of sorted) {
      if (surplus <= 0) break;
      const canTake = SLIDER_MAX - result[k];
      const add = Math.min(canTake, surplus);
      result[k] += add;
      surplus -= add;
    }
    if (surplus > 0) result[changedKey] += surplus;
  }

  return result;
}

// ─── Slider metadata ─────────────────────────────────────────────────────────
const SLIDERS: Array<{
  key: PrefKey;
  label: string;
  subLabel: string;
  group: "power" | "efficiency" | "creative";
  lowLabel: string;
  highLabel: string;
}> = [
  {
    key: "accuracy",
    label: "Quality",
    subLabel: "Prefer top-tier models",
    group: "power",
    lowLabel: "Good enough",
    highLabel: "Best possible",
  },
  {
    key: "reasoning",
    label: "Reasoning",
    subLabel: "Deep problem solving",
    group: "power",
    lowLabel: "Standard",
    highLabel: "Max depth",
  },
  {
    key: "speed",
    label: "Speed",
    subLabel: "Response latency",
    group: "efficiency",
    lowLabel: "No preference",
    highLabel: "Fastest",
  },
  {
    key: "cost",
    label: "Cost",
    subLabel: "Minimize API spend",
    group: "efficiency",
    lowLabel: "Spend freely",
    highLabel: "Free only",
  },
  {
    key: "creativity",
    label: "Creativity",
    subLabel: "Open-ended generation",
    group: "creative",
    lowLabel: "Factual",
    highLabel: "Expressive",
  },
];

const GROUP_META: Record<string, { label: string; color: string; hint: string }> = {
  power: {
    label: "Power",
    color: "var(--accent)",
    hint: "High-capability models — thorough but slower and pricier",
  },
  efficiency: {
    label: "Efficiency",
    color: "#4ade80",
    hint: "Fast and cheap — good for quick answers and simple tasks",
  },
  creative: {
    label: "Creative",
    color: "#a78bfa",
    hint: "Models tuned for expressive, generative output",
  },
};

interface PreferenceSlidersProps {
  initial: OptimizationPreferences;
}

export function PreferenceSliders({ initial }: PreferenceSlidersProps) {
  const [pts, setPts] = useState<PointPrefs>(() => fromStored(initial));
  const [privacy, setPrivacy] = useState(initial.privacy > 0.5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draggingKey = useRef<PrefKey | null>(null);

  const handleChange = useCallback((key: PrefKey, rawValue: number) => {
    setPts((prev) => redistribute(prev, key, rawValue));
    setSaved(false);
  }, []);

  const powerTotal = pts.accuracy + pts.reasoning;
  const effTotal = pts.speed + pts.cost;

  async function save() {
    setSaving(true);
    try {
      const payload: OptimizationPreferences = {
        ...toStored(pts),
        privacy: privacy ? 0.8 : 0.0,
      };
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Budget meter */}
      <div
        className="px-4 py-3"
        style={{ border: "1px solid var(--border-strong)", background: "var(--bg-surface)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] tracking-[0.15em] uppercase font-medium" style={{ color: "var(--text-muted)" }}>
            Budget allocation
          </span>
          <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            {TOTAL_PTS} / {TOTAL_PTS} pts
          </span>
        </div>
        {/* Stacked bar */}
        <div className="h-2 flex overflow-hidden" style={{ background: "var(--bg-lift)" }}>
          {SLIDERS.map((s) => {
            const color = GROUP_META[s.group].color;
            const pct = (pts[s.key] / TOTAL_PTS) * 100;
            return (
              <div
                key={s.key}
                style={{ width: `${pct}%`, background: color, opacity: 0.7, transition: "width 120ms" }}
              />
            );
          })}
        </div>
        <div className="flex gap-4 mt-2">
          {Object.entries(GROUP_META).map(([g, meta]) => (
            <div key={g} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{meta.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sliders grouped */}
      {(["power", "efficiency", "creative"] as const).map((group) => {
        const sliders = SLIDERS.filter((s) => s.group === group);
        const meta = GROUP_META[group];
        const groupTotal = sliders.reduce((s, sl) => s + pts[sl.key], 0);

        return (
          <div key={group} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
              <span className="text-[10px] tracking-[0.15em] uppercase font-medium" style={{ color: "var(--text-muted)" }}>
                {meta.label}
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                {groupTotal} pts
              </span>
              <span className="text-[10px] ml-auto max-w-[200px] text-right" style={{ color: "var(--text-dim)" }}>
                {meta.hint}
              </span>
            </div>

            <div className="space-y-4">
              {sliders.map(({ key, label, subLabel, lowLabel, highLabel }) => {
                const val = pts[key];
                const pct = ((val - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {label}
                        </span>
                        <span className="text-[10px] ml-2" style={{ color: "var(--text-muted)" }}>
                          {subLabel}
                        </span>
                      </div>
                      <span
                        className="text-sm font-medium w-10 text-right"
                        style={{ fontFamily: "var(--font-mono)", color: meta.color }}
                      >
                        {val}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="range"
                        min={SLIDER_MIN}
                        max={SLIDER_MAX}
                        step={1}
                        value={val}
                        onChange={(e) => handleChange(key, parseInt(e.target.value, 10))}
                        className="w-full h-0.5 appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, ${meta.color} ${pct}%, var(--bg-hover) ${pct}%)`,
                          accentColor: meta.color,
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] tracking-wider uppercase" style={{ color: "var(--text-dim)" }}>
                          {lowLabel}
                        </span>
                        <span className="text-[9px] tracking-wider uppercase" style={{ color: "var(--text-dim)" }}>
                          {highLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Power vs Efficiency insight */}
      {powerTotal > 60 && (
        <div className="px-3 py-2.5 text-[10px] leading-relaxed" style={{ border: "1px solid rgba(232,160,32,0.2)", color: "var(--accent)", background: "var(--accent-dim)" }}>
          Power mode — Anya will route to high-capability models. Expect higher cost and slower responses.
        </div>
      )}
      {effTotal > 60 && (
        <div className="px-3 py-2.5 text-[10px] leading-relaxed" style={{ border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", background: "rgba(74,222,128,0.05)" }}>
          Efficiency mode — Anya will prioritize fast, free models. May sacrifice thoroughness.
        </div>
      )}

      {/* Privacy toggle */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ border: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Prefer local models
            </span>
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
            Routes to Ollama (on-device) first. Keeps prompts off cloud servers.
          </p>
        </div>
        <button
          onClick={() => { setPrivacy((p) => !p); setSaved(false); }}
          className="shrink-0 relative w-10 h-5 transition-all duration-200"
          style={{
            background: privacy ? "var(--accent)" : "var(--bg-hover)",
            border: `1px solid ${privacy ? "var(--accent)" : "var(--border-strong)"}`,
          }}
          aria-label={privacy ? "Disable privacy mode" : "Enable privacy mode"}
        >
          <span
            className="absolute top-0.5 w-3.5 h-3.5 transition-all duration-200"
            style={{
              background: privacy ? "var(--bg-void)" : "var(--text-muted)",
              left: privacy ? "calc(100% - 18px)" : "2px",
            }}
          />
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            background: saved ? "rgba(74,222,128,0.12)" : "var(--accent)",
            color: saved ? "#4ade80" : "var(--bg-void)",
            border: saved ? "1px solid rgba(74,222,128,0.3)" : "1px solid transparent",
          }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
          {saved ? "Saved" : "Save preferences"}
        </button>

        {saved && (
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Anya will use these weights on your next message.
          </span>
        )}
      </div>
    </div>
  );
}
