import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/identity/StatCard";
import { Search, Database, Target, Layers, Plus, Activity } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";

type Inv = {
  id: string; username: string; status: string; created_at: string;
  profiles_count: number; matches_count: number; high_confidence_count: number;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s: Record<string, unknown>) => ({ u: typeof s.u === "string" ? s.u : undefined }),
  component: Dashboard,
});

function Dashboard() {
  const { u } = Route.useSearch();
  const navigate = useNavigate();
  const [username, setUsername] = useState(u ?? "");
  const [recent, setRecent] = useState<Inv[] | null>(null);
  const [stats, setStats] = useState({ total: 0, profiles: 0, high: 0, platforms: 0 });

  useEffect(() => { if (u) setUsername(u); }, [u]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("investigations")
        .select("id,username,status,created_at,profiles_count,matches_count,high_confidence_count")
        .order("created_at", { ascending: false })
        .limit(8);
      setRecent(data ?? []);
      const { data: agg } = await supabase
        .from("investigations")
        .select("profiles_count,high_confidence_count");
      const totalProfiles = agg?.reduce((s, x) => s + (x.profiles_count ?? 0), 0) ?? 0;
      const high = agg?.reduce((s, x) => s + (x.high_confidence_count ?? 0), 0) ?? 0;
      setStats({ total: agg?.length ?? 0, profiles: totalProfiles, high, platforms: 8 });
    })();
  }, []);

  function startSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    navigate({ to: "/search", search: { u: username.trim() } });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">// CONSOLE</div>
        <h1 className="font-mono text-2xl font-bold">Dashboard</h1>
      </div>

      {/* quick search */}
      <form onSubmit={startSearch} className="mb-8 flex gap-2 bg-card border border-border rounded-md p-3">
        <Search className="h-4 w-4 text-primary self-center ml-2" />
        <input
          value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="enter username to investigate…"
          className="flex-1 bg-transparent font-mono text-sm focus:outline-none"
        />
        <button className="px-4 py-1.5 bg-primary text-primary-foreground font-mono text-xs rounded-sm hover-glow">
          {"> investigate"}
        </button>
      </form>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Searches" value={stats.total} icon={Search} accent />
        <StatCard label="Profiles Found" value={stats.profiles} icon={Database} />
        <StatCard label="High Confidence" value={stats.high} icon={Target} />
        <StatCard label="Platforms Covered" value={stats.platforms} icon={Layers} />
      </div>

      {/* recent */}
      <div className="bg-card border border-border rounded-md">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div className="font-mono text-xs tracking-widest text-muted-foreground">// RECENT INVESTIGATIONS</div>
          <Link to="/investigations" className="font-mono text-xs text-primary hover:underline">view all →</Link>
        </div>
        <div className="divide-y divide-border">
          {recent === null && <div className="p-8 font-mono text-xs text-muted-foreground">// loading…</div>}
          {recent?.length === 0 && (
            <div className="p-12 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="font-mono text-sm text-muted-foreground mb-4">// no investigations yet</p>
              <Link to="/search" search={{ u: undefined }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-xs rounded-sm hover-glow">
                <Plus className="h-3 w-3" /> start first investigation
              </Link>
            </div>
          )}
          {recent?.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to="/investigations/$id" params={{ id: r.id }} className="flex items-center justify-between px-5 py-3 hover:bg-accent/30">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  <span className="font-mono text-sm font-semibold truncate">@{r.username}</span>
                  <span className="font-mono text-xs text-muted-foreground">· {r.profiles_count} profiles · {r.matches_count} matches</span>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    complete: "text-[oklch(0.85_0.18_145)] border-[oklch(0.72_0.18_145/0.4)] bg-[oklch(0.72_0.18_145/0.12)]",
    in_progress: "text-[oklch(0.88_0.16_80)] border-[oklch(0.78_0.16_80/0.4)] bg-[oklch(0.78_0.16_80/0.12)]",
    failed: "text-[oklch(0.78_0.22_25)] border-[oklch(0.62_0.24_25/0.4)] bg-[oklch(0.62_0.24_25/0.12)]",
  };
  const label = status === "in_progress" ? "IN PROGRESS" : status.toUpperCase();
  return <span className={`px-2 py-0.5 rounded-sm border font-mono text-[10px] tracking-widest ${map[status] ?? ""}`}>{label}</span>;
}
