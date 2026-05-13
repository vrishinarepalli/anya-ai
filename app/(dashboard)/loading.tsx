export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col h-full animate-pulse">
      <div className="h-[52px] shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="h-full px-6 flex items-center gap-3">
          <div className="w-24 h-3 rounded" style={{ background: "var(--bg-lift)" }} />
        </div>
      </div>
      <div className="flex-1 px-6 py-8 space-y-4 max-w-2xl mx-auto w-full">
        <div className="w-32 h-3 rounded" style={{ background: "var(--bg-lift)" }} />
        <div className="w-full h-px" style={{ background: "var(--border)" }} />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4" style={{ border: "1px solid var(--border)" }}>
            <div className="flex-1 space-y-2">
              <div className="w-36 h-3 rounded" style={{ background: "var(--bg-lift)" }} />
              <div className="w-48 h-2 rounded" style={{ background: "var(--bg-hover)" }} />
            </div>
            <div className="w-10 h-5 rounded" style={{ background: "var(--bg-lift)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
