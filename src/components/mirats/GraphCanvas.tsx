// ============================================================================
// GraphCanvas — COMPONENT ĐỒ THỊ DÙNG CHUNG (React Flow).
//
// ĐÂY là component Prompt 6 tái dùng / mở rộng (không dựng lại).
//   - Engine duy nhất: @xyflow/react. Node là React component (theo design
//     system/tailwind), sẵn MiniMap + Controls + Background.
//   - Bố cục chọn qua prop `layout`: "force" (d3-force, cảm giác Obsidian) hoặc
//     "dagre"/"dagre-tb" (phân cấp). Dùng graph-layout.ts (không viết lại).
//   - Custom node: chip màu theo đơn vị, node ben_ngoai vẽ nét đứt + nhãn tổ chức.
//   - Custom edge: màu/nét theo dm_loai_lien_ket, mũi tên 1/2 chiều theo huong.
//   - Legend loại liên kết. Xuất ảnh PNG/SVG.
//   - Tương tác: click node -> làm mờ phần còn lại + tô sáng hàng xóm bậc N;
//     hover cạnh -> làm mờ cạnh khác + tô đậm theo trọng số. `impactIds` tô đỏ.
//
// TÍNH NĂNG THUYẾT TRÌNH (mới):
//   - Toàn màn hình + laser pointer.
//   - Gom nhóm node theo lớp/hệ thống (super-node) khi nhiều liên kết.
//   - Lưu / khôi phục khung nhìn (zoom + vị trí) qua localStorage.
//   - Thanh công cụ nổi gộp mọi điều khiển (kèm `extraControls`).
//
// Logic thuần nằm ở graph-core.ts / graph-layout.ts; component này chỉ lo render.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BaseEdge,
  getBezierPath,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
// html-to-image is lazy-loaded on export (GĐ1-06 perf)
import {
  Download, ImageDown, Maximize2, Minimize2, Crosshair, Save,
  RotateCcw, Boxes, Locate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  computeLayout,
  type LayoutKind,
} from "@/lib/mirats/graph-layout";
import {
  highlightNeighbors,
  chipHslTheoKhoa,
  type CoreGraph,
} from "@/lib/mirats/graph-core";

// ---- Custom node ------------------------------------------------------------

interface GraphNodeData extends Record<string, unknown> {
  label: string;
  nhom?: string | null;
  don_vi?: string | null;
  benNgoai?: boolean;
  toChuc?: string | null;
  chipColor?: string | null;
  dim?: boolean;
  selected?: boolean;
  impacted?: boolean;
  laCum?: boolean;
  soThanhVien?: number;
}

function GraphNodeCard({ data }: NodeProps) {
  const d = data as GraphNodeData;
  return (
    <div
      className={cn(
        "min-w-[120px] max-w-[200px] rounded-lg border-2 bg-card px-3 py-2 text-center shadow-sm transition-all",
        d.benNgoai ? "border-dashed" : "",
        d.laCum ? "bg-muted/60" : "",
        d.selected
          ? "border-primary ring-2 ring-primary/40"
          : d.impacted
            ? "border-destructive ring-2 ring-destructive/40"
            : "border-border",
        d.dim ? "opacity-20" : "opacity-100",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <div className="flex items-center justify-center gap-1.5">
        {d.laCum ? (
          <Boxes className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : d.chipColor ? (
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.chipColor }} />
        ) : null}
        <span className="truncate text-sm font-semibold">{d.label}</span>
      </div>
      {d.laCum ? (
        <div className="truncate text-meta text-muted-foreground">{d.soThanhVien ?? 0} hệ thống</div>
      ) : (
        <>
          {d.don_vi && <div className="truncate text-meta text-muted-foreground">{d.don_vi}</div>}
          {d.benNgoai && d.toChuc && (
            <div className="truncate text-meta italic text-muted-foreground">⧉ {d.toChuc}</div>
          )}
        </>
      )}
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />
    </div>
  );
}

// ---- Custom edge ------------------------------------------------------------

interface GraphEdgeData extends Record<string, unknown> {
  color: string;
  dash?: string;
  width: number;
  animated?: boolean;
  dim?: boolean;
  impacted?: boolean;
  hovered?: boolean;
  trongSo?: number;
}

function LienKetEdge(props: EdgeProps) {
  const {
    id, sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition, markerEnd, markerStart, data,
  } = props;
  const d = (data ?? {}) as GraphEdgeData;
  const [path] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });
  const stroke = d.impacted ? "hsl(var(--destructive))" : d.color;
  const width = d.hovered ? Math.max(d.width * 1.9, 3.5) : d.impacted ? Math.max(d.width, 2.5) : d.width;
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      markerStart={markerStart}
      style={{
        stroke,
        strokeWidth: width,
        strokeDasharray: d.dash,
        opacity: d.dim ? 0.08 : 1,
        filter: d.hovered ? "drop-shadow(0 0 4px currentColor)" : undefined,
        transition: "opacity 150ms, stroke-width 150ms",
      }}
    />
  );
}

