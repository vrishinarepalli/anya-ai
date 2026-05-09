import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-xl font-semibold text-white mt-1 tabular-nums">{value}</p>
    </div>
  );
}

type CostRow = {
  user_id: string;
  provider_used: string | null;
  model_used: string | null;
  message_count: number | null;
  total_tokens_input: number | null;
  total_tokens_output: number | null;
  total_cost_usd: number | null;
  avg_latency_ms: number | null;
  day: string | null;
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: rawData } = await supabase
    .from("user_cost_summary")
    .select("*")
    .eq("user_id", user.id) as { data: CostRow[] | null };

  const rows = rawData ?? [];

  const totals = rows.reduce(
    (acc, row) => ({
      cost: acc.cost + (row.total_cost_usd ?? 0),
      messages: acc.messages + (row.message_count ?? 0),
      tokensIn: acc.tokensIn + (row.total_tokens_input ?? 0),
      tokensOut: acc.tokensOut + (row.total_tokens_output ?? 0),
    }),
    { cost: 0, messages: 0, tokensIn: 0, tokensOut: 0 }
  );

  // Per-model aggregation
  const byModel = Object.values(
    rows.reduce<Record<string, { model: string; provider: string; messages: number; cost: number; tokens: number }>>(
      (acc, row) => {
        if (!row.model_used || !row.provider_used) return acc;
        const key = `${row.provider_used}/${row.model_used}`;
        if (!acc[key]) {
          acc[key] = { model: row.model_used, provider: row.provider_used, messages: 0, cost: 0, tokens: 0 };
        }
        acc[key].messages += row.message_count ?? 0;
        acc[key].cost += row.total_cost_usd ?? 0;
        acc[key].tokens += (row.total_tokens_input ?? 0) + (row.total_tokens_output ?? 0);
        return acc;
      },
      {}
    )
  ).sort((a, b) => b.messages - a.messages);

  // Last 30 days — daily message counts
  const recentRows = rows.filter((r) => r.day && r.day >= thirtyDaysAgo);
  const dailyMap = recentRows.reduce<Record<string, { messages: number; cost: number }>>((acc, row) => {
    const day = (row.day ?? "").slice(0, 10);
    if (!day) return acc;
    if (!acc[day]) acc[day] = { messages: 0, cost: 0 };
    acc[day].messages += row.message_count ?? 0;
    acc[day].cost += row.total_cost_usd ?? 0;
    return acc;
  }, {});

  const dailyBars = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }));

  const maxMessages = Math.max(1, ...dailyBars.map((d) => d.messages));

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Token usage, cost, and routing efficiency across your conversations.
        </p>
      </div>

      {totals.messages === 0 ? (
        <div className="text-center py-20 text-zinc-600 text-sm">
          No data yet — start chatting to see usage analytics.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Spent" value={`$${totals.cost.toFixed(4)}`} />
            <StatCard label="Messages" value={formatNum(totals.messages)} />
            <StatCard label="Tokens In" value={formatNum(totals.tokensIn)} />
            <StatCard label="Tokens Out" value={formatNum(totals.tokensOut)} />
          </div>

          {/* Per-model table */}
          {byModel.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-zinc-300">By Model</h2>
              <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                {byModel.map((m) => (
                  <div
                    key={`${m.provider}/${m.model}`}
                    className="flex items-center gap-4 px-4 py-3 bg-zinc-900/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{m.model}</p>
                      <p className="text-xs text-zinc-500 capitalize">{m.provider}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-sm text-white tabular-nums">{m.messages} msgs</p>
                      <p className="text-xs text-zinc-500 tabular-nums">${m.cost.toFixed(5)}</p>
                    </div>
                    <div className="w-20 shrink-0">
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full"
                          style={{ width: `${(m.messages / totals.messages) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily chart */}
          {dailyBars.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-zinc-300">Messages — Last 30 Days</h2>
              <div className="flex items-end gap-0.5 h-28 bg-zinc-900/30 rounded-xl p-3">
                {dailyBars.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-violet-600/70 hover:bg-violet-500 rounded-sm transition-colors min-h-[2px]"
                      style={{ height: `${(d.messages / maxMessages) * 100}%` }}
                      title={`${d.day}: ${d.messages} messages`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-zinc-600 px-1">
                <span>{dailyBars[0]?.day}</span>
                <span>{dailyBars[dailyBars.length - 1]?.day}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
