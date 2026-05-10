"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModelNodeType = Node<
  { label: string; config: { promptTemplate?: string; systemPrompt?: string; provider?: string; model?: string } },
  "model"
>;

export function ModelNode({ data, selected }: NodeProps<ModelNodeType>) {
  const provider = data.config?.provider || "auto";
  const template = data.config?.promptTemplate;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border bg-zinc-900 min-w-[180px] max-w-[240px] shadow-lg",
        selected ? "border-blue-500" : "border-blue-700/40"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#3b82f6", width: 10, height: 10, border: "2px solid #18181b" }}
      />
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
          <Cpu className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium text-white truncate">{data.label}</span>
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-zinc-500 capitalize">{provider === "auto" ? "Auto-routed" : provider}</p>
        {template && (
          <p className="text-xs text-zinc-600 truncate">{template.slice(0, 40)}{template.length > 40 ? "…" : ""}</p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#3b82f6", width: 10, height: 10, border: "2px solid #18181b" }}
      />
    </div>
  );
}