const nodeTypes = { he_thong: GraphNodeCard };
const edgeTypes = { lien_ket: LienKetEdge };

// ---- Gom nhóm theo lớp/hệ thống (super-node) --------------------------------

/** Thu gọn graph theo khóa nhóm (nhom → don_vi → id). Cạnh nội nhóm bị bỏ,
 *  cạnh liên nhóm gộp lại với trong_so = số cạnh gốc. */
function groupGraph(graph: CoreGraph): CoreGraph {
  const rep = new Map<string, string>();

  const superNodes = new Map<string, CoreGraph["nodes"][number] & { meta?: Record<string, unknown> }>();
  const keep = new Map<string, CoreGraph["nodes"][number]>();
  for (const n of graph.nodes) {
    const gk = n.nhom ?? n.don_vi;
    if (gk) {
      const sid = `grp:${gk}`;
      rep.set(n.id, sid);
      if (!superNodes.has(sid)) {
        superNodes.set(sid, {
          id: sid, ten: gk, nhom: gk, don_vi: n.don_vi,
          meta: { la_cum: true, so_thanh_vien: 0 },
        });
      }
      (superNodes.get(sid)!.meta!.so_thanh_vien as number) += 1;
    } else {
      rep.set(n.id, n.id);
      keep.set(n.id, n);
    }
  }
  const merged = new Map<string, CoreGraph["edges"][number] & { meta?: Record<string, unknown> }>();
  for (const e of graph.edges) {
    const a = rep.get(e.nguon) ?? e.nguon;
    const b = rep.get(e.dich) ?? e.dich;
    if (a === b) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const ex = merged.get(key);
    if (ex) { (ex.meta!.trong_so as number) += 1; }
    else {
      merged.set(key, {
        ...e, id: `grp-edge:${key}`, nguon: a, dich: b,
        meta: { ...(e.meta ?? {}), trong_so: 1 },
      });
    }
  }
  return { nodes: [...keep.values(), ...superNodes.values()], edges: [...merged.values()] };
}

/** Trọng số cạnh khi KHÔNG gom nhóm = số cạnh song song cùng cặp node. */
function parallelWeights(graph: CoreGraph): Map<string, number> {
  const count = new Map<string, number>();
  for (const e of graph.edges) {
    const key = e.nguon < e.dich ? `${e.nguon}|${e.dich}` : `${e.dich}|${e.nguon}`;
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  const w = new Map<string, number>();
  for (const e of graph.edges) {
    const key = e.nguon < e.dich ? `${e.nguon}|${e.dich}` : `${e.dich}|${e.nguon}`;
    w.set(e.id, count.get(key) ?? 1);
  }
  return w;
}

// ---- Legend -----------------------------------------------------------------

export interface LegendItem {
  ma: string;
  ten: string;
  mau_sac: string;
  kieu_net?: string | null;
}

function Legend({ items }: { items: LegendItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md border bg-card/90 p-2 text-xs shadow-sm backdrop-blur">
      <div className="mb-1 font-medium text-muted-foreground">Loại liên kết</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.ma} className="flex items-center gap-2">
            <svg width="26" height="8" aria-hidden>
              <line
                x1="0" y1="4" x2="26" y2="4"
                stroke={it.mau_sac}
                strokeWidth="2.5"
                strokeDasharray={
                  it.kieu_net === "dashed" ? "6 4" : it.kieu_net === "dotted" ? "2 4" : undefined
                }
              />
            </svg>
            <span>{it.ten}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- GraphCanvas ------------------------------------------------------------

export interface GraphCanvasProps {
  graph: CoreGraph;
  layout?: LayoutKind;
  /** Node đang chọn (controlled). Nếu bỏ, component tự quản lý. */
  selectedId?: string | null;
  onSelectNode?: (id: string | null) => void;
  /** Bán kính tô sáng hàng xóm khi chọn node (mặc định 1). */
  highlightRadius?: number;
  /** Tập id hệ thống bị tác động (tô đỏ). */
  impactIds?: Set<string> | null;
  height?: number;
  legendItems?: LegendItem[];
  showLegend?: boolean;
  showExport?: boolean;
  className?: string;
  /** Khóa localStorage để lưu/khôi phục khung nhìn + vị trí node. */
  storageKey?: string;
  /** Cho phép nút gom nhóm theo lớp/hệ thống. */
  groupable?: boolean;
  /** Điều khiển bổ sung (bộ lọc…) đặt trong thanh công cụ nổi. */
  extraControls?: React.ReactNode;
}

interface SavedView {
  vp?: Viewport;
  pos?: Record<string, { x: number; y: number }>;
}

function loadView(key?: string): SavedView | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedView) : null;
  } catch {
    return null;
  }
}

