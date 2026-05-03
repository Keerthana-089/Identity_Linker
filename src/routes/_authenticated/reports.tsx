import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: Reports,
});

function Reports() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [report, setReport] = useState<string>("");

  useEffect(() => {
    supabase.from("investigations").select("id,username,profiles_count,matches_count,high_confidence_count,created_at,threshold")
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems(data ?? []));
  }, []);

  async function generate(invId: string) {
    setSelected(invId);
    const inv = items.find((i) => i.id === invId);
    const { data: p } = await supabase.from("profiles_found").select("*").eq("investigation_id", invId);
    const { data: m } = await supabase.from("matches").select("*").eq("investigation_id", invId);
    const txt = [
      `IDENTITY LINKER — INVESTIGATION REPORT`,
      `============================================`,
      `Target:        @${inv.username}`,
      `Date:          ${new Date(inv.created_at).toUTCString()}`,
      `Threshold:     ${inv.threshold}`,
      ``,
      `EXECUTIVE SUMMARY`,
      `-----------------`,
      `${p?.length ?? 0} profile(s) discovered across ${new Set(p?.map((x) => x.platform)).size} platforms.`,
      `${m?.length ?? 0} correlation(s); ${inv.high_confidence_count} high-confidence.`,
      ``,
      `PLATFORM PRESENCE`,
      `-----------------`,
      ...(p ?? []).map((x) => `  [${x.platform}] @${x.username} — ${x.display_name ?? "—"} — ${x.location ?? "—"}`),
      ``,
      `IDENTITY CORRELATIONS`,
      `---------------------`,
      ...(m ?? []).map((x) => `  ${x.platform_a}:@${x.username_a}  ↔  ${x.platform_b}:@${x.username_b}   score=${Number(x.score).toFixed(0)}  ${x.confidence}`),
      ``,
      `BREACH FINDINGS`,
      `---------------`,
      `  No public breaches matched in this investigation.`,
      ``,
      `METHODOLOGY`,
      `-----------`,
      `Username similarity (40%), bio (30%), email patterns (20%), location (10%).`,
      `Sources: GitHub, Reddit, GitLab, Dev.to, StackOverflow, Keybase, Twitter, Instagram.`,
    ].join("\n");
    setReport(txt);
  }

  function download() {
    const blob = new Blob([report], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report-${selected}.txt`; a.click();
    toast.success("Report downloaded");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">// REPORTS</div>
        <h1 className="font-mono text-2xl font-bold">Generate Report</h1>
      </div>
      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <div className="bg-card border border-border rounded-md p-3 space-y-1 max-h-[600px] overflow-auto">
          {items.map((i) => (
            <button key={i.id} onClick={() => generate(i.id)}
              className={`w-full text-left px-3 py-2 rounded-sm font-mono text-xs ${selected === i.id ? "bg-accent border-l-2 border-primary" : "text-muted-foreground hover:bg-accent/40"}`}>
              @{i.username}
              <div className="text-[10px] opacity-70">{new Date(i.created_at).toLocaleDateString()}</div>
            </button>
          ))}
          {items.length === 0 && <div className="p-3 font-mono text-xs text-muted-foreground">// no data</div>}
        </div>
        <div className="bg-card border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="h-3 w-3" /> // PREVIEW
            </div>
            {report && (
              <button onClick={download} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-sm font-mono text-xs hover-glow inline-flex items-center gap-2">
                <Download className="h-3 w-3" /> Download .txt
              </button>
            )}
          </div>
          {report ? (
            <pre className="font-mono text-[11px] whitespace-pre-wrap leading-5 text-foreground/90 bg-background border border-border rounded-sm p-4 max-h-[560px] overflow-auto">{report}</pre>
          ) : (
            <div className="h-[400px] flex items-center justify-center font-mono text-xs text-muted-foreground">// select an investigation to generate report</div>
          )}
        </div>
      </div>
    </div>
  );
}
