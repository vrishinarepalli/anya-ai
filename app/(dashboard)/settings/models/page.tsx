import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModelsManager } from "@/components/settings/ModelsManager";

export default async function ModelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: keys }] = await Promise.all([
    supabase.from("profiles").select("disabled_models").eq("id", user.id).single(),
    supabase.from("api_keys").select("provider").eq("user_id", user.id).eq("is_active", true),
  ]);

  const disabledModels = (profile?.disabled_models ?? []) as string[];
  const connectedProviders = new Set((keys ?? []).map((k) => k.provider));

  // Platform Groq key counts as a connected provider if configured
  if (process.env.PLATFORM_GROQ_KEY) connectedProviders.add("groq");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div
          className="text-[10px] tracking-[0.2em] uppercase font-medium mb-2"
          style={{ color: "var(--accent)" }}
        >
          Settings
        </div>
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Models
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
          Free models are available immediately. Paid models require your own API key — Anya never charges you directly.
        </p>
      </div>

      <ModelsManager
        initialDisabled={disabledModels}
        connectedProviders={[...connectedProviders]}
      />
    </div>
  );
}
