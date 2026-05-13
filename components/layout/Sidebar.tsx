"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  MessageSquare,
  GitBranch,
  Puzzle,
  BarChart2,
  Settings,
  Cpu,
  Key,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const MAIN_NAV = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/plugins", label: "Plugins", icon: Puzzle },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

const SETTINGS_NAV = [
  { href: "/settings/models", label: "Models", icon: Cpu },
  { href: "/settings/keys", label: "API Keys", icon: Key },
  { href: "/settings/preferences", label: "Preferences", icon: SlidersHorizontal },
];

interface SidebarProps {
  user: User;
}

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: React.ElementType; pathname: string }) {
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className="relative flex items-center gap-3 px-3 py-2 text-xs tracking-[0.06em] uppercase font-medium transition-all duration-150"
      style={{
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        background: active ? "var(--bg-lift)" : "transparent",
        borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.background = "var(--bg-lift)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon
        className="w-3.5 h-3.5 shrink-0"
        style={{ color: active ? "var(--accent)" : "inherit" }}
      />
      {label}
    </Link>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside
      className="w-52 flex flex-col shrink-0"
      style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="h-[52px] flex items-center px-5 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/chat" className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--accent)", color: "#09090f" }}
          >
            A
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Anya
          </span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}

        {/* Settings section */}
        <div
          className="mt-4 mb-1 px-3 flex items-center gap-2"
        >
          <span
            className="text-[9px] tracking-[0.2em] uppercase font-medium"
            style={{ color: "var(--text-dim)" }}
          >
            Settings
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {SETTINGS_NAV.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
      </nav>

      {/* User footer */}
      <div
        className="shrink-0 p-3 flex flex-col gap-1"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5 px-3 py-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-5 h-5 flex items-center justify-center text-[9px] font-bold"
              style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
            >
              {initials}
            </div>
          )}
          <span
            className="text-xs truncate flex-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {displayName}
          </span>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 text-xs tracking-[0.06em] uppercase font-medium transition-all duration-150 w-full"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.background = "var(--bg-lift)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-dim)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
