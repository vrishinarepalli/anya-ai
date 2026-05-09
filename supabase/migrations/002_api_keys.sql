create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  provider text not null check (provider in ('openai', 'anthropic', 'google', 'ollama')),
  label text not null,
  vault_secret_id uuid not null,
  base_url text,
  is_active boolean not null default true,
  last_tested_at timestamptz,
  last_test_status text check (last_test_status in ('ok', 'error', 'quota_exceeded')),
  created_at timestamptz not null default now(),
  constraint unique_user_provider_label unique (user_id, provider, label)
);

alter table api_keys enable row level security;

create policy "users can manage own api keys"
  on api_keys for all using (auth.uid() = user_id);

-- Index for fast provider lookups
create index if not exists api_keys_user_provider_idx on api_keys (user_id, provider, is_active);
