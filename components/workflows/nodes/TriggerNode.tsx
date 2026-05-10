"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type TriggerNodeType = Node<{ label: string; config: Record<string, unknown> }, "trigger">;

export function TriggerNode({ data, selected }: NodeProps<TriggerNodeType>) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border bg-zinc-900 min-w-[160px] shadow-lg",
        selected ? "border-violet-500" : "border-violet-700/50"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center shrink-0">
          <Play className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium text-white truncate">{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#7c3aed", width: 10, height: 10, border: "2px solid #18181b" }}
      />
    </div>
  );
}
