create table if not exists plugins (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  version text not null default '1.0.0',
  capabilities text[] not null default '{}',
  config_schema jsonb,
  is_system boolean not null default false,
  icon_url text,
  created_at timestamptz not null default now()
);

create table if not exists user_plugins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  plugin_slug text references plugins (slug) on delete cascade not null,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  installed_at timestamptz not null default now(),
  constraint unique_user_plugin unique (user_id, plugin_slug)
);

alter table plugins enable row level security;
alter table user_plugins enable row level security;

-- All users can read system plugins
create policy "anyone can view system plugins"
  on plugins for select using (is_system = true);

create policy "users can manage own plugin installations"
  on user_plugins for all using (auth.uid() = user_id);

-- Seed built-in system plugins
insert into plugins (slug, name, description, version, capabilities, config_schema, is_system) values
  (
    'web-search',
    'Web Search',
    'Search the web for current information using Tavily.',
    '1.0.0',
    array['web_search'],
    '{"tavily_api_key": {"type": "secret", "label": "Tavily API Key", "description": "Get a free key at tavily.com", "required": true}}'::jsonb,
    true
  ),
  (
    'url-reader',
    'URL Reader',
    'Fetch and extract text content from any public URL.',
    '1.0.0',
    array['web_read'],
    '{}'::jsonb,
    true
  ),
  (
    'calculator',
    'Calculator',
    'Evaluate mathematical expressions safely.',
    '1.0.0',
    array['math'],
    '{}'::jsonb,
    true
  ),
  (
    'document-parser',
    'Document Parser',
    'Parse uploaded PDFs and documents for analysis.',
    '1.0.0',
    array['file_read'],
    '{}'::jsonb,
    true
  )
on conflict (slug) do nothing;
