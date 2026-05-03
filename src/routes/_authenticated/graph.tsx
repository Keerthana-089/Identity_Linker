import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ForceGraph } from "@/components/identity/ForceGraph";

export const Route = createFileRoute("/_authenticated/graph")({
  component: GraphExplorer,
});

function GraphExplorer() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [graph, setGraph] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("investigations").select("id,username").order("created_at", { ascending: false }).limit(20);
      setItems(data ?? []);
      if (data?.[0]) setSelected(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const { data } = await supabase.from("graph_data").select("*").eq("investigation_id", selected).maybeSingle();
      setGraph(data);
    })();
  }, [selected]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">// EXPLORER</div>
        <h1 className="font-mono text-2xl font-bold">Graph View</h1>
      </div>
      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <div className="bg-card border border-border rounded-md p-3 space-y-1 max-h-[600px] overflow-auto">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground p-2">// INVESTIGATIONS</div>
          {items.map((i) => (
            <button key={i.id} onClick={() => setSelected(i.id)}
              className={`w-full text-left px-3 py-2 rounded-sm font-mono text-xs ${selected === i.id ? "bg-accent text-foreground border-l-2 border-primary" : "text-muted-foreground hover:bg-accent/40"}`}>
              @{i.username}
            </button>
          ))}
          {items.length === 0 && <Link to="/search" search={{ u: undefined }} className="block p-3 text-xs text-primary font-mono">// start an investigation →</Link>}
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          {graph ? <ForceGraph nodes={graph.nodes_json} links={graph.edges_json} height={620} /> :
            <div className="h-[620px] flex items-center justify-center font-mono text-xs text-muted-foreground">// select an investigation</div>}
        </div>
      </div>
    </div>
  );
}
