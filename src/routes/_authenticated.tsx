import { createFileRoute, Outlet, Link, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Terminal, Search, FolderSearch, Network, FileText, Settings, LogOut, Command } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: AuthedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Search", icon: Search },
  { to: "/investigations", label: "Investigations", icon: FolderSearch },
  { to: "/graph", label: "Graph View", icon: Network },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AuthedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [showQuick, setShowQuick] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setShowQuick(true);
      }
      if (e.key === "Escape") setShowQuick(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-muted-foreground">// initializing console…</div>;
  }

  return (
    <div className="min-h-screen flex w-full">
      <Toaster theme="dark" position="bottom-right" />
      {/* sidebar */}
      <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <Link to="/dashboard" search={{ u: undefined }} className="px-5 h-14 flex items-center gap-2 font-mono font-bold border-b border-sidebar-border">
          <Terminal className="h-4 w-4 text-primary" />
          <span>identity_linker</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm font-mono text-xs transition-colors ${
                  active ? "bg-accent text-foreground border-l-2 border-primary" : "text-sidebar-foreground/70 hover:text-foreground hover:bg-sidebar-accent"
                }`}>
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </Link>
            );
          })}
          <button
            onClick={() => setShowQuick(true)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-sm font-mono text-xs text-muted-foreground hover:bg-sidebar-accent border border-dashed border-sidebar-border mt-4"
          >
            <span className="flex items-center gap-2"><Command className="h-3.5 w-3.5" /> Quick search</span>
            <kbd className="text-[10px] opacity-70">⌘K</kbd>
          </button>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-sm bg-primary/20 border border-primary/40 flex items-center justify-center font-mono text-xs text-primary">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs truncate">{user?.email}</div>
              <div className="font-mono text-[10px] text-muted-foreground">operator</div>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-primary p-1" title="Logout">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>

      {showQuick && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-32" onClick={() => setShowQuick(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-card border border-primary/40 rounded-md p-4 glow-primary">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const u = String(fd.get("u") ?? "").trim();
                if (u) { setShowQuick(false); navigate({ to: "/dashboard", search: { u } as any }); }
              }}
            >
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground mb-2">
                <Command className="h-3 w-3 text-primary" /> quick_search
              </div>
              <input
                autoFocus name="u" placeholder="username..."
                className="w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              />
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">↵ to investigate · ESC to close</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
