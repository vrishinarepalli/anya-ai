create table if not exists model_metrics (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  task_type text not null,
  avg_latency_ms numeric,
  avg_cost_per_1k_tokens numeric,
  success_rate numeric check (success_rate between 0 and 1),
  sample_count integer not null default 0,
  recorded_at timestamptz not null default now()
);

-- Non-sensitive: all authenticated users can read aggregate metrics
-- This powers the "community performance" view
alter table model_metrics enable row level security;

create policy "authenticated users can read model metrics"
  on model_metrics for select using (auth.role() = 'authenticated');

-- Only service role inserts metrics (server-side only)
create index if not exists model_metrics_provider_model_idx on model_metrics (provider, model, task_type);

-- View: per-user cost summary from messages
create or replace view user_cost_summary as
select
  c.user_id,
  m.provider_used,
  m.model_used,
  count(*) as message_count,
  sum(m.tokens_input) as total_tokens_input,
  sum(m.tokens_output) as total_tokens_output,
  sum(m.cost_usd) as total_cost_usd,
  avg(m.latency_ms) as avg_latency_ms,
  date_trunc('day', m.created_at) as day
from messages m
join conversations c on c.id = m.conversation_id
where m.role = 'assistant'
group by c.user_id, m.provider_used, m.model_used, date_trunc('day', m.created_at);
