"use client";

import { useState, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";
import type { OptimizationPreferences } from "@/types/routing";

const SLIDERS: Array<{
  key: keyof OptimizationPreferences;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
}> = [
  {
    key: "accuracy",
    label: "Accuracy",
    description: "Prefer higher-capability models that produce more correct answers.",
    lowLabel: "Good enough",
    highLabel: "Best possible",
  },
  {
    key: "speed",
    label: "Speed",
    description: "Prefer faster models with lower latency.",
    lowLabel: "No preference",
    highLabel: "Fastest",
  },
  {
    key: "cost",
    label: "Cost efficiency",
    description: "Prefer cheaper models to minimize API spend.",
    lowLabel: "Spend freely",
    highLabel: "Minimize cost",
  },
  {
    key: "creativity",
    label: "Creativity",
    description: "Prefer models that excel at creative and generative tasks.",
    lowLabel: "Factual",
    highLabel: "Creative",
  },
  {
    key: "reasoning",
    label: "Reasoning depth",
    description: "Prefer reasoning-specialized models for complex problem solving.",
    lowLabel: "Standard",
    highLabel: "Deep reasoning",
  },
  {
    key: "privacy",
    label: "Privacy",
    description: "Prefer local (Ollama) models that keep your data on your machine.",
    lowLabel: "Cloud is fine",
    highLabel: "Local only",
  },
];

interface PreferenceSlidersProps {
  initial: OptimizationPreferences;
}

export function PreferenceSliders({ initial }: PreferenceSlidersProps) {
  const [prefs, setPrefs] = useState<OptimizationPreferences>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback(
    (key: keyof OptimizationPreferences, value: number) => {
      setPrefs((p) => ({ ...p, [key]: value }));
      setSaved(false);
    },
    []
  );

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        {SLIDERS.map(({ key, label, description, lowLabel, highLabel }) => {
          const value = prefs[key];
          const pct = Math.round(value * 100);

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                </div>
                <span className="text-xs font-mono text-zinc-400 w-8 text-right">{pct}%</span>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={value}
                  onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-zinc-800 cursor-pointer accent-violet-500"
                  style={{
                    background: `linear-gradient(to right, rgb(139 92 246) ${pct}%, rgb(39 39 42) ${pct}%)`,
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-zinc-600">{lowLabel}</span>
                  <span className="text-[10px] text-zinc-600">{highLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? "Saved" : "Save preferences"}
        </button>

        {saved && <span className="text-xs text-zinc-500">Routing will use these weights on your next message.</span>}
      </div>
    </div>
  );
}
