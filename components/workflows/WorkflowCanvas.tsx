"use client";

import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type Connection,
  type Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Save, Play, X, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { TriggerNode, type TriggerNodeType } from "./nodes/TriggerNode";
import { ModelNode, type ModelNodeType } from "./nodes/ModelNode";
import { OutputNode, type OutputNodeType } from "./nodes/OutputNode";

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  model: ModelNode,
  output: OutputNode,
};

type AnyNode = TriggerNodeType | ModelNodeType | OutputNodeType;

interface WorkflowCanvasProps {
  workflowId: string;
  initialName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialNodes: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialEdges: any[];
}

interface RunResult {
  output: string;
  steps: Array<{ nodeId: string; nodeType: string; status: string; output?: unknown; error?: string; costUsd?: number }>;
  costUsd: number;
}

const NODE_PALETTE = [
  { type: "trigger", label: "Trigger", description: "Workflow start / user input", color: "violet" },
  { type: "model", label: "Model", description: "LLM call with prompt template", color: "blue" },
  { type: "output", label: "Output", description: "Collect the final result", color: "emerald" },
] as const;

export function WorkflowCanvas({ workflowId, initialName, initialNodes, initialEdges }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AnyNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [name, setName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runInput, setRunInput] = useState("");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const nodeCountRef = useRef(initialNodes.length);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) as AnyNode | undefined;

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  function addNode(type: "trigger" | "model" | "output") {
    const id = nanoid(8);
    nodeCountRef.current += 1;
    const offset = nodeCountRef.current * 30;
    const labelMap = { trigger: "Trigger", model: "LLM Step", output: "Output" };
    const configMap = {
      trigger: {},
      model: { promptTemplate: "{{input}}", provider: "auto" },
      output: {},
    };

    const newNode: AnyNode = {
      id,
      type,
      position: { x: 200 + offset, y: 100 + offset },
      data: { label: labelMap[type], config: configMap[type] },
    } as AnyNode;

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
  }

  function updateSelectedNodeData(patch: Partial<{ label: string; config: Record<string, unknown> }>) {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? { ...n, data: { ...n.data, ...patch, config: { ...(n.data.config as Record<string, unknown>), ...(patch.config ?? {}) } } }
          : n
      )
    );
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/workflows/${workflowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, nodes, edges }),
    });
    setSaving(false);
  }

  async function runWorkflow() {
    if (!runInput.trim()) return;
    setRunning(true);
    setRunResult(null);

    // Always save first
    await fetch(`/api/workflows/${workflowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, nodes, edges }),
    });

    const res = await fetch(`/api/workflows/${workflowId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: runInput }),
    });
    const data = await res.json() as RunResult & { error?: string };
    setRunning(false);
    if (res.ok) {
      setRunResult(data);
    } else {
      setRunResult({ output: data.error ?? "Run failed", steps: [], costUsd: 0 });
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center gap-3 px-4 shrink-0">
        <Link href="/workflows" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            className="bg-transparent text-sm font-medium text-white border-b border-zinc-600 focus:outline-none focus:border-violet-500 w-48"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-medium text-white hover:text-zinc-300 transition-colors"
          >
            {name}
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setShowRunPanel(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
        >
          <Play className="w-3 h-3" />
          Run
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Node palette */}
        <div className="w-48 border-r border-zinc-800 p-3 space-y-2 shrink-0 overflow-y-auto">
          <p className="text-xs font-medium text-zinc-500 px-1 mb-3">Add Node</p>
          {NODE_PALETTE.map(({ type, label, description, color }) => (
            <button
              key={type}
              onClick={() => addNode(type)}
              className="w-full text-left px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Plus className={cn("w-3 h-3 shrink-0", {
                  "text-violet-400": color === "violet",
                  "text-blue-400": color === "blue",
                  "text-emerald-400": color === "emerald",
                })} />
                <span className="text-xs font-medium text-white">{label}</span>
              </div>
              <p className="text-xs text-zinc-500 leading-tight">{description}</p>
            </button>
          ))}
        </div>

        {/* ReactFlow canvas */}
        <div className="flex-1 min-w-0 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            colorMode="dark"
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3f3f46" />
            <Controls className="!bg-zinc-900 !border-zinc-700 [&>button]:!bg-zinc-900 [&>button]:!border-zinc-700 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-800" />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-2">
                <p className="text-sm text-zinc-500">Add nodes from the left panel</p>
                <p className="text-xs text-zinc-600">Connect them by dragging from one handle to another</p>
              </div>
            </div>
          )}
        </div>

        {/* Node config panel */}
        {selectedNode && (
          <div className="w-64 border-l border-zinc-800 p-4 space-y-4 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Node Config</p>
              <button onClick={() => setSelectedNodeId(null)} className="text-zinc-600 hover:text-zinc-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Label</label>
              <input
                value={selectedNode.data.label}
                onChange={(e) => updateSelectedNodeData({ label: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {selectedNode.type === "model" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Provider</label>
                  <select
                    value={(selectedNode as ModelNodeType).data.config?.provider || "auto"}
                    onChange={(e) => updateSelectedNodeData({ config: { provider: e.target.value } })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="auto">Auto (Routing Engine)</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="google">Google</option>
                    <option value="ollama">Ollama (Local)</option>
                  </select>
                </div>

                {(selectedNode as ModelNodeType).data.config?.provider !== "auto" && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Model ID</label>
                    <input
                      value={(selectedNode as ModelNodeType).data.config?.model || ""}
                      onChange={(e) => updateSelectedNodeData({ config: { model: e.target.value } })}
                      placeholder="e.g. claude-3-haiku-20240307"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">System Prompt</label>
                  <textarea
                    value={(selectedNode as ModelNodeType).data.config?.systemPrompt || ""}
                    onChange={(e) => updateSelectedNodeData({ config: { systemPrompt: e.target.value } })}
                    placeholder="Optional system instructions…"
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Prompt Template</label>
                  <p className="text-xs text-zinc-600">Use {"{{"} input {"}}"}  for the previous node's output.</p>
                  <textarea
                    value={(selectedNode as ModelNodeType).data.config?.promptTemplate || "{{input}}"}
                    onChange={(e) => updateSelectedNodeData({ config: { promptTemplate: e.target.value } })}
                    rows={4}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                  />
                </div>
              </>
            )}

            <button
              onClick={() => {
                setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                setSelectedNodeId(null);
              }}
              className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 px-3 py-2 rounded-lg border border-red-900/30 transition-colors"
            >
              Delete Node
            </button>
          </div>
        )}
      </div>

      {/* Run panel overlay */}
      {showRunPanel && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => !running && setShowRunPanel(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Run Workflow</h3>
              <button onClick={() => setShowRunPanel(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Input Text</label>
              <textarea
                value={runInput}
                onChange={(e) => setRunInput(e.target.value)}
                placeholder="Enter the input for your workflow trigger…"
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
              />
            </div>

            <button
              onClick={runWorkflow}
              disabled={running || !runInput.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? "Running…" : "Run"}
            </button>

            {runResult && (
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-zinc-400">Output</p>
                  <div className="bg-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {runResult.output || <span className="text-zinc-500">No output</span>}
                  </div>
                </div>

                {runResult.steps.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-zinc-400">Steps</p>
                    <div className="space-y-1">
                      {runResult.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={cn("mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", {
                            "bg-emerald-500": step.status === "completed",
                            "bg-red-500": step.status === "failed",
                          })} />
                          <span className="text-zinc-400 capitalize">{step.nodeType}</span>
                          {step.status === "failed" && (
                            <span className="text-red-400 truncate flex-1">{step.error}</span>
                          )}
                          {step.costUsd !== undefined && step.costUsd > 0 && (
                            <span className="text-zinc-600 ml-auto shrink-0">${step.costUsd.toFixed(5)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {runResult.costUsd > 0 && (
                  <p className="text-xs text-zinc-500">
                    Total cost: <span className="text-zinc-300">${runResult.costUsd.toFixed(5)}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
