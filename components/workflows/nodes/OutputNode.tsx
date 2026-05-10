"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type OutputNodeType = Node<{ label: string; config: Record<string, unknown> }, "output">;

export function OutputNode({ data, selected }: NodeProps<OutputNodeType>) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border bg-zinc-900 min-w-[160px] shadow-lg",
        selected ? "border-emerald-500" : "border-emerald-700/40"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#10b981", width: 10, height: 10, border: "2px solid #18181b" }}
      />
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium text-white truncate">{data.label}</span>
      </div>
    </div>
  );
}
