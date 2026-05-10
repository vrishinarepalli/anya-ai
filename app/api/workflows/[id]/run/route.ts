import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runWorkflow } from "@/lib/workflows/runner";
import type { WorkflowNode, WorkflowEdge } from "@/types/workflows";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { input?: string };
  const inputText = body.input?.trim() || "";

  if (!inputText) return NextResponse.json({ error: "Input text is required" }, { status: 400 });

  const { data: workflow } = await supabase
    .from("workflows")
    .select("nodes, edges")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

  const nodes = (workflow.nodes ?? []) as unknown as WorkflowNode[];
  const edges = (workflow.edges ?? []) as unknown as WorkflowEdge[];

  // Create a run record
  const { data: run } = await supabase
    .from("workflow_runs")
    .insert({ workflow_id: id, user_id: user.id, status: "running", input: inputText, started_at: new Date().toISOString() })
    .select("id")
    .single();

  let result;
  try {
    result = await runWorkflow(nodes, edges, inputText, user.id, supabase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workflow execution failed";
    console.error("[workflows/run] execution failed", { id, error: err });
    if (run?.id) {
      await supabase.from("workflow_runs").update({ status: "failed", error: message, completed_at: new Date().toISOString() }).eq("id", run.id);
    }
    return NextResponse.json({ error: message }, { status: 422 });
  }

  if (run?.id) {
    await supabase.from("workflow_runs").update({
      status: "completed",
      output: result.output,
      steps: result.steps as unknown as import("@/types/database").Json,
      cost_usd: result.costUsd,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
  }

  return NextResponse.json({ output: result.output, steps: result.steps, costUsd: result.costUsd });
}