function GraphCanvasInner({
  graph: rawGraph,
  layout = "force",
  selectedId: controlledSel,
  onSelectNode,
  highlightRadius = 1,
  impactIds,
  height = 520,
  legendItems = [],
  showLegend = true,
  showExport = true,
  className,
  storageKey,
  groupable = false,
  extraControls,
}: GraphCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rf = useReactFlow();
  const [internalSel, setInternalSel] = useState<string | null>(null);
  const selected = controlledSel !== undefined ? controlledSel : internalSel;
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  // Thuyết trình
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [laserOn, setLaserOn] = useState(false);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserTrailRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const laserPosRef = useRef<{ x: number; y: number } | null>(null);
  const [grouped, setGrouped] = useState(false);

  // Khung nhìn đã lưu (nạp 1 lần).
  const savedRef = useRef<SavedView | null>(loadView(storageKey));

  const graph = useMemo(() => (grouped ? groupGraph(rawGraph) : rawGraph), [grouped, rawGraph]);
  const weights = useMemo(() => parallelWeights(graph), [graph]);

  const positions = useMemo(() => {
    const computed = computeLayout(graph, layout, { height });
    const saved = savedRef.current?.pos;
    if (!saved || grouped) return computed;
    // Ưu tiên vị trí đã lưu cho node còn tồn tại.
    const merged = new Map(computed);
    for (const n of graph.nodes) {
      const p = saved[n.id];
      if (p) merged.set(n.id, p);
    }
    return merged;
  }, [graph, layout, height, grouped]);

  const highlight = useMemo(
    () => (selected ? highlightNeighbors(graph, selected, highlightRadius) : null),
    [graph, selected, highlightRadius],
  );

  // Hover cạnh: chỉ tô sáng đúng cạnh + 2 đầu; làm mờ phần còn lại.
  const hoverHi = useMemo(() => {
    if (!hoveredEdge) return null;
    const e = graph.edges.find((x) => x.id === hoveredEdge);
    if (!e) return null;
    return { edges: new Set([e.id]), nodes: new Set([e.nguon, e.dich]) };
  }, [hoveredEdge, graph.edges]);

  const activeHi = hoverHi ?? highlight;

  const rfNodes = useMemo<Node[]>(() => {
    return graph.nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      const inHi = !activeHi || activeHi.nodes.has(n.id);
      const laCum = !!(n.meta as Record<string, unknown> | undefined)?.la_cum;
      return {
        id: n.id,
        type: "he_thong",
        position: pos,
        data: {
          label: n.ten,
          nhom: n.nhom,
          don_vi: n.don_vi,
          benNgoai: n.ben_ngoai,
          toChuc: n.to_chuc,
          chipColor: chipHslTheoKhoa(n.don_vi ?? n.nhom),
          selected: selected === n.id,
          impacted: impactIds?.has(n.id) ?? false,
          dim: !!activeHi && !inHi,
          laCum,
          soThanhVien: (n.meta as Record<string, unknown> | undefined)?.so_thanh_vien as number | undefined,
        } satisfies GraphNodeData,
      };
    });
  }, [graph.nodes, positions, activeHi, selected, impactIds]);

  const rfEdges = useMemo<Edge[]>(() => {
    return graph.edges.map((e) => {
      const color = e.mau_sac ?? "#6b7280";
      const inHi = !activeHi || activeHi.edges.has(e.id);
      const impacted =
        (impactIds?.has(e.nguon) ?? false) && (impactIds?.has(e.dich) ?? false);
      const dash =
        e.kieu_net === "dashed" ? "6 4" : e.kieu_net === "dotted" ? "2 4" : undefined;
      const twoWay = e.hai_chieu ?? e.huong === "hai_chieu";
      const drawStart = e.co_huong === false || (e.co_huong == null && twoWay);
      const trongSo =
        ((e.meta as Record<string, unknown> | undefined)?.trong_so as number | undefined) ??
        weights.get(e.id) ?? 1;
      const width = 1.4 + Math.min(Math.log2(trongSo + 1), 3.2) * 0.9;
      return {
        id: e.id,
        source: e.nguon,
        target: e.dich,
        type: "lien_ket",
        markerEnd: { type: MarkerType.ArrowClosed, color },
        markerStart: drawStart ? { type: MarkerType.ArrowClosed, color } : undefined,
        data: {
          color,
          dash,
          width,
          trongSo,
          animated: e.loai === "LUONG_TIN_HIEU",
          dim: !!activeHi && !inHi,
          impacted,
          hovered: hoveredEdge === e.id,
        } satisfies GraphEdgeData,
      };
    });
  }, [graph.edges, activeHi, impactIds, hoveredEdge, weights]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);
  useEffect(() => setNodes(rfNodes), [rfNodes, setNodes]);
  useEffect(() => setEdges(rfEdges), [rfEdges, setEdges]);

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const next = selected === node.id ? null : node.id;
      if (controlledSel === undefined) setInternalSel(next);
      onSelectNode?.(next);
    },
    [selected, controlledSel, onSelectNode],
  );

  const handlePaneClick = useCallback(() => {
    if (controlledSel === undefined) setInternalSel(null);
    onSelectNode?.(null);
  }, [controlledSel, onSelectNode]);

  const exportImage = useCallback(async (kind: "png" | "svg") => {
    const el = wrapperRef.current?.querySelector<HTMLElement>(".react-flow__viewport");
    const target = el ?? wrapperRef.current;
    if (!target) return;
    const opts = { cacheBust: true, backgroundColor: "transparent" as const };
    const { toPng, toSvg } = await import("html-to-image");
    const dataUrl = kind === "png" ? await toPng(target, opts) : await toSvg(target, opts);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `so-do-he-thong.${kind}`;
    a.click();
  }, []);

  // ---- Toàn màn hình --------------------------------------------------------
  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  useEffect(() => {
    const onFs = () => {
      const active = document.fullscreenElement === wrapperRef.current;
      setIsFullscreen(active);
      // Fit lại sau khi chuyển chế độ để không bị lệch.
      setTimeout(() => rf.fitView({ duration: 300, padding: 0.2 }), 120);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [rf]);

  // ---- Laser pointer --------------------------------------------------------
  const handleMouseMove = useCallback(
    (ev: React.MouseEvent) => {
      if (!laserOn) return;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      laserPosRef.current = { x, y };
      const arr = laserTrailRef.current;
      const now = performance.now();
      const last = arr[arr.length - 1];
      if (!last || (x - last.x) * (x - last.x) + (y - last.y) * (y - last.y) > 4) {
        arr.push({ x, y, t: now });
        if (arr.length > 60) arr.shift();
      }
    },
    [laserOn],
  );

  // rAF vẽ vệt laser mờ dần (nhẹ, không setState).
  useEffect(() => {
    if (!laserOn) return;
    const canvas = laserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const TRAIL_MS = 500;
    const draw = () => {
      const now = performance.now();
      const arr = laserTrailRef.current;
      // Loại điểm quá cũ
      while (arr.length && now - arr[0].t > TRAIL_MS) arr.shift();

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Vệt (đường mờ dần)
      if (arr.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 1; i < arr.length; i++) {
          const p0 = arr[i - 1];
          const p1 = arr[i];
          const age = (now - p1.t) / TRAIL_MS; // 0..1
          const a = Math.max(0, 1 - age);
          ctx.strokeStyle = `rgba(239,68,68,${0.45 * a})`;
          ctx.lineWidth = 6 * a + 1;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }

      // Chấm laser
      const p = laserPosRef.current;
      if (p) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
        g.addColorStop(0, "rgba(239,68,68,0.9)");
        g.addColorStop(0.4, "rgba(239,68,68,0.35)");
        g.addColorStop(1, "rgba(239,68,68,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgb(239,68,68)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      laserTrailRef.current = [];
      laserPosRef.current = null;
    };
  }, [laserOn]);


  // ---- Lưu / khôi phục khung nhìn ------------------------------------------
  const saveView = useCallback(() => {
    if (!storageKey) return;
    const vp = rf.getViewport();
    const pos: Record<string, { x: number; y: number }> = {};
    for (const n of rf.getNodes()) pos[n.id] = { x: n.position.x, y: n.position.y };
    const data: SavedView = { vp, pos };
    savedRef.current = data;
    try { window.localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
  }, [rf, storageKey]);

  const restoreView = useCallback(() => {
    const saved = loadView(storageKey);
    if (!saved) return;
    savedRef.current = saved;
    if (saved.pos) {
      setNodes((ns) => ns.map((n) => (saved.pos![n.id] ? { ...n, position: saved.pos![n.id] } : n)));
    }
    if (saved.vp) rf.setViewport(saved.vp, { duration: 400 });
  }, [rf, storageKey, setNodes]);

  // Auto-khôi phục viewport 1 lần khi có dữ liệu đã lưu.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || grouped) return;
    const saved = savedRef.current;
    if (saved?.vp && graph.nodes.length > 0) {
      restoredRef.current = true;
      const t = setTimeout(() => rf.setViewport(saved.vp!, { duration: 0 }), 60);
      return () => clearTimeout(t);
    }
  }, [rf, graph.nodes.length, grouped]);

  const hasSaved = !!savedRef.current;

  const iconBtn = "h-8 w-8";

  return (
    <div
      ref={wrapperRef}
      className={cn("relative bg-background", className)}
      style={{ height: isFullscreen ? "100vh" : height }}
      onMouseMove={handleMouseMove}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onEdgeMouseEnter={(_, e) => setHoveredEdge(e.id)}
        onEdgeMouseLeave={() => setHoveredEdge(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={!savedRef.current?.vp}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>

      {/* Thanh công cụ nổi (gộp mọi điều khiển) */}
      <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1 rounded-md border bg-card/95 p-1 shadow-sm backdrop-blur">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={iconBtn} onClick={() => rf.fitView({ duration: 400, padding: 0.2 })}>
              <Locate className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Canh giữa (focus)</TooltipContent>
        </Tooltip>

        {groupable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={grouped ? "default" : "ghost"}
                className={iconBtn}
                onClick={() => setGrouped((v) => !v)}
              >
                <Boxes className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{grouped ? "Bỏ gom nhóm" : "Gom nhóm theo lớp/hệ thống"}</TooltipContent>
          </Tooltip>
        )}

        {storageKey && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className={iconBtn} onClick={saveView} aria-label="Lưu">
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lưu khung nhìn</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className={iconBtn} disabled={!hasSaved} onClick={restoreView} aria-label="Hoàn tác">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Khôi phục khung nhìn</TooltipContent>
            </Tooltip>
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={laserOn ? "default" : "ghost"}
              className={iconBtn}
              onClick={() => { setLaserOn((v) => !v); laserTrailRef.current = []; laserPosRef.current = null; }}
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{laserOn ? "Tắt laser" : "Bút laser (thuyết trình)"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className={iconBtn} onClick={toggleFullscreen} aria-label="Thu nhỏ">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}</TooltipContent>
        </Tooltip>

        {extraControls && (
          <>
            <span className="mx-0.5 h-6 w-px bg-border" />
            {extraControls}
          </>
        )}
      </div>

      {showLegend && <Legend items={legendItems} />}

      {showExport && (
        <div className="absolute right-3 top-3 z-10 flex gap-1">
          <Button size="sm" variant="secondary" className="h-8 gap-1" onClick={() => exportImage("png")}>
            <ImageDown className="h-3.5 w-3.5" /> PNG
          </Button>
          <Button size="sm" variant="secondary" className="h-8 gap-1" onClick={() => exportImage("svg")}>
            <Download className="h-3.5 w-3.5" /> SVG
          </Button>
        </div>
      )}

      {/* Laser pointer overlay (canvas — trail + dot) */}
      {laserOn && (
        <canvas
          ref={laserCanvasRef}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        />
      )}
    </div>
  );
}

/** Bọc ReactFlowProvider để dùng độc lập (kể cả nhiều canvas cùng trang). */
export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
