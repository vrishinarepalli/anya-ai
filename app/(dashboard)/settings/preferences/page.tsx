import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreferenceSliders } from "@/components/settings/PreferenceSliders";
import type { OptimizationPreferences } from "@/types/routing";

const DEFAULTS: OptimizationPreferences = {
  accuracy: 0.5,
  speed: 0.33,
  cost: 0.33,
  creativity: 0.25,
  reasoning: 0.25,
  privacy: 0.0,
};

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("optimization_preferences")
    .eq("id", user.id)
    .single();

  const prefs = (profile?.optimization_preferences as unknown as OptimizationPreferences) ?? DEFAULTS;

  return (
    <div className="max-w-xl mx-auto py-10 px-6 space-y-8">
      <div>
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}
        >
          Routing Preferences
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Allocate your 100-point budget across routing priorities. Anya uses these weights every time it picks a model — shifting points away from one dimension shifts the router toward another.
        </p>
      </div>

      <PreferenceSliders initial={prefs} />
    </div>
  );
}
