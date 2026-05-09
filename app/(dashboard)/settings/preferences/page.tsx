import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreferenceSliders } from "@/components/settings/PreferenceSliders";
import type { OptimizationPreferences } from "@/types/routing";

const DEFAULTS: OptimizationPreferences = {
  accuracy: 0.7,
  speed: 0.5,
  cost: 0.5,
  creativity: 0.5,
  reasoning: 0.5,
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
        <h1 className="text-xl font-semibold text-white">Routing Preferences</h1>
        <p className="mt-1 text-sm text-zinc-400">
          These weights influence which model Anya selects for your requests. Higher values mean
          that dimension carries more weight in the routing decision.
        </p>
      </div>

      <PreferenceSliders initial={prefs} />
    </div>
  );
}
