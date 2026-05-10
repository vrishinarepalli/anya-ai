"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

export function NewWorkflowButton({ label }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function create() {
    setLoading(true);
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled Workflow" }),
    });
    const data = await res.json() as { id: string };
    router.push(`/workflows/${data.id}`);
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-60 transition-colors"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      {label ?? "New Workflow"}
    </button>
  );
}
