create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model_used text,
  provider_used text,
  routing_decision jsonb,
  tokens_input integer,
  tokens_output integer,
  cost_usd numeric(12, 8),
  latency_ms integer,
  plugins_used text[],
  created_at timestamptz not null default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "users can manage own conversations"
  on conversations for all using (auth.uid() = user_id);

create policy "users can manage own messages"
  on messages for all
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);
create index if not exists conversations_user_idx on conversations (user_id, updated_at desc);

-- Keep updated_at current
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_updated_at
  before update on conversations
  for each row execute procedure update_updated_at();
