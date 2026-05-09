import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KeysManager } from "@/components/settings/KeysManager";

export default async function KeysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, provider, label, is_active, last_tested_at, last_test_status, base_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">API Keys</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Connect your AI provider accounts. Keys are encrypted and stored securely — never exposed to the frontend.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-950/40 border border-amber-900/50 text-amber-400 text-xs">
          ⚠️ API usage is billed by your provider directly based on your account and usage.
        </div>
      </div>
      <KeysManager initialKeys={keys ?? []} />
    </div>
  );
}
