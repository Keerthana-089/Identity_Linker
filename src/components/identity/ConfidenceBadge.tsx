type Level = "HIGH" | "MEDIUM" | "LOW";

export function ConfidenceBadge({ level, score }: { level: Level; score?: number }) {
  const styles: Record<Level, string> = {
    HIGH: "bg-[oklch(0.72_0.18_145/0.15)] text-[oklch(0.85_0.18_145)] border-[oklch(0.72_0.18_145/0.4)]",
    MEDIUM: "bg-[oklch(0.78_0.16_80/0.15)] text-[oklch(0.88_0.16_80)] border-[oklch(0.78_0.16_80/0.4)]",
    LOW: "bg-[oklch(0.62_0.24_25/0.15)] text-[oklch(0.78_0.22_25)] border-[oklch(0.62_0.24_25/0.4)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-[10px] tracking-widest ${styles[level]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}{score !== undefined && <span className="opacity-70">· {Math.round(score)}</span>}
    </span>
  );
}
