export type Platform =
  | "GitHub" | "Reddit" | "Twitter" | "Instagram"
  | "GitLab" | "Dev.to" | "StackOverflow" | "Keybase";

export const PLATFORM_COLORS: Record<string, string> = {
  GitHub: "#6e7681",
  Reddit: "#FF4500",
  Twitter: "#1DA1F2",
  Instagram: "#E1306C",
  GitLab: "#FC6D26",
  "Dev.to": "#a3a3a3",
  StackOverflow: "#F48024",
  Keybase: "#33A0FF",
};

export const ALL_PLATFORMS: Platform[] = [
  "GitHub", "Reddit", "GitLab", "Dev.to", "StackOverflow", "Keybase", "Twitter", "Instagram",
];

export function platformColor(p: string): string {
  return PLATFORM_COLORS[p] ?? "#888";
}

export function confidenceLabel(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 75) return "HIGH";
  if (score >= 55) return "MEDIUM";
  return "LOW";
}
