export type NodeType =
  | "trigger"
  | "model"
  | "tool"
  | "condition"
  | "transform"
  | "output";

export type WorkflowStatus = "pending" | "running" | "completed" | "failed";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowNodeData {
  label: string;
  config: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  nodeId: string;
  nodeType: NodeType;
  status: WorkflowStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  costUsd?: number;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  userId: string;
  status: WorkflowStatus;
  input?: unknown;
  output?: unknown;
  steps: WorkflowStep[];
  costUsd?: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}
