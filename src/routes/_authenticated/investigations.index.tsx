import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/investigations/")({
  component: InvList,
});

function InvList() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("investigations").select("*").order("created_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, []);
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">// HISTORY</div>
        <h1 className="font-mono text-2xl font-bold">Investigations</h1>
      </div>
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <table className="w-full font-mono text-xs">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left p-3">Target</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Profiles</th>
              <th className="text-left p-3">Matches</th>
              <th className="text-left p-3">High</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-accent/30">
                <td className="p-3">
                  <Link to="/investigations/$id" params={{ id: r.id }} className="text-primary hover:underline">@{r.username}</Link>
                </td>
                <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">{r.profiles_count}</td>
                <td className="p-3">{r.matches_count}</td>
                <td className="p-3">{r.high_confidence_count}</td>
                <td className="p-3"><span className="text-[oklch(0.85_0.18_145)]">{r.status}</span></td>
              </tr>
            ))}
            {rows?.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">
                // no investigations yet · <Link to="/search" search={{ u: undefined }} className="text-primary inline-flex items-center gap-1"><Search className="h-3 w-3" />start one</Link>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
