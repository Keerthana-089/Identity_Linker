import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: LucideIcon; accent?: boolean }) {
  return (
    <div className={`bg-card border rounded-md p-4 hover-glow ${accent ? "terminal-border" : "border-border"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{label}</span>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className={`font-mono text-3xl font-bold ${accent ? "text-primary glow-text" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
