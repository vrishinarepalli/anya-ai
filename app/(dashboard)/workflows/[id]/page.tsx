import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkflowCanvas } from "@/components/workflows/WorkflowCanvas";
import type { WorkflowNode, WorkflowEdge } from "@/types/workflows";

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!workflow) redirect("/workflows");

  return (
    <WorkflowCanvas
      workflowId={workflow.id}
      initialName={workflow.name}
      initialNodes={(workflow.nodes ?? []) as unknown as WorkflowNode[]}
      initialEdges={(workflow.edges ?? []) as unknown as WorkflowEdge[]}
    />
  );
}
