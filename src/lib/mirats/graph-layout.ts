// ============================================================================
// graph-layout.ts — THUẬT TOÁN BỐ CỤC (không phụ thuộc renderer React Flow).
//
//   - "force"  : d3-force — bố cục "physics" hữu cơ (cảm giác Obsidian)
//   - "dagre"  : bố cục phân cấp trái→phải (LR)
//   - "dagre-tb": bố cục phân cấp trên→dưới (TB)
//
// Trả Map<nodeId, {x,y}> để renderer (React Flow ở Prompt 1, canvas/WebGL ở
// Prompt 6) tự đặt node. Chạy đồng bộ (tick d3-force trong vòng lặp) nên bố
// cục ổn định, không cần animation vòng đời.
// ============================================================================

import dagre from "@dagrejs/dagre";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";
import type { CoreGraph } from "./graph-core";

export type LayoutKind = "force" | "dagre" | "dagre-tb";

export type PositionMap = Map<string, { x: number; y: number }>;

export interface LayoutOptions {
  width?: number;
  height?: number;
  nodeW?: number;
  nodeH?: number;
  /** Số vòng lặp cho d3-force (mặc định 300). */
  iterations?: number;
}

/** Bố cục phân cấp bằng dagre. rankdir 'LR' (mặc định) hoặc 'TB'. */
export function layoutDagre(
  graph: CoreGraph,
  rankdir: "LR" | "TB" = "LR",
  opts: LayoutOptions = {},
): PositionMap {
  const nodeW = opts.nodeW ?? 176;
  const nodeH = opts.nodeH ?? 60;
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, nodesep: 40, ranksep: 90 });
  for (const n of graph.nodes) g.setNode(n.id, { width: nodeW, height: nodeH });
  for (const e of graph.edges) {
    if (g.hasNode(e.nguon) && g.hasNode(e.dich)) g.setEdge(e.nguon, e.dich);
  }
  dagre.layout(g);
  const map: PositionMap = new Map();
  for (const n of graph.nodes) {
    const p = g.node(n.id);
    if (p) map.set(n.id, { x: p.x - nodeW / 2, y: p.y - nodeH / 2 });
  }
  return map;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
}

/** Bố cục "physics" bằng d3-force (chạy đồng bộ). */
export function layoutForce(graph: CoreGraph, opts: LayoutOptions = {}): PositionMap {
  const width = opts.width ?? 900;
  const height = opts.height ?? 620;
  const iterations = opts.iterations ?? 300;

  const nodes: SimNode[] = graph.nodes.map((n) => ({ id: n.id }));
  const known = new Set(nodes.map((n) => n.id));
  const links = graph.edges
    .filter((e) => known.has(e.nguon) && known.has(e.dich))
    .map((e) => ({ source: e.nguon, target: e.dich }));

  const sim = forceSimulation(nodes)
    .force("charge", forceManyBody().strength(-380))
    .force(
      "link",
      forceLink(links)
        .id((d) => (d as SimNode).id)
        .distance(150)
        .strength(0.55),
    )
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(72))
    .stop();

  for (let i = 0; i < iterations; i++) sim.tick();

  const map: PositionMap = new Map();
  for (const n of nodes) {
    map.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
  }
  return map;
}

/** Chọn thuật toán theo LayoutKind. */
export function computeLayout(
  graph: CoreGraph,
  kind: LayoutKind,
  opts: LayoutOptions = {},
): PositionMap {
  switch (kind) {
    case "dagre":
      return layoutDagre(graph, "LR", opts);
    case "dagre-tb":
      return layoutDagre(graph, "TB", opts);
    case "force":
    default:
      return layoutForce(graph, opts);
  }
}
