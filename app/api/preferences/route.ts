import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const prefsSchema = z.object({
  accuracy: z.number().min(0).max(1),
  speed: z.number().min(0).max(1),
  cost: z.number().min(0).max(1),
  creativity: z.number().min(0).max(1),
  reasoning: z.number().min(0).max(1),
  privacy: z.number().min(0).max(1),
});

export async function PUT(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = prefsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ optimization_preferences: parsed.data })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
