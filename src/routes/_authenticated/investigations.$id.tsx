import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ForceGraph, type GraphNode, type GraphLink } from "@/components/identity/ForceGraph";
import { PlatformBadge } from "@/components/identity/PlatformBadge";
import { ConfidenceBadge } from "@/components/identity/ConfidenceBadge";
import { platformColor, ALL_PLATFORMS } from "@/lib/platforms";
import { Download, FileJson, Image as ImageIcon, FileText, ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/investigations/$id")({
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = useParams({ from: "/_authenticated/investigations/$id" });
  const [inv, setInv] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: i }, { data: p }, { data: m }, { data: g }] = await Promise.all([
        supabase.from("investigations").select("*").eq("id", id).single(),
        supabase.from("profiles_found").select("*").eq("investigation_id", id),
        supabase.from("matches").select("*").eq("investigation_id", id).order("score", { ascending: false }),
        supabase.from("graph_data").select("*").eq("investigation_id", id).maybeSingle(),
      ]);
      setInv(i); setProfiles(p ?? []); setMatches(m ?? []);
      if (g) setGraph({ nodes: g.nodes_json as any, links: g.edges_json as any });
    })();
  }, [id]);

  function downloadJSON() {
    const blob = new Blob([JSON.stringify({ inv, profiles, matches, graph }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `investigation-${id}.json`; a.click();
    toast.success("JSON exported");
  }

  if (!inv) return <div className="p-8 font-mono text-sm text-muted-foreground">// loading investigation…</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link to="/investigations" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-3 w-3" /> all investigations
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">// TARGET</div>
          <h1 className="font-mono text-2xl font-bold">@{inv.username}</h1>
          <div className="font-mono text-xs text-muted-foreground mt-1">
            {profiles.length} profiles · {matches.length} matches · threshold {inv.threshold}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadJSON} className="px-3 py-1.5 border border-border rounded-sm font-mono text-xs hover-glow inline-flex items-center gap-2">
            <FileJson className="h-3 w-3" /> JSON
          </button>
          <button onClick={() => toast.info("PNG export coming soon")} className="px-3 py-1.5 border border-border rounded-sm font-mono text-xs hover-glow inline-flex items-center gap-2">
            <ImageIcon className="h-3 w-3" /> PNG
          </button>
          <Link to="/reports" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-sm font-mono text-xs hover-glow inline-flex items-center gap-2">
            <FileText className="h-3 w-3" /> Report
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6 mb-6">
        {/* profile cards */}
        <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground">// PROFILES ({profiles.length})</div>
          {profiles.map((p) => {
            const status = (p.status ?? "FOUND") as "FOUND" | "EXISTS" | "NOT_FOUND" | "ERROR";
            const statusMeta: Record<string, { label: string; cls: string; dot: string }> = {
              FOUND:     { label: "● FOUND",     cls: "text-[oklch(0.85_0.18_145)] border-[oklch(0.85_0.18_145)]/40 bg-[oklch(0.85_0.18_145)]/10", dot: "" },
              EXISTS:    { label: "● EXISTS",    cls: "text-[#3b9eff] border-[#3b9eff]/40 bg-[#3b9eff]/10", dot: "" },
              NOT_FOUND: { label: "○ NOT FOUND", cls: "text-muted-foreground border-border bg-muted/20", dot: "" },
              ERROR:     { label: "○ ERROR",     cls: "text-primary border-primary/40 bg-primary/10", dot: "" },
            };
            const m = statusMeta[status];
            const dim = status === "NOT_FOUND" || status === "ERROR";
            return (
              <div key={p.id} className={`bg-card border border-border rounded-md p-4 hover-glow ${dim ? "opacity-60" : ""}`}
                style={{ borderLeft: `3px solid ${platformColor(p.platform)}` }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <PlatformBadge platform={p.platform} size="md" />
                  <span className={`font-mono text-[9px] tracking-widest px-2 py-0.5 rounded-sm border ${m.cls}`}>{m.label}</span>
                </div>
                <div className="font-mono text-sm font-bold">{p.display_name ?? p.username}</div>
                <div className="font-mono text-xs text-muted-foreground">@{p.username}</div>
                {p.bio && <div className="text-xs mt-2 leading-relaxed">{p.bio}</div>}
                {p.location && (
                  <div className="font-mono text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.location}
                  </div>
                )}
                {p.profile_url && (
                  <a href={p.profile_url} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-primary hover:underline mt-2 inline-block break-all">
                    {p.profile_url}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* graph */}
        <div className="bg-card border border-border rounded-md p-4">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">// IDENTITY GRAPH</div>
          {graph && <ForceGraph nodes={graph.nodes} links={graph.links} />}
          <div className="mt-3 flex flex-wrap gap-3">
            {ALL_PLATFORMS.filter((p) => profiles.some((x) => x.platform === p)).map((p) => (
              <div key={p} className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: platformColor(p) }} /> {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* matches table */}
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="border-b border-border px-5 py-3 font-mono text-[10px] tracking-widest text-muted-foreground">// CORRELATION MATRIX ({matches.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead className="text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">A</th><th className="text-left p-3">B</th><th className="text-left p-3">Score</th><th className="text-left p-3">Confidence</th></tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-accent/30">
                  <td className="p-3"><span style={{ color: platformColor(m.platform_a) }}>●</span> {m.platform_a} / @{m.username_a}</td>
                  <td className="p-3"><span style={{ color: platformColor(m.platform_b) }}>●</span> {m.platform_b} / @{m.username_b}</td>
                  <td className="p-3 text-foreground font-bold">{Number(m.score).toFixed(0)}</td>
                  <td className="p-3"><ConfidenceBadge level={m.confidence} /></td>
                </tr>
              ))}
              {matches.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">// no correlations above threshold</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
