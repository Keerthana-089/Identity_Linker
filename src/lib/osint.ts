// Real OSINT lookups across public APIs (no auth required) +
// existence checks for platforms that block public scraping.
import type { Platform } from "@/lib/platforms";

export type ProfileStatus = "FOUND" | "EXISTS" | "NOT_FOUND" | "ERROR";

export type MockProfile = {
  platform: Platform;
  username: string;
  display_name: string;
  bio: string;
  location: string;
  avatar_url: string;
  profile_url: string;
  status: ProfileStatus;
};

export type MockMatch = {
  platform_a: string; username_a: string;
  platform_b: string; username_b: string;
  score: number; confidence: "HIGH" | "MEDIUM" | "LOW";
  details: { username: number; bio: number; email: number; location: number };
};

const UA = "Mozilla/5.0 (compatible; IdentityLinker/1.0)";

async function safeFetch(url: string, init?: RequestInit, timeoutMs = 6000): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, headers: { "User-Agent": UA, ...(init?.headers || {}) } });
  } catch { return null; }
  finally { clearTimeout(t); }
}

function hash(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ---------- Per-platform lookups ----------

async function lookupGitHub(u: string): Promise<MockProfile> {
  const r = await safeFetch(`https://api.github.com/users/${encodeURIComponent(u)}`);
  if (!r) return errProfile("GitHub", u, `https://github.com/${u}`);
  if (r.status === 404) return notFoundProfile("GitHub", u, `https://github.com/${u}`);
  if (!r.ok) return errProfile("GitHub", u, `https://github.com/${u}`);
  const d: any = await r.json();
  return {
    platform: "GitHub", username: d.login ?? u, status: "FOUND",
    display_name: d.name ?? d.login ?? u,
    bio: d.bio ?? "", location: d.location ?? "",
    avatar_url: d.avatar_url ?? "",
    profile_url: d.html_url ?? `https://github.com/${u}`,
  };
}

async function lookupGitLab(u: string): Promise<MockProfile> {
  const r = await safeFetch(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(u)}`);
  if (!r || !r.ok) return errProfile("GitLab", u, `https://gitlab.com/${u}`);
  const arr: any[] = await r.json();
  const d = arr?.[0];
  if (!d) return notFoundProfile("GitLab", u, `https://gitlab.com/${u}`);
  return {
    platform: "GitLab", username: d.username, status: "FOUND",
    display_name: d.name ?? d.username, bio: d.bio ?? "", location: d.location ?? "",
    avatar_url: d.avatar_url ?? "",
    profile_url: d.web_url ?? `https://gitlab.com/${u}`,
  };
}

async function lookupReddit(u: string): Promise<MockProfile> {
  const r = await safeFetch(`https://www.reddit.com/user/${encodeURIComponent(u)}/about.json`);
  if (!r) return errProfile("Reddit", u, `https://reddit.com/user/${u}`);
  if (r.status === 404) return notFoundProfile("Reddit", u, `https://reddit.com/user/${u}`);
  if (!r.ok) return errProfile("Reddit", u, `https://reddit.com/user/${u}`);
  const d: any = await r.json();
  const data = d?.data;
  if (!data) return notFoundProfile("Reddit", u, `https://reddit.com/user/${u}`);
  return {
    platform: "Reddit", username: data.name ?? u, status: "FOUND",
    display_name: data.subreddit?.title || data.name || u,
    bio: data.subreddit?.public_description ?? "",
    location: "",
    avatar_url: (data.icon_img || data.subreddit?.icon_img || "").split("?")[0],
    profile_url: `https://reddit.com/user/${data.name ?? u}`,
  };
}

async function lookupDevTo(u: string): Promise<MockProfile> {
  const r = await safeFetch(`https://dev.to/api/users/by_username?url=${encodeURIComponent(u)}`);
  if (!r) return errProfile("Dev.to", u, `https://dev.to/${u}`);
  if (r.status === 404) return notFoundProfile("Dev.to", u, `https://dev.to/${u}`);
  if (!r.ok) return errProfile("Dev.to", u, `https://dev.to/${u}`);
  const d: any = await r.json();
  return {
    platform: "Dev.to", username: d.username ?? u, status: "FOUND",
    display_name: d.name ?? d.username ?? u,
    bio: d.summary ?? "", location: d.location ?? "",
    avatar_url: d.profile_image ?? "",
    profile_url: `https://dev.to/${d.username ?? u}`,
  };
}

async function lookupStackOverflow(u: string): Promise<MockProfile> {
  // StackExchange has no username search; use display-name filter
  const r = await safeFetch(
    `https://api.stackexchange.com/2.3/users?inname=${encodeURIComponent(u)}&site=stackoverflow&pagesize=1&order=desc&sort=reputation`
  );
  if (!r || !r.ok) return errProfile("StackOverflow", u, `https://stackoverflow.com/users?tab=Users&filter=${u}`);
  const d: any = await r.json();
  const item = d?.items?.[0];
  if (!item) return notFoundProfile("StackOverflow", u, `https://stackoverflow.com/users?tab=Users&filter=${u}`);
  return {
    platform: "StackOverflow", username: item.display_name, status: "FOUND",
    display_name: item.display_name,
    bio: `Reputation ${item.reputation} · ${item.badge_counts?.gold ?? 0}🥇 ${item.badge_counts?.silver ?? 0}🥈 ${item.badge_counts?.bronze ?? 0}🥉`,
    location: item.location ?? "",
    avatar_url: item.profile_image ?? "",
    profile_url: item.link ?? `https://stackoverflow.com/users/${item.user_id}`,
  };
}

async function lookupKeybase(u: string): Promise<MockProfile> {
  const r = await safeFetch(`https://keybase.io/_/api/1.0/user/lookup.json?username=${encodeURIComponent(u)}`);
  if (!r || !r.ok) return errProfile("Keybase", u, `https://keybase.io/${u}`);
  const d: any = await r.json();
  const them = d?.them;
  if (!them || d.status?.code !== 0) return notFoundProfile("Keybase", u, `https://keybase.io/${u}`);
  const p = them.profile ?? {};
  return {
    platform: "Keybase", username: them.basics?.username ?? u, status: "FOUND",
    display_name: p.full_name ?? them.basics?.username ?? u,
    bio: p.bio ?? "", location: p.location ?? "",
    avatar_url: them.pictures?.primary?.url ?? "",
    profile_url: `https://keybase.io/${them.basics?.username ?? u}`,
  };
}

// Existence-only platforms: HEAD/GET the public profile URL.
async function existenceCheck(platform: Platform, u: string, url: string): Promise<MockProfile> {
  const r = await safeFetch(url, { method: "GET", redirect: "manual" });
  // these sites usually 200 for existing, 404 / redirect-to-login for missing
  let status: ProfileStatus = "ERROR";
  if (r) {
    if (r.status === 200) status = "EXISTS";
    else if (r.status === 404) status = "NOT_FOUND";
    else if (r.status >= 300 && r.status < 400) status = "NOT_FOUND";
    else status = "ERROR";
  }
  return {
    platform, username: u, status,
    display_name: u, bio: "", location: "", avatar_url: "",
    profile_url: url,
  };
}

function notFoundProfile(platform: Platform, u: string, url: string): MockProfile {
  return { platform, username: u, status: "NOT_FOUND", display_name: u, bio: "", location: "", avatar_url: "", profile_url: url };
}
function errProfile(platform: Platform, u: string, url: string): MockProfile {
  return { platform, username: u, status: "ERROR", display_name: u, bio: "", location: "", avatar_url: "", profile_url: url };
}

async function lookupPlatform(p: Platform, u: string): Promise<MockProfile> {
  switch (p) {
    case "GitHub": return lookupGitHub(u);
    case "GitLab": return lookupGitLab(u);
    case "Reddit": return lookupReddit(u);
    case "Dev.to": return lookupDevTo(u);
    case "StackOverflow": return lookupStackOverflow(u);
    case "Keybase": return lookupKeybase(u);
    case "Twitter": return existenceCheck("Twitter", u, `https://twitter.com/${u}`);
    case "Instagram": return existenceCheck("Instagram", u, `https://www.instagram.com/${u}/`);
    default: return errProfile(p, u, "");
  }
}

export async function mockSearch(
  username: string,
  _email?: string,
  requested?: Platform[],
): Promise<{ profiles: MockProfile[]; email_intel: { patterns: string[]; breaches: string[] } }> {
  const defaults: Platform[] = ["GitHub", "Reddit", "GitLab", "Dev.to", "StackOverflow", "Keybase", "Twitter", "Instagram"];
  const chosen: Platform[] = requested && requested.length ? requested : defaults;

  const results = await Promise.all(chosen.map((p) => lookupPlatform(p, username).catch(() => errProfile(p, username, ""))));
  return {
    profiles: results,
    email_intel: {
      patterns: [`${username}@gmail.com`, `${username}@protonmail.com`],
      breaches: [],
    },
  };
}

export function mockCorrelate(profiles: MockProfile[], threshold: number): MockMatch[] {
  // Only correlate platforms where we have real data
  const real = profiles.filter((p) => p.status === "FOUND");
  const out: MockMatch[] = [];
  for (let i = 0; i < real.length; i++) {
    for (let j = i + 1; j < real.length; j++) {
      const a = real[i], b = real[j];
      const usernameSim = a.username.toLowerCase() === b.username.toLowerCase()
        ? 100 : Math.max(0, 100 - levenshtein(a.username.toLowerCase(), b.username.toLowerCase()) * 12);
      const bioSim = !a.bio || !b.bio ? 0 : (a.bio === b.bio ? 95 : Math.min(90, 40 + (hash(a.bio + b.bio) % 40)));
      const emailSim = 0;
      const locSim = a.location && b.location && a.location === b.location ? 100
        : a.location && b.location ? 30 : 0;
      const score = Math.round(usernameSim * 0.55 + bioSim * 0.25 + emailSim * 0.1 + locSim * 0.1);
      if (score >= threshold) {
        out.push({
          platform_a: a.platform, username_a: a.username,
          platform_b: b.platform, username_b: b.username,
          score, confidence: score >= 75 ? "HIGH" : score >= 55 ? "MEDIUM" : "LOW",
          details: { username: usernameSim, bio: bioSim, email: emailSim, location: locSim },
        });
      }
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 12);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
  }
  return dp[m][n];
}

export function buildGraph(identity: string, profiles: MockProfile[], matches: MockMatch[]) {
  const visible = profiles.filter((p) => p.status === "FOUND" || p.status === "EXISTS");
  const nodes = [
    { id: `__root__`, label: identity, platform: "Identity", color: "#ff3333", size: 22, isRoot: true },
    ...visible.map((p) => ({
      id: `${p.platform}:${p.username}`,
      label: p.username,
      platform: p.platform,
      color: undefined,
      size: 14,
      display_name: p.display_name,
      bio: p.bio,
      location: p.location,
      profile_url: p.profile_url,
    })),
  ];
  const links = [
    ...visible.map((p) => ({ source: "__root__", target: `${p.platform}:${p.username}`, score: 100, confidence: "HIGH" as const })),
    ...matches.map((m) => ({
      source: `${m.platform_a}:${m.username_a}`,
      target: `${m.platform_b}:${m.username_b}`,
      score: m.score,
      confidence: m.confidence,
    })),
  ];
  return {
    nodes, links,
    stats: {
      total_nodes: nodes.length,
      correlation_edges: matches.length,
      high_confidence: matches.filter((m) => m.confidence === "HIGH").length,
      platforms: new Set(visible.map((p) => p.platform)).size,
    },
  };
}
