create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references workflows on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  input jsonb,
  output jsonb,
  steps jsonb not null default '[]'::jsonb,
  cost_usd numeric(10, 6),
  started_at timestamptz,
  completed_at timestamptz,
  error text
);

alter table workflows enable row level security;
alter table workflow_runs enable row level security;

create policy "users can manage own workflows"
  on workflows for all using (auth.uid() = user_id);

create policy "users can manage own workflow runs"
  on workflow_runs for all using (auth.uid() = user_id);

create index if not exists workflows_user_idx on workflows (user_id, updated_at desc);
create index if not exists workflow_runs_workflow_idx on workflow_runs (workflow_id, started_at desc);

create trigger workflows_updated_at
  before update on workflows
  for each row execute procedure update_updated_at();
