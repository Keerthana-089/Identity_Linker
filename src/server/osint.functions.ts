import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { mockSearch, mockCorrelate, buildGraph } from "./osint.server";

const RunInput = z.object({
  username: z.string().min(1).max(64),
  email: z.string().email().optional().or(z.literal("")),
  threshold: z.number().min(0).max(100).default(50),
  platforms: z.array(z.string()).optional(),
});

export const runInvestigation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RunInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { username, email, threshold, platforms } = data;

    // 1. create investigation
    const { data: inv, error: invErr } = await supabase
      .from("investigations")
      .insert({ user_id: userId, username, email: email || null, threshold, status: "in_progress" })
      .select().single();
    if (invErr || !inv) throw new Error(invErr?.message ?? "create failed");

    // 2. real OSINT (filtered by selected platforms if provided)
    const { profiles } = await mockSearch(
      username,
      email || undefined,
      platforms && platforms.length ? (platforms as any) : undefined,
    );
    const matches = mockCorrelate(profiles, threshold);
    const graph = buildGraph(username, profiles, matches);

    // 3. persist
    if (profiles.length) {
      await supabase.from("profiles_found").insert(
        profiles.map((p) => ({
          investigation_id: inv.id,
          platform: p.platform, username: p.username,
          display_name: p.display_name, bio: p.bio, location: p.location,
          avatar_url: p.avatar_url, profile_url: p.profile_url,
          confidence: p.status === "FOUND" ? "HIGH" : p.status === "EXISTS" ? "MEDIUM" : "LOW",
          status: p.status,
        }))
      );
    }
    if (matches.length) {
      await supabase.from("matches").insert(
        matches.map((m) => ({
          investigation_id: inv.id,
          platform_a: m.platform_a, username_a: m.username_a,
          platform_b: m.platform_b, username_b: m.username_b,
          score: m.score, confidence: m.confidence, details: m.details,
        }))
      );
    }
    await supabase.from("graph_data").insert({
      investigation_id: inv.id,
      nodes_json: graph.nodes,
      edges_json: graph.links,
      stats_json: graph.stats,
    });
    await supabase.from("investigations").update({
      status: "complete",
      profiles_count: profiles.length,
      matches_count: matches.length,
      high_confidence_count: graph.stats.high_confidence,
      updated_at: new Date().toISOString(),
    }).eq("id", inv.id);

    return { investigationId: inv.id, profiles, matches, graph };
  });
