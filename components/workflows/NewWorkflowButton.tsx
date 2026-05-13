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
      className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.08em] uppercase font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
      style={{ background: "var(--accent)", color: "var(--bg-void)" }}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
      {label ?? "New Workflow"}
    </button>
  );
}
