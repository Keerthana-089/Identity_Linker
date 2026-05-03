import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { platformColor } from "@/lib/platforms";

export type GraphNode = {
  id: string; label: string; platform: string; size?: number; color?: string; isRoot?: boolean;
  display_name?: string; bio?: string; location?: string; profile_url?: string;
};
export type GraphLink = { source: string; target: string; score: number; confidence: "HIGH" | "MEDIUM" | "LOW" };

type Sim = d3.SimulationNodeDatum & GraphNode;
type SimLink = d3.SimulationLinkDatum<Sim> & { score: number; confidence: string };

export function ForceGraph({
  nodes, links, height = 520, onNodeClick,
}: { nodes: GraphNode[]; links: GraphLink[]; height?: number; onNodeClick?: (n: GraphNode) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !wrapRef.current) return;
    const width = wrapRef.current.clientWidth;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const root = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (e) => root.attr("transform", e.transform.toString()));
    svg.call(zoom as any);

    const simNodes: Sim[] = nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = links.map((l) => ({ ...l }));

    const sim = d3.forceSimulation<Sim>(simNodes)
      .force("link", d3.forceLink<Sim, SimLink>(simLinks).id((d) => d.id).distance(120).strength(0.6))
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<Sim>().radius((d) => (d.size ?? 14) + 8));

    const link = root.append("g")
      .attr("stroke-linecap", "round")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", (d) => d.confidence === "HIGH" ? "#ff3333" : d.confidence === "MEDIUM" ? "#f59e0b" : "#6e7681")
      .attr("stroke-opacity", 0.55)
      .attr("stroke-width", (d) => 1 + d.score / 40);

    const tooltip = d3.select(wrapRef.current).append("div")
      .attr("class", "absolute pointer-events-none bg-card border border-primary/40 rounded-sm px-3 py-2 font-mono text-[10px] z-10 hidden glow-primary");

    const node = root.append("g")
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .style("cursor", "pointer")
      .on("mouseenter", (e, d) => {
        tooltip.classed("hidden", false).html(
          `<div class="text-foreground font-bold">${d.label}</div>
           <div class="text-muted-foreground">${d.platform}</div>
           ${d.display_name ? `<div class="text-foreground">${d.display_name}</div>` : ""}
           ${d.location ? `<div class="text-muted-foreground">${d.location}</div>` : ""}`
        );
      })
      .on("mousemove", (e) => {
        const rect = wrapRef.current!.getBoundingClientRect();
        tooltip.style("left", `${e.clientX - rect.left + 12}px`).style("top", `${e.clientY - rect.top + 12}px`);
      })
      .on("mouseleave", () => tooltip.classed("hidden", true))
      .on("click", (_e, d) => onNodeClick?.(d));

    const drag = d3.drag<SVGGElement, Sim>()
      .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    (node as unknown as d3.Selection<SVGGElement, Sim, SVGGElement, unknown>).call(drag);

    node.append("circle")
      .attr("r", (d) => d.size ?? 14)
      .attr("fill", (d) => d.color ?? platformColor(d.platform))
      .attr("stroke", (d) => d.isRoot ? "#ff3333" : "rgba(255,255,255,0.2)")
      .attr("stroke-width", (d) => d.isRoot ? 3 : 1.5)
      .attr("filter", (d) => d.isRoot ? "drop-shadow(0 0 8px #ff3333)" : "none");

    node.append("text")
      .text((d) => d.label)
      .attr("x", 0).attr("y", (d) => (d.size ?? 14) + 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#c9d1d9")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-size", 10);

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Sim).x!)
        .attr("y1", (d) => (d.source as Sim).y!)
        .attr("x2", (d) => (d.target as Sim).x!)
        .attr("y2", (d) => (d.target as Sim).y!);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); tooltip.remove(); };
  }, [nodes, links, height, onNodeClick]);

  return (
    <div ref={wrapRef} className="relative w-full bg-background border border-border rounded-sm overflow-hidden">
      <svg ref={ref} className="w-full" style={{ height }} />
    </div>
  );
}
