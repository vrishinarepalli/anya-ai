export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-void)" }}>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-20 h-2 mx-auto rounded" style={{ background: "var(--bg-lift)" }} />
          <div className="w-48 h-3 mx-auto rounded" style={{ background: "var(--bg-surface)" }} />
          <div className="w-64 h-2 mx-auto rounded" style={{ background: "var(--bg-hover)" }} />
        </div>
      </div>
      <div className="shrink-0 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="h-6 rounded" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-strong)" }} />
        </div>
      </div>
    </div>
  );
}
