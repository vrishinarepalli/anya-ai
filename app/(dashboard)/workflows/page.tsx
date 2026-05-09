export default function WorkflowsPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <div className="max-w-sm space-y-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto text-2xl">
          🔗
        </div>
        <h2 className="text-lg font-medium text-white">Visual Workflow Builder</h2>
        <p className="text-sm text-zinc-400">
          Design multi-step AI pipelines with a node-based editor. Chain models, tools, and logic into automated workflows.
        </p>
        <span className="inline-block px-3 py-1 rounded-full text-xs bg-violet-900/40 text-violet-400 border border-violet-800/50">
          Coming in Phase 4
        </span>
      </div>
    </div>
  );
}
