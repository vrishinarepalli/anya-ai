-- Vault wrapper functions
-- Supabase Vault stores secrets encrypted. These wrappers expose the
-- vault schema functions as callable RPCs from the service role.
-- Run this migration AFTER enabling the Vault extension in your Supabase dashboard.

-- Create a secret in Vault
create or replace function public.vault_create_secret(
  secret text,
  name text,
  description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  secret_id uuid;
begin
  insert into vault.secrets (secret, name, description)
  values (secret, name, description)
  returning id into secret_id;
  return secret_id;
end;
$$;

-- Read (decrypt) a secret from Vault
create or replace function public.vault_read_secret(secret_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  secret_value text;
begin
  select decrypted_secret into secret_value
  from vault.decrypted_secrets
  where id = secret_id;

  if secret_value is null then
    raise exception 'Secret not found: %', secret_id;
  end if;

  return secret_value;
end;
$$;

-- Delete a secret from Vault
create or replace function public.vault_delete_secret(secret_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from vault.secrets where id = secret_id;
  return found;
end;
$$;

-- Restrict these functions to service role only
revoke all on function public.vault_create_secret from public, anon, authenticated;
revoke all on function public.vault_read_secret from public, anon, authenticated;
revoke all on function public.vault_delete_secret from public, anon, authenticated;
