"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Clock, DollarSign } from "lucide-react";
import { cn, formatCost, formatLatency } from "@/lib/utils";
import { PROVIDER_LABELS } from "@/lib/providers/index";
import type { ProviderType } from "@/types/routing";
import type { RoutingInfo } from "@/types/ui";
interface RoutingBadgeProps {
  routing: RoutingInfo;
  latencyMs?: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "text-emerald-400",
  anthropic: "text-orange-400",
  google: "text-blue-400",
  ollama: "text-violet-400",
};

export function RoutingBadge({ routing, latencyMs }: RoutingBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const providerLabel = PROVIDER_LABELS[routing.provider as ProviderType] ?? routing.provider;
  const providerColor = PROVIDER_COLORS[routing.provider] ?? "text-zinc-400";

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors group"
      >
        <Zap className="w-3 h-3 text-violet-500" />
        <span className={cn("font-medium", providerColor)}>{routing.label}</span>
        <span className="text-zinc-600">·</span>
        <span className="text-zinc-600">{providerLabel}</span>

        {routing.estimatedCostUsd > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="flex items-center gap-0.5 text-zinc-600">
              <DollarSign className="w-2.5 h-2.5" />
              {formatCost(routing.estimatedCostUsd)}
            </span>
          </>
        )}

        {latencyMs && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="flex items-center gap-0.5 text-zinc-600">
              <Clock className="w-2.5 h-2.5" />
              {formatLatency(latencyMs)}
            </span>
          </>
        )}

        {routing.tools.length > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-600">{routing.tools.join(", ")}</span>
          </>
        )}

        <span className="text-zinc-600 group-hover:text-zinc-400">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-3">
          <p className="text-zinc-400 leading-relaxed">{routing.reasoning}</p>

          <div className="space-y-1.5">
            <p className="text-zinc-600 uppercase tracking-wider text-[10px] font-medium">
              Models scored
            </p>
            {routing.scoreSummary
              .sort((a, b) => b.score - a.score)
              .map((s) => (
                <ScoreRow key={`${s.provider}-${s.model}`} score={s} winner={s.model === routing.model} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  score,
  winner,
}: {
  score: RoutingBadgeProps["routing"]["scoreSummary"][0];
  winner: boolean;
}) {
  const pct = Math.round(score.score * 100);

  return (
    <div className={cn("flex items-center gap-2", score.disqualified ? "opacity-40" : "")}>
      <div className="w-28 shrink-0 flex items-center gap-1">
        {winner && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />}
        {!winner && <span className="w-1.5 h-1.5 rounded-full shrink-0" />}
        <span className={cn("truncate", winner ? "text-white" : "text-zinc-400")}>
          {score.label}
        </span>
      </div>

      {score.disqualified ? (
        <span className="text-zinc-600 text-[10px]">{score.disqualified}</span>
      ) : (
        <div className="flex items-center gap-1.5 flex-1">
          <div className="flex-1 h-1 rounded-full bg-zinc-800">
            <div
              className={cn("h-1 rounded-full", winner ? "bg-violet-500" : "bg-zinc-600")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={cn("w-7 text-right tabular-nums", winner ? "text-zinc-300" : "text-zinc-600")}>
            {pct}%
          </span>
        </div>
      )}
    </div>
  );
}
