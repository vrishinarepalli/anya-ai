export default function WorkflowsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="w-16 h-2 rounded" style={{ background: "var(--bg-lift)" }} />
          <div className="w-32 h-4 rounded" style={{ background: "var(--bg-surface)" }} />
        </div>
        <div className="w-28 h-8" style={{ background: "var(--bg-lift)" }} />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-5 py-4" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="w-40 h-3 rounded" style={{ background: "var(--bg-lift)" }} />
                <div className="w-56 h-2 rounded" style={{ background: "var(--bg-hover)" }} />
              </div>
              <div className="w-16 h-6 rounded" style={{ background: "var(--bg-lift)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
