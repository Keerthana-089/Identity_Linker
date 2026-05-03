import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ALL_PLATFORMS, platformColor } from "@/lib/platforms";
import { mockSearch, mockCorrelate, buildGraph } from "@/lib/osint";
import { Loader2, CheckCircle2, Circle, AlertCircle, Search as SearchIcon, GitMerge, Network, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>) => ({ u: typeof s.u === "string" ? s.u : undefined }),
  component: SearchPage,
});

type StepStatus = "pending" | "running" | "complete" | "failed";
const STEPS = [
  { key: "osint", label: "OSINT Collection", desc: "scanning platforms", icon: SearchIcon },
  { key: "match", label: "Fuzzy Matching", desc: "correlating identities", icon: GitMerge },
  { key: "graph", label: "Graph Building", desc: "constructing network", icon: Network },
  { key: "viz", label: "Visualization", desc: "rendering graph", icon: Eye },
] as const;

function SearchPage() {
  const { u } = Route.useSearch();
  const navigate = useNavigate();
  const run = useServerFn(runInvestigation);

  const [username, setUsername] = useState(u ?? "");
  const [email, setEmail] = useState("");
  const [threshold, setThreshold] = useState(50);
  const [selected, setSelected] = useState<string[]>([...ALL_PLATFORMS]);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Record<string, StepStatus>>({ osint: "pending", match: "pending", graph: "pending", viz: "pending" });
  const [scanned, setScanned] = useState<Record<string, "pending" | "checking" | "found">>({});

  const togglePlatform = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  useEffect(() => { if (u) setUsername(u); }, [u]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || running) return;
    if (!selected.length) { toast.error("Select at least one platform"); return; }
    setRunning(true);
    setSteps({ osint: "running", match: "pending", graph: "pending", viz: "pending" });
    setScanned(Object.fromEntries(selected.map((p) => [p, "pending"])));

    // animate platform scan
    const platOrder = [...selected];
    for (let i = 0; i < platOrder.length; i++) {
      setScanned((prev) => ({ ...prev, [platOrder[i]]: "checking" }));
      await wait(180 + Math.random() * 220);
      setScanned((prev) => ({ ...prev, [platOrder[i]]: "found" }));
    }

    setSteps((s) => ({ ...s, osint: "complete", match: "running" }));
    await wait(900);
    setSteps((s) => ({ ...s, match: "complete", graph: "running" }));

    try {
      const result = await run({ data: { username: username.trim(), email: email.trim(), threshold, platforms: selected } });
      setSteps((s) => ({ ...s, graph: "complete", viz: "running" }));
      await wait(600);
      setSteps((s) => ({ ...s, viz: "complete" }));
      toast.success(`Found ${result.profiles.length} profiles · ${result.matches.length} matches`);
      navigate({ to: "/investigations/$id", params: { id: result.investigationId } });
    } catch (err: any) {
      setSteps((s) => ({ ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v === "running" ? "failed" : v])) as any }));
      toast.error(err?.message ?? "Investigation failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">// NEW INVESTIGATION</div>
        <h1 className="font-mono text-2xl font-bold">Search</h1>
      </div>

      <form onSubmit={start} className="bg-card border border-border rounded-md p-6 space-y-5 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] tracking-widest text-muted-foreground">USERNAME *</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required disabled={running}
              className="mt-1 w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary disabled:opacity-50"
              placeholder="octocat" />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-widest text-muted-foreground">EMAIL (optional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={running}
              className="mt-1 w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary disabled:opacity-50"
              placeholder="target@domain.com" />
          </div>
        </div>
        <div>
          <div className="flex justify-between font-mono text-[10px] tracking-widest text-muted-foreground mb-2">
            <span>PLATFORMS · {selected.length}/{ALL_PLATFORMS.length}</span>
            <button type="button" disabled={running}
              onClick={() => setSelected(selected.length === ALL_PLATFORMS.length ? [] : [...ALL_PLATFORMS])}
              className="text-primary hover:underline disabled:opacity-50">
              {selected.length === ALL_PLATFORMS.length ? "clear all" : "select all"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((p) => {
              const active = selected.includes(p);
              return (
                <button key={p} type="button" disabled={running}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 font-mono text-xs rounded-sm border transition-all disabled:opacity-50 ${
                    active ? "border-primary text-foreground bg-primary/10" : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                  style={active ? { boxShadow: `0 0 0 1px ${platformColor(p)}33` } : undefined}>
                  <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: platformColor(p) }} />
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="flex justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
            <span>SIMILARITY THRESHOLD</span>
            <span className="text-primary">{threshold}</span>
          </div>
          <input type="range" min={0} max={100} value={threshold} disabled={running}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full mt-2 accent-primary" />
        </div>
        <button disabled={running} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-mono text-sm font-semibold rounded-sm hover-glow disabled:opacity-50">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : ">"} Start Investigation
        </button>
      </form>

      {/* progress */}
      <AnimatePresence>
        {running && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-md p-5">
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4">// PIPELINE</div>
              <ol className="space-y-4">
                {STEPS.map((s) => {
                  const status = steps[s.key];
                  return (
                    <li key={s.key} className="flex items-start gap-3">
                      <StepIcon status={status} />
                      <div className="flex-1">
                        <div className="font-mono text-sm flex items-center gap-2">
                          <s.icon className="h-3 w-3 text-muted-foreground" />
                          {s.label}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">{s.desc}</div>
                      </div>
                      <span className={`font-mono text-[10px] tracking-widest ${
                        status === "complete" ? "text-[oklch(0.85_0.18_145)]" :
                        status === "running" ? "text-primary" :
                        status === "failed" ? "text-primary" : "text-muted-foreground"
                      }`}>{status.toUpperCase()}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="bg-card border border-border rounded-md p-5">
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4">// PLATFORM SCAN</div>
              <ul className="space-y-2 font-mono text-xs">
                {selected.map((p) => {
                  const st = scanned[p] ?? "pending";
                  return (
                    <li key={p} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: platformColor(p) }} />
                        {p}
                      </span>
                      {st === "found" && <span className="text-[oklch(0.85_0.18_145)]">[ ✓ ]</span>}
                      {st === "checking" && <span className="text-primary flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> checking</span>}
                      {st === "pending" && <span className="text-muted-foreground">[ - ]</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "complete") return <CheckCircle2 className="h-5 w-5 text-[oklch(0.85_0.18_145)] mt-0.5" />;
  if (status === "running") return <Loader2 className="h-5 w-5 text-primary animate-spin mt-0.5" />;
  if (status === "failed") return <AlertCircle className="h-5 w-5 text-primary mt-0.5" />;
  return <Circle className="h-5 w-5 text-muted-foreground/50 mt-0.5" />;
}

function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
