import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { GitBranch, Plus, Clock } from "lucide-react";
import { NewWorkflowButton } from "@/components/workflows/NewWorkflowButton";

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workflows } = await supabase
    .from("workflows")
    .select("id, name, description, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Workflows</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Build multi-step AI pipelines with a visual node editor.
          </p>
        </div>
        <NewWorkflowButton />
      </div>

      {(!workflows || workflows.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-300">No workflows yet</p>
            <p className="text-xs text-zinc-500">Create your first workflow to chain AI models together.</p>
          </div>
          <NewWorkflowButton label="Create your first workflow" />
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((wf) => (
            <Link
              key={wf.id}
              href={`/workflows/${wf.id}`}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <GitBranch className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors truncate">
                  {wf.name}
                </p>
                {wf.description && (
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{wf.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-600 shrink-0">
                <Clock className="w-3 h-3" />
                {new Date(wf.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
