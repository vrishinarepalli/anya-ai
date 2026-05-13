import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { GitBranch, Clock } from "lucide-react";
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
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div
            className="text-[10px] tracking-[0.2em] uppercase font-medium mb-2"
            style={{ color: "var(--accent)" }}
          >
            Anya
          </div>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Workflows
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Chain AI models into multi-step pipelines with a visual editor.
          </p>
        </div>
        <NewWorkflowButton />
      </div>

      {(!workflows || workflows.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{ border: "1px solid var(--border-strong)" }}
          >
            <GitBranch className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              No workflows yet
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Create your first workflow to chain AI models together.
            </p>
          </div>
          <NewWorkflowButton label="Create first workflow" />
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((wf) => (
            <Link
              key={wf.id}
              href={`/workflows/${wf.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-all duration-150 group"
              style={{ border: "1px solid var(--border)", background: "var(--bg-surface)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.background = "var(--bg-lift)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--bg-surface)";
              }}
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {wf.name}
                </p>
                {wf.description && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                    {wf.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0" style={{ color: "var(--text-dim)" }}>
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">
                  {new Date(wf.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
