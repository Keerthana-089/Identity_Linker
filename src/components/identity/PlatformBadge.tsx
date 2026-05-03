import { platformColor } from "@/lib/platforms";

export function PlatformBadge({ platform, size = "sm" }: { platform: string; size?: "sm" | "md" }) {
  const color = platformColor(platform);
  const initials = platform.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
  const sz = size === "md" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]";
  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${sz} font-mono font-bold rounded-sm flex items-center justify-center text-white shrink-0`}
        style={{ background: color, boxShadow: `0 0 12px ${color}66` }}
      >
        {initials}
      </div>
      <span className="font-mono text-xs text-muted-foreground">{platform}</span>
    </div>
  );
}
