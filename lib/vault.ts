import { createServiceClient } from "@/lib/supabase/server";

/**
 * Store an API key in Supabase Vault.
 * Returns the vault secret ID — the raw key never touches the DB directly.
 */
export async function storeSecret(
  userId: string,
  provider: string,
  secret: string
): Promise<string> {
  const supabase = await createServiceClient();
  const name = `nexus_${userId}_${provider}_${Date.now()}`;

  const { data, error } = await supabase.rpc("vault_create_secret", {
    secret,
    name,
    description: `API key for provider ${provider}, user ${userId}`,
  });

  if (error) throw new Error(`Vault store failed: ${error.message}`);
  return data as string;
}

/**
 * Retrieve a decrypted API key from Vault. Server-side only.
 * Key is returned in memory only — never logged or stored.
 */
export async function readSecret(vaultSecretId: string): Promise<string> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase.rpc("vault_read_secret", {
    secret_id: vaultSecretId,
  });

  if (error) throw new Error(`Vault read failed: ${error.message}`);
  return data as string;
}

/**
 * Delete a secret from Vault.
 */
export async function deleteSecret(vaultSecretId: string): Promise<void> {
  const supabase = await createServiceClient();

  const { error } = await supabase.rpc("vault_delete_secret", {
    secret_id: vaultSecretId,
  });

  if (error) throw new Error(`Vault delete failed: ${error.message}`);
}
