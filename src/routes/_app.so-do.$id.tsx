import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, Panel,
  addEdge, useNodesState, useEdgesState, useReactFlow, Handle, Position, MarkerType,
  BaseEdge, getSmoothStepPath, ConnectionMode, getNodesBounds, getViewportForBounds,
  NodeResizer,
  type Node, type Edge, type Connection, type NodeTypes, type NodeProps,
  type EdgeProps, type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
// html-to-image is lazy-loaded on export (GĐ1-06 perf)
import {
  ArrowLeft, HardDrive, Network, Type, Save, Trash2, ExternalLink,
  ChevronsUpDown, Loader2, Plus, Paperclip, Upload, Download, File as FileIcon, Image as ImageIcon,
  Images, ImageOff, Spline, Check, StickyNote, Square, Circle, Diamond, Palette, Shapes,
  Link2, GitFork, Waypoints, MapPin, Activity, Boxes, Undo2, Redo2, ImageDown, LayoutGrid,
} from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { useSession } from "@/hooks/use-session";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScope } from "@/lib/mirats/scope";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InfoHint } from "@/components/mirats/InfoHint";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ThietBi, HeThong } from "@/lib/mirats/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import imgMayTinh from "@/assets/so-do/may-tinh.png";
import imgSwitch from "@/assets/so-do/switch.png";
import imgRouter from "@/assets/so-do/router.png";
import imgServer from "@/assets/so-do/server.png";
import imgUhf from "@/assets/so-do/may-uhf.png";
import imgAntenna from "@/assets/so-do/antenna.png";

export const Route = createFileRoute("/_app/so-do/$id")({
  head: () => ({ meta: [{ title: "Chỉnh sửa sơ đồ — Tài sản MIRATS" }] }),
  component: SoDoEditorPage,
});

const BUCKET = "so-do-tep";
const LIB_BUCKET = "so-do-thu-vien";
const LIB_URL_TTL = 315360000; // ~10 năm

type CardKind = "thiet_bi" | "he_thong" | "text";
type ShapeKind = "sticky" | "rect" | "ellipse" | "diamond";
type ElementKind = CardKind | ShapeKind;
type ElementData = {
  label: string;
  kind: ElementKind;
  ref: string | null;
  img?: string | null;
  color?: string | null;
  [k: string]: unknown;
};
type ElementNodeType = Node<ElementData, "element">;

const SHAPE_KINDS: ShapeKind[] = ["sticky", "rect", "ellipse", "diamond"];
const isShape = (k: ElementKind): k is ShapeKind => (SHAPE_KINDS as string[]).includes(k);

/** Bảng màu FigJam cho ghi chú dán & hình khối. */
const SHAPE_COLORS = [
  "#fde68a", "#fca5a5", "#a7f3d0", "#93c5fd", "#c4b5fd", "#f9a8d4", "#e2e8f0", "#fdba74",
];

/** Tự động bố trí node bằng dagre để tránh chồng lấn. */
function autoLayoutNodes(
  nodes: ElementNodeType[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
): ElementNodeType[] {
  if (!nodes.length) return nodes;
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) {
    const w = (n.measured?.width ?? (n.width as number | undefined) ?? 176) || 176;
    const h = (n.measured?.height ?? (n.height as number | undefined) ?? 96) || 96;
    g.setNode(n.id, { width: w, height: h });
  }
  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  }
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    if (!p) return n;
    return { ...n, position: { x: p.x - p.width / 2, y: p.y - p.height / 2 } };
  });
}

type SoDoRow = {
  id: string;
  ten: string;
  mo_ta: string | null;
  don_vi_ma: string | null;
  he_thong_ma: string | null;
  he_thong_ten: string | null;
  du_lieu: { nodes: ElementNodeType[]; edges: Edge[] } | null;
};

/* ===================== Xem trước liên kết ===================== */

type DiagramLite = { id: string; ten: string; du_lieu: { nodes: ElementNodeType[]; edges: Edge[] } | null };

type PreviewApi = {
  getDevice: (ma: string) => ThietBi | undefined;
  getSystem: (ma: string) => HeThong | undefined;
  getSystemDiagrams: (ma: string) => DiagramLite[];
};
const PreviewContext = createContext<PreviewApi | null>(null);
const usePreview = () => useContext(PreviewContext);

/** Ảnh thu nhỏ (SVG) của một sơ đồ, vẽ từ vị trí node/edge đã lưu. */
function DiagramThumb({ data, className }: { data: DiagramLite["du_lieu"]; className?: string }) {
  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  if (!nodes.length) {
    return (
      <div className={cn("grid place-items-center rounded-md border bg-muted/30 text-[10px] text-muted-foreground", className)}>
        Sơ đồ trống
      </div>
    );
  }
  const pts = nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 40;
  const w = Math.max(1, maxX - minX) + pad * 2;
  const h = Math.max(1, maxY - minY) + pad * 2;
  const pos = new Map(pts.map((p) => [p.id, { x: p.x - minX + pad, y: p.y - minY + pad }]));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("rounded-md border bg-muted/20", className)} preserveAspectRatio="xMidYMid meet">
      {edges.map((e, i) => {
        const s = pos.get(e.source);
        const t = pos.get(e.target);
        if (!s || !t) return null;
        return <line key={e.id ?? i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="var(--muted-foreground)" strokeWidth={3} opacity={0.5} />;
      })}
      {pts.map((p) => {
        const c = pos.get(p.id)!;
        return <rect key={p.id} x={c.x - 26} y={c.y - 14} width={52} height={28} rx={6} fill="var(--primary)" opacity={0.85} />;
      })}
    </svg>
  );
}

type TepRow = {
  id: string;
  so_do_id: string;
  ten_tep: string;
  duong_dan: string;
  loai: string | null;
  kich_thuoc: number | null;
  created_at: string;
};

const KIND_META: Record<CardKind, { label: string; icon: typeof HardDrive; cls: string }> = {
  thiet_bi: { label: "Tài sản", icon: HardDrive, cls: "border-primary/40 bg-primary/5" },
  he_thong: { label: "Hệ thống", icon: Network, cls: "border-blue-500/40 bg-blue-500/5" },
  text: { label: "Ghi chú", icon: Type, cls: "border-border bg-card" },
};

/** Thư viện hình khối mặc định (kèm sẵn) dùng cho các phần tử sơ đồ. */
type LibItem = { key: string; ten: string; nhom: string; url: string; kw: string[] };
const DEFAULT_LIB: LibItem[] = [
  { key: "may-tinh", ten: "Máy tính", nhom: "CNTT", url: imgMayTinh, kw: ["máy tính", "may tinh", "computer", "pc", "workstation", "desktop"] },
  { key: "switch", ten: "Switch mạng", nhom: "Mạng", url: imgSwitch, kw: ["switch", "chuyển mạch", "chuyen mach"] },
  { key: "router", ten: "Router", nhom: "Mạng", url: imgRouter, kw: ["router", "định tuyến", "dinh tuyen", "modem"] },
  { key: "server", ten: "Máy chủ", nhom: "CNTT", url: imgServer, kw: ["server", "máy chủ", "may chu", "rack"] },
  { key: "may-uhf", ten: "Máy UHF", nhom: "Vô tuyến", url: imgUhf, kw: ["uhf", "vhf", "bộ đàm", "bo dam", "radio", "vô tuyến", "vo tuyen", "transceiver"] },
  { key: "antenna", ten: "Anten", nhom: "Vô tuyến", url: imgAntenna, kw: ["anten", "antenna", "tháp", "thap", "mast", "phát sóng"] },
];

/** Gợi ý hình mặc định theo tên/chủng loại. */
function matchDefaultImg(text: string): string | null {
  const s = text.toLowerCase();
  for (const it of DEFAULT_LIB) if (it.kw.some((k) => s.includes(k))) return it.url;
  return null;
}

/** Ô nhập nhãn tại chỗ (double-click để sửa như FigJam). */
function useInlineLabel(id: string, label: string) {
  const rf = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const start = () => { setDraft(label); setEditing(true); };
  const commit = () => {
    setEditing(false);
    rf.setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: draft } } : n)),
    );
  };
  return { editing, draft, setDraft, start, commit };
}

/** Node tuỳ biến: hiển thị thẻ tài sản/hệ thống/ghi chú hoặc hình khối FigJam. */
function ElementNode({ id, data, selected }: NodeProps<ElementNodeType>) {
  const nav = useNavigate();
  const { editing, draft, setDraft, start, commit } = useInlineLabel(id, data.label);

  if (isShape(data.kind)) {
    return (
      <ShapeNode
        kind={data.kind}
        label={data.label}
        color={data.color ?? SHAPE_COLORS[0]}
        selected={!!selected}
        editing={editing}
        draft={draft}
        setDraft={setDraft}
        start={start}
        commit={commit}
      />
    );
  }

  const meta = KIND_META[data.kind as CardKind];
  const Icon = meta.icon;
  const linkable = data.kind !== "text" && !!data.ref;

  const open = () => {
    if (data.kind === "thiet_bi" && data.ref) {
      nav({ to: "/thiet-bi/$maThietBi", params: { maThietBi: data.ref } });
    } else if (data.kind === "he_thong") {
      nav({ to: "/he-thong/cay" });
    }
  };

  const card = (
    <div
      className={cn(
        "min-w-[160px] max-w-[240px] rounded-lg border-2 px-3 py-2 shadow-sm transition-shadow",
        meta.cls,
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
    >
      <NodeHandles />
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {meta.label}
      </div>
      {data.img && (
        <img
          src={data.img}
          alt={data.label}
          loading="lazy"
          className="mx-auto mt-1.5 h-20 w-full rounded-md object-contain"
        />
      )}
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } }}
          className="nodrag mt-1 w-full resize-none rounded border border-primary/40 bg-background p-1 text-sm outline-none"
          rows={2}
        />
      ) : (
        <div
          className="mt-1 cursor-text break-words text-sm font-medium text-foreground"
          onDoubleClick={start}
        >
          {data.label}
        </div>
      )}
      {linkable && (
        <button
          type="button"
          onClick={open}
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Mở
        </button>
      )}
    </div>
  );

  if (!linkable) return card;

  return (
    <LinkPreview kind={data.kind as CardKind} refId={data.ref!} onOpen={open}>
      {card}
    </LinkPreview>
  );
}

/** Thẻ xem trước liên kết: thông tin tài sản/hệ thống + ảnh thu nhỏ sơ đồ liên quan. */
function LinkPreview({
  kind, refId, onOpen, children,
}: {
  kind: CardKind;
  refId: string;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  const api = usePreview();
  const device = kind === "thiet_bi" ? api?.getDevice(refId) : undefined;
  const system = kind === "he_thong" ? api?.getSystem(refId) : undefined;
  const diagrams = kind === "he_thong" && api ? api.getSystemDiagrams(refId) : [];

  return (
    <HoverCard openDelay={220} closeDelay={80}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="top" align="center" className="w-72 p-3">
        {device && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <HardDrive className="h-4 w-4 text-primary" /> {device.ten}
            </div>
            <p className="text-xs text-muted-foreground">{device.ma_thiet_bi} · {device.loai}</p>
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
              <span className="flex items-center gap-1"><Activity className="h-3 w-3 opacity-60" /> {device.trang_thai}</span>
              <span className="flex items-center gap-1"><Boxes className="h-3 w-3 opacity-60" /> {device.tinh_trang_ky_thuat}</span>
              <span className="col-span-2 flex items-center gap-1"><MapPin className="h-3 w-3 opacity-60" /> {device.vi_tri}</span>
            </div>
          </div>
        )}
        {system && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Network className="h-4 w-4 text-blue-500" /> {system.ten}
            </div>
            <p className="text-xs text-muted-foreground">{system.ma} · {system.nhom}</p>
            <div className="flex items-center gap-3 pt-1 text-xs">
              <span className="flex items-center gap-1"><Activity className="h-3 w-3 opacity-60" /> {system.trang_thai}</span>
              <span>Đưa vào: {system.nam_dua_vao}</span>
            </div>
            {diagrams.length > 0 && (
              <div className="pt-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Sơ đồ liên kết
                </p>
                <div className="space-y-2">
                  {diagrams.slice(0, 2).map((d) => (
                    <Link key={d.id} to="/so-do/$id" params={{ id: d.id }} className="block">
                      <DiagramThumb data={d.du_lieu} className="h-24 w-full" />
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground hover:text-primary">
                        {d.ten}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!device && !system && (
          <p className="text-xs text-muted-foreground">Không tìm thấy dữ liệu liên kết.</p>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1 rounded-md border py-1 text-xs font-medium text-primary hover:bg-primary/5"
        >
          <ExternalLink className="h-3 w-3" /> Mở chi tiết
        </button>
      </HoverCardContent>
    </HoverCard>
  );
}


/** Hình khối FigJam: ghi chú dán, chữ nhật, elip, thoi — chữ sửa tại chỗ. */
function ShapeNode({
  kind, label, color, selected, editing, draft, setDraft, start, commit,
}: {
  kind: ShapeKind;
  label: string;
  color: string;
  selected: boolean;
  editing: boolean;
  draft: string;
  setDraft: (v: string) => void;
  start: () => void;
  commit: () => void;
}) {
  const ring = selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "";
  const label_ui = editing ? (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } }}
      className="nodrag h-full w-full resize-none border-none bg-transparent text-center text-sm text-slate-900 outline-none"
    />
  ) : (
    <span
      onDoubleClick={start}
      className="cursor-text break-words px-1 text-center text-sm font-medium text-slate-900"
    >
      {label}
    </span>
  );

  const resizer = (
    <NodeResizer
      isVisible={selected}
      minWidth={80}
      minHeight={60}
      lineClassName="!border-primary/60"
      handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-2 !border-background !bg-primary"
    />
  );

  if (kind === "diamond") {
    return (
      <div className={cn("relative grid h-full min-h-[96px] w-full min-w-[96px] place-items-center", ring)}>
        {resizer}
        <NodeHandles />
        <div className="absolute inset-3 rotate-45 rounded-md border-2 border-black/10 shadow-sm" style={{ background: color }} />
        <div className="relative z-10 grid place-items-center">{label_ui}</div>
      </div>
    );
  }

  const shapeCls =
    kind === "sticky"
      ? "h-full min-h-[120px] w-full min-w-[120px] rounded-md shadow-md"
      : kind === "ellipse"
        ? "h-full min-h-[80px] w-full min-w-[140px] rounded-full border-2 border-black/10 shadow-sm"
        : "h-full min-h-[80px] w-full min-w-[150px] rounded-md border-2 border-black/10 shadow-sm";

  return (
    <div
      className={cn("relative grid h-full w-full place-items-center p-3", shapeCls, ring)}
      style={{ background: color }}
    >
      {resizer}
      <NodeHandles />
      {label_ui}
    </div>
  );
}


/** Chấm nối trên cả 4 cạnh — kéo từ bất kỳ chấm nào sang chấm của khối khác để vẽ đường nối. */
function NodeHandles() {
  const sides: { pos: Position; id: string }[] = [
    { pos: Position.Top, id: "t" },
    { pos: Position.Right, id: "r" },
    { pos: Position.Bottom, id: "b" },
    { pos: Position.Left, id: "l" },
  ];
  return (
    <>
      {sides.map(({ pos, id }) => (
        <Handle
          key={id}
          id={id}
          type="source"
          position={pos}
          className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary opacity-60 transition-opacity hover:!opacity-100"
        />
      ))}
    </>
  );
}

const nodeTypes: NodeTypes = { element: ElementNode };


/* ========================= Thư viện đường nối ========================= */

type EdgeKind =
  | "cap_mang"
  | "cap_quang"
  | "cap_dien"
  | "song_vo_tuyen"
  | "cap_dong_truc"
  | "logic";

const EDGE_META: Record<
  EdgeKind,
  { label: string; color: string; width: number; dash?: string; animated?: boolean; wave?: boolean; arrow?: boolean }
> = {
  cap_mang: { label: "Cáp mạng", color: "#64748b", width: 2 },
  cap_quang: { label: "Cáp quang", color: "#06b6d4", width: 2.5, animated: true },
  cap_dien: { label: "Cáp điện", color: "#f59e0b", width: 2.75 },
  song_vo_tuyen: { label: "Sóng vô tuyến", color: "#3b82f6", width: 2, wave: true, animated: true, arrow: false },
  cap_dong_truc: { label: "Cáp đồng trục", color: "#a855f7", width: 2, dash: "7 4" },
  logic: { label: "Liên kết logic", color: "#94a3b8", width: 1.6, dash: "2 5" },
};
const EDGE_KINDS = Object.keys(EDGE_META) as EdgeKind[];

function edgeKindOf(data: unknown): EdgeKind {
  const k = (data as { kind?: EdgeKind } | undefined)?.kind;
  return k && k in EDGE_META ? k : "cap_mang";
}

function edgeTypeFor(kind: EdgeKind): "wave" | "styled" {
  return EDGE_META[kind].wave ? "wave" : "styled";
}

function makeMarker(kind: EdgeKind) {
  const m = EDGE_META[kind];
  return m.arrow === false ? undefined : { type: MarkerType.ArrowClosed, color: m.color, width: 18, height: 18 };
}

/** Đường nối thẳng dạng sóng (mô phỏng sóng vô tuyến). */
function wavePath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const amp = 6;
  const waves = Math.max(2, Math.round(len / 22));
  const steps = waves * 12;
  let d = `M ${sx} ${sy}`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const bx = sx + dx * t;
    const by = sy + dy * t;
    const env = Math.sin(Math.PI * t); // vuốt phẳng hai đầu để nối gọn
    const off = amp * env * Math.sin(t * waves * Math.PI * 2);
    d += ` L ${(bx + nx * off).toFixed(2)} ${(by + ny * off).toFixed(2)}`;
  }
  return d;
}

function StyledEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd,
}: EdgeProps) {
  const m = EDGE_META[edgeKindOf(data)];
  const [path] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 10,
  });
  const dash = m.dash ?? (m.animated ? "8 6" : undefined);
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        stroke: m.color,
        strokeWidth: m.width,
        strokeDasharray: dash,
        animation: m.animated ? "sodo-dash 0.6s linear infinite" : undefined,
      }}
    />
  );
}

function WaveEdge({ id, sourceX, sourceY, targetX, targetY, data, markerEnd }: EdgeProps) {
  const m = EDGE_META[edgeKindOf(data)];
  const path = wavePath(sourceX, sourceY, targetX, targetY);
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        stroke: m.color,
        strokeWidth: m.width,
        fill: "none",
        strokeDasharray: m.animated ? "6 6" : undefined,
        animation: m.animated ? "sodo-dash 0.8s linear infinite" : undefined,
      }}
    />
  );
}

const edgeTypes: EdgeTypes = { styled: StyledEdge, wave: WaveEdge };



function SoDoEditorPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const isMobile = useIsMobile();

  const q = useQuery({
    queryKey: ["so_do_he_thong", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("so_do_he_thong")
        .select("id,ten,mo_ta,don_vi_ma,he_thong_ma,he_thong_ten,du_lieu")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as SoDoRow | null) ?? null;
    },
  });

  if (isMobile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Network className="h-8 w-8 opacity-60" />
          <p className="font-medium text-foreground">Trình vẽ sơ đồ cần màn hình lớn</p>
          <p className="max-w-sm text-sm">
            Sơ đồ hệ thống dùng thao tác kéo–thả và khung nhìn rộng, nên chỉ dùng được trên máy tính bảng hoặc máy tính. Vui lòng mở trên màn hình lớn hơn để chỉnh sửa.
          </p>
          <Button asChild variant="outline"><Link to="/so-do"><ArrowLeft className="mr-2 h-4 w-4" /> Về danh sách</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (q.isLoading) {
    return <Skeleton className="h-[70vh] w-full" />;
  }
  if (!q.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <p>Không tìm thấy sơ đồ hoặc bạn không có quyền truy cập.</p>
          <Button asChild variant="outline"><Link to="/so-do"><ArrowLeft className="mr-2 h-4 w-4" /> Về danh sách</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ReactFlowProvider>
      <Editor row={q.data} onSaved={() => qc.invalidateQueries({ queryKey: ["so_do_he_thong"] })} />
    </ReactFlowProvider>
  );
}

function Editor({ row, onSaved }: { row: SoDoRow; onSaved: () => void }) {
  const scope = useScope();
  const [nodes, setNodes, onNodesChange] = useNodesState<ElementNodeType>(
    (row.du_lieu?.nodes ?? []) as ElementNodeType[],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(row.du_lieu?.edges ?? []);
  const [edgeKind, setEdgeKind] = useState<EdgeKind>("cap_mang");
  const idc = useRef(nodes.length + 1);
  const rf = useReactFlow();

  /* ----- Hoàn tác / Làm lại ----- */
  type Snap = { nodes: ElementNodeType[]; edges: Edge[] };
  const past = useRef<Snap[]>([]);
  const future = useRef<Snap[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const snapshot = useCallback(() => {
    past.current.push({ nodes, edges });
    if (past.current.length > 60) past.current.shift();
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push({ nodes, edges });
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push({ nodes, edges });
    setNodes(next.nodes);
    setEdges(next.edges);
    setCanRedo(future.current.length > 0);
    setCanUndo(true);
  }, [nodes, edges, setNodes, setEdges]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /* ----- Xuất sơ đồ ra ảnh PNG ----- */
  const exportPng = useCallback(async () => {
    if (!nodes.length) { toast.info("Sơ đồ trống, chưa có gì để xuất"); return; }
    const bounds = getNodesBounds(nodes);
    const pad = 48;
    const imageWidth = Math.min(4096, Math.max(640, Math.ceil(bounds.width) + pad * 2));
    const imageHeight = Math.min(4096, Math.max(480, Math.ceil(bounds.height) + pad * 2));
    const vp = getViewportForBounds(bounds, imageWidth, imageHeight, 0.2, 2, 0.1);
    const el = document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!el) { toast.error("Không tìm thấy khung sơ đồ"); return; }
    const { toPng } = await import("html-to-image");
    toPng(el, {
      backgroundColor: "#ffffff",
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 2,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
      },
    })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.download = `${(row.ten || "so-do").replace(/[^\w\-]+/g, "_")}.png`;
        a.href = dataUrl;
        a.click();
        toast.success("Đã xuất ảnh sơ đồ");
      })
      .catch(() => toast.error("Không xuất được ảnh"));
  }, [nodes, row.ten]);

  /* ----- Tự động bố trí node ----- */
  const autoLayout = useCallback(
    (dir: "TB" | "LR") => {
      if (!nodes.length) { toast.info("Sơ đồ trống"); return; }
      snapshot();
      setNodes(autoLayoutNodes(rf.getNodes() as ElementNodeType[], edges, dir));
      toast.success("Đã tự động bố trí sơ đồ");
      window.setTimeout(() => rf.fitView({ padding: 0.2, duration: 400 }), 80);
    },
    [nodes, edges, snapshot, setNodes, rf],
  );


  const onConnect = useCallback(
    (c: Connection) => {
      snapshot();
      setEdges((eds) =>
        addEdge(
          { ...c, type: edgeTypeFor(edgeKind), data: { kind: edgeKind }, markerEnd: makeMarker(edgeKind) },
          eds,
        ),
      );
    },
    [setEdges, edgeKind, snapshot],
  );

  /* ----- Xem trước liên kết: gom tài sản / hệ thống / sơ đồ liên quan ----- */
  const diagramsQ = useQuery({
    queryKey: ["so_do_he_thong", "lite-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("so_do_he_thong")
        .select("id,ten,he_thong_ma,du_lieu");
      if (error) throw error;
      return (data ?? []) as (DiagramLite & { he_thong_ma: string | null })[];
    },
    staleTime: 60_000,
  });

  const previewApi = useMemo<PreviewApi>(() => {
    const deviceMap = new Map(scope.thietBi.map((t) => [t.ma_thiet_bi, t]));
    const systemMap = new Map(scope.heThong.map((h) => [h.ma, h]));
    const diagBySystem = new Map<string, DiagramLite[]>();
    for (const d of diagramsQ.data ?? []) {
      if (!d.he_thong_ma) continue;
      const arr = diagBySystem.get(d.he_thong_ma) ?? [];
      arr.push({ id: d.id, ten: d.ten, du_lieu: d.du_lieu });
      diagBySystem.set(d.he_thong_ma, arr);
    }
    return {
      getDevice: (ma) => deviceMap.get(ma),
      getSystem: (ma) => systemMap.get(ma),
      getSystemDiagrams: (ma) => (diagBySystem.get(ma) ?? []).filter((d) => d.id !== row.id),
    };
  }, [scope.thietBi, scope.heThong, diagramsQ.data, row.id]);

  /* ----- Nối nhiều khối cùng lúc ----- */
  const makeEdge = useCallback(
    (source: string, target: string, kind: EdgeKind): Edge => ({
      id: `e_${source}_${target}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source,
      target,
      type: edgeTypeFor(kind),
      data: { kind },
      markerEnd: makeMarker(kind),
    }),
    [],
  );

  /** Nối tất cả khối đang chọn tới một khối đích. */
  const linkToTarget = useCallback(
    (targetId: string) => {
      snapshot();
      setEdges((eds) => {
        const selected = nodes.filter((n) => n.selected && n.id !== targetId);
        if (!selected.length) return eds;
        const exists = new Set(eds.map((e) => `${e.source}->${e.target}`));
        const add = selected
          .filter((n) => !exists.has(`${n.id}->${targetId}`))
          .map((n) => makeEdge(n.id, targetId, edgeKind));
        if (!add.length) { toast.info("Các khối đã được nối tới đích"); return eds; }
        toast.success(`Đã nối ${add.length} khối tới đích`);
        return [...eds, ...add];
      });
    },
    [nodes, edgeKind, makeEdge, setEdges, snapshot],
  );

  /** Nối các khối đang chọn thành chuỗi theo vị trí. */
  const linkChain = useCallback(() => {
    snapshot();
    setEdges((eds) => {
      const ordered = nodes
        .filter((n) => n.selected)
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
      if (ordered.length < 2) { toast.info("Chọn ít nhất 2 khối để nối chuỗi"); return eds; }
      const exists = new Set(eds.map((e) => `${e.source}->${e.target}`));
      const add: Edge[] = [];
      for (let i = 0; i < ordered.length - 1; i++) {
        const s = ordered[i].id, t = ordered[i + 1].id;
        if (!exists.has(`${s}->${t}`)) add.push(makeEdge(s, t, edgeKind));
      }
      if (!add.length) { toast.info("Các khối đã được nối chuỗi"); return eds; }
      toast.success(`Đã nối chuỗi ${add.length} đường`);
      return [...eds, ...add];
    });
  }, [nodes, edgeKind, makeEdge, setEdges, snapshot]);

  /** Chọn loại đường nối: đặt mặc định cho nét vẽ mới, đồng thời áp cho các đường đang chọn. */
  const applyEdgeKind = useCallback(
    (kind: EdgeKind) => {
      setEdgeKind(kind);
      setEdges((eds) => {
        if (!eds.some((e) => e.selected)) return eds;
        snapshot();
        return eds.map((e) =>
          e.selected
            ? { ...e, type: edgeTypeFor(kind), data: { ...(e.data ?? {}), kind }, markerEnd: makeMarker(kind) }
            : e,
        );
      });
    },
    [setEdges, snapshot],
  );

  const addNode = useCallback(
    (kind: ElementKind, label: string, ref: string | null, img: string | null = null, color: string | null = null) => {
      snapshot();
      const n = idc.current++;
      const node: ElementNodeType = {
        id: `n${Date.now()}_${n}`,
        type: "element",
        position: { x: 140 + (n % 6) * 44, y: 110 + n * 38 },
        data: { label, kind, ref, img, color },
        selected: true,
      };
      setNodes((nds) => [...nds.map((x) => ({ ...x, selected: false })), node]);
    },
    [setNodes, snapshot],
  );

  /** Đổi màu nền cho các ghi chú dán / hình khối đang chọn. */
  const applyColor = useCallback(
    (color: string) => {
      let hit = false;
      snapshot();
      setNodes((nds) =>
        nds.map((n) => {
          if (!n.selected || !isShape(n.data.kind)) return n;
          hit = true;
          return { ...n, data: { ...n.data, color } };
        }),
      );
      if (!hit) toast.info("Hãy chọn một ghi chú dán hoặc hình khối trước khi đổi màu");
    },
    [setNodes, snapshot],
  );


  /** Gán / gỡ hình cho các khối đang được chọn. */
  const applyImage = useCallback(
    (url: string | null) => {
      let hit = false;
      snapshot();
      setNodes((nds) =>
        nds.map((n) => {
          if (!n.selected) return n;
          hit = true;
          return { ...n, data: { ...n.data, img: url } };
        }),
      );
      if (!hit) toast.info("Hãy chọn một khối trong sơ đồ trước khi gán hình");
      else toast.success(url ? "Đã gán hình cho khối" : "Đã gỡ hình khỏi khối");
    },
    [setNodes, snapshot],
  );

  const saveM = useMutation({
    mutationFn: async () => {
      const cleanNodes = nodes.map((nd) => ({
        id: nd.id, type: nd.type, position: nd.position, data: nd.data,
      }));
      const cleanEdges = edges.map((e) => ({
        id: e.id, source: e.source, target: e.target,
        type: e.type, data: e.data, label: e.label, markerEnd: e.markerEnd,
      }));
      const { error } = await supabase
        .from("so_do_he_thong")
        .update({ du_lieu: { nodes: cleanNodes, edges: cleanEdges } as unknown as Record<string, never> })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã lưu sơ đồ"); onSaved(); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không lưu được"),
  });

  const selectedIds = useMemo(() => nodes.filter((n) => n.selected).map((n) => n.id), [nodes]);
  const selectedEdgeIds = useMemo(() => edges.filter((e) => e.selected).map((e) => e.id), [edges]);
  const hasSelection = selectedIds.length > 0 || selectedEdgeIds.length > 0;

  const deleteSelection = () => {
    if (!hasSelection) return;
    snapshot();
    if (selectedIds.length) {
      setNodes((nds) => nds.filter((n) => !n.selected));
      setEdges((eds) => eds.filter((e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target)));
    }
    if (selectedEdgeIds.length) setEdges((eds) => eds.filter((e) => !e.selected));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/so-do"><ArrowLeft className="mr-1 h-4 w-4" /> Danh sách</Link>
        </Button>
        <div className="mr-auto flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-semibold">{row.ten}</h1>
          {row.he_thong_ten && (
            <Link to="/he-thong/cay">
              <Badge variant="secondary" className="gap-1 font-normal hover:bg-secondary/70">
                <Network className="h-3 w-3" />
                <span className="max-w-[180px] truncate">{row.he_thong_ten}</span>
              </Badge>
            </Link>
          )}
          <InfoHint>
            Kéo thả để di chuyển node. Ctrl+Z / Ctrl+Shift+Z để hoàn tác / làm lại. Nối cạnh bằng cách kéo từ điểm neo bên cạnh node.
          </InfoHint>
        </div>

        <Button variant="outline" size="icon" className="h-9 w-9" onClick={undo} disabled={!canUndo} title="Hoàn tác (Ctrl+Z)" aria-label="Undo2">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={redo} disabled={!canRedo} title="Làm lại (Ctrl+Shift+Z)" aria-label="Redo2">
          <Redo2 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" title="Tự động bố trí node">
              <LayoutGrid className="mr-1 h-4 w-4" /> Bố trí
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="end">
            <button
              type="button"
              onClick={() => autoLayout("TB")}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <LayoutGrid className="h-4 w-4 opacity-70" /> Dọc (trên → dưới)
            </button>
            <button
              type="button"
              onClick={() => autoLayout("LR")}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <LayoutGrid className="h-4 w-4 rotate-90 opacity-70" /> Ngang (trái → phải)
            </button>
          </PopoverContent>
        </Popover>
        <AttachmentsButton soDoId={row.id} />
        <LibraryButton onPick={applyImage} />
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <Button variant="outline" size="sm" onClick={exportPng} title="Xuất sơ đồ ra ảnh PNG">
          <ImageDown className="mr-1 h-4 w-4" /> Xuất ảnh
        </Button>
        <Button variant="outline" size="sm" onClick={deleteSelection} disabled={!hasSelection}>
          <Trash2 className="mr-1 h-4 w-4" /> Xoá
        </Button>
        <Button size="sm" onClick={() => saveM.mutate()} disabled={saveM.isPending}>
          {saveM.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Lưu
        </Button>
      </div>

      <div className="h-[calc(100dvh-220px)] min-h-[480px] w-full overflow-hidden rounded-xl border bg-muted/20">

        <PreviewContext.Provider value={previewApi}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={() => snapshot()}
            onSelectionDragStart={() => snapshot()}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            connectionMode={ConnectionMode.Loose}
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background gap={16} />
            <Controls />
            <MiniMap pannable zoomable className="!bg-card" />
            <Panel position="bottom-center">
              <FigJamToolbar
                edgeKind={edgeKind}
                onEdgeKind={applyEdgeKind}
                onColor={applyColor}
                onAddShape={(k) =>
                  addNode(
                    k,
                    k === "sticky" ? "Ghi chú" : "",
                    null,
                    null,
                    SHAPE_COLORS[k === "sticky" ? 0 : 6],
                  )
                }
                onAddText={() => addNode("text", "Ghi chú mới", null)}
                onAddDevice={(v, l) => {
                  const tb = scope.thietBi.find((t) => t.ma_thiet_bi === v);
                  const nm = l.split(" · ")[1] ?? v;
                  addNode("thiet_bi", nm, v, matchDefaultImg(`${nm} ${tb?.loai ?? ""}`));
                }}
                onAddSystem={(v, l) => addNode("he_thong", l.split(" · ")[1] ?? v, v, matchDefaultImg(l))}
                devices={scope.thietBi.map((t) => ({ value: t.ma_thiet_bi, label: `${t.ma_thiet_bi} · ${t.ten}` }))}
                systems={scope.heThong.map((h) => ({ value: h.ma, label: `${h.ma} · ${h.ten}` }))}
                selectedNodes={nodes
                  .filter((n) => n.selected)
                  .map((n) => ({ id: n.id, label: n.data.label || "(không tên)" }))}
                onLinkToTarget={linkToTarget}
                onLinkChain={linkChain}
              />
            </Panel>
          </ReactFlow>
        </PreviewContext.Provider>
      </div>



      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border bg-card/50 px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground">Chú giải đường nối:</span>
        {EDGE_KINDS.map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg width="26" height="10" className="shrink-0">
              <line
                x1="1" y1="5" x2="25" y2="5"
                stroke={EDGE_META[k].color}
                strokeWidth={EDGE_META[k].width}
                strokeDasharray={EDGE_META[k].dash}
              />
            </svg>
            {EDGE_META[k].label}
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Chọn “Loại đường nối” rồi kéo từ chấm nối ở bất kỳ cạnh nào của một phần tử sang chấm nối của phần tử khác để vẽ đường.
        Muốn đổi kiểu một đường có sẵn: chọn đường đó rồi bấm lại “Loại đường nối”.
        Chọn một khối rồi mở “Thư viện hình” để gán hình minh hoạ (máy tính, switch, máy UHF…) hoặc tải hình mới. Nhớ bấm Lưu.
      </p>
    </div>
  );
}

function formatSize(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentsButton({ soDoId }: { soDoId: string }) {
  const qc = useQueryClient();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qkey = ["so_do_tep", soDoId];

  const tepQ = useQuery({
    queryKey: qkey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("so_do_tep_dinh_kem")
        .select("id,so_do_id,ten_tep,duong_dan,loai,kich_thuoc,created_at")
        .eq("so_do_id", soDoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TepRow[];
    },
  });

  const count = tepQ.data?.length ?? 0;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${soDoId}/${Date.now()}_${safe}`;
        const up = await storage.from(BUCKET).upload(path, file, { upsert: false });
        if (up.error) throw up.error;
        const ins = await supabase.from("so_do_tep_dinh_kem").insert({
          so_do_id: soDoId,
          ten_tep: file.name,
          duong_dan: path,
          loai: file.type || null,
          kich_thuoc: file.size,
          created_by: user.id,
        });
        if (ins.error) {
          await storage.from(BUCKET).remove([path]);
          throw ins.error;
        }
      }
      toast.success("Đã tải lên tệp đính kèm");
      qc.invalidateQueries({ queryKey: qkey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải lên được");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openFile = async (t: TepRow) => {
    const { data, error } = await storage.from(BUCKET).createSignedUrl(t.duong_dan, 3600);
    if (error || !data) { toast.error("Không mở được tệp"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const deleteM = useMutation({
    mutationFn: async (t: TepRow) => {
      await storage.from(BUCKET).remove([t.duong_dan]);
      const { error } = await supabase.from("so_do_tep_dinh_kem").delete().eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qkey }); toast.success("Đã xoá tệp"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không xoá được"),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Paperclip className="mr-1 h-4 w-4" /> Đính kèm
          {count > 0 && <Badge variant="secondary" className="ml-1.5 px-1.5">{count}</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tệp đính kèm</SheetTitle>
          <SheetDescription>Đính kèm bản vẽ dạng file (ảnh, PDF, draw.io, tài liệu…) cho sơ đồ này.</SheetDescription>
        </SheetHeader>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button className="mt-4" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Tải lên tệp
        </Button>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {tepQ.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : count === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có tệp đính kèm.</p>
          ) : (
            (tepQ.data ?? []).map((t) => {
              const isImg = (t.loai ?? "").startsWith("image/");
              const Icon = isImg ? ImageIcon : FileIcon;
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => openFile(t)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-medium hover:underline">{t.ten_tep}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatSize(t.kich_thuoc)} · {new Date(t.created_at).toLocaleDateString("vi-VN")}
                    </div>
                  </button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openFile(t)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Xoá">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xoá tệp “{t.ten_tep}”?</AlertDialogTitle>
                        <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteM.mutate(t)}>Xoá</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type ThuVienRow = { id: string; ten: string; nhom: string | null; duong_dan: string; created_by: string; created_at: string };

/** Thư viện hình khối: hình có sẵn + hình do người dùng tải lên, gán cho khối đang chọn. */
function LibraryButton({ onPick }: { onPick: (url: string | null) => void }) {
  const qc = useQueryClient();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qkey = ["so_do_thu_vien"];

  const libQ = useQuery({
    queryKey: qkey,
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("so_do_thu_vien_hinh")
        .select("id,ten,nhom,duong_dan,created_by,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as ThuVienRow[];
      if (rows.length === 0) return [] as (ThuVienRow & { url: string })[];
      const { data: signed } = await storage
        .from(LIB_BUCKET)
        .createSignedUrls(rows.map((r) => r.duong_dan), LIB_URL_TTL);
      const map = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
      return rows.map((r) => ({ ...r, url: map.get(r.duong_dan) ?? "" }));
    },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) { toast.error(`"${file.name}" không phải hình ảnh`); continue; }
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${user.id}/${Date.now()}_${safe}`;
        const up = await storage.from(LIB_BUCKET).upload(path, file, { upsert: false });
        if (up.error) throw up.error;
        const ins = await supabase.from("so_do_thu_vien_hinh").insert({
          ten: file.name.replace(/\.[^.]+$/, ""),
          nhom: "Tải lên",
          duong_dan: path,
          created_by: user.id,
        });
        if (ins.error) { await storage.from(LIB_BUCKET).remove([path]); throw ins.error; }
      }
      toast.success("Đã tải hình lên thư viện");
      qc.invalidateQueries({ queryKey: qkey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải lên được");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const deleteM = useMutation({
    mutationFn: async (r: ThuVienRow) => {
      await storage.from(LIB_BUCKET).remove([r.duong_dan]);
      const { error } = await supabase.from("so_do_thu_vien_hinh").delete().eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qkey }); toast.success("Đã xoá hình"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không xoá được"),
  });

  const uploaded = libQ.data ?? [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Images className="mr-1 h-4 w-4" /> Thư viện hình
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Thư viện hình khối</SheetTitle>
          <SheetDescription>
            Chọn một khối trong sơ đồ, rồi bấm vào hình để gán. Có thể tải thêm hình của riêng bạn.
          </SheetDescription>
        </SheetHeader>

        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Tải hình lên
          </Button>
          <Button variant="outline" onClick={() => onPick(null)}>
            <ImageOff className="mr-2 h-4 w-4" /> Gỡ hình
          </Button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hình có sẵn</p>
          <div className="grid grid-cols-3 gap-2">
            {DEFAULT_LIB.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => onPick(it.url)}
                className="flex flex-col items-center gap-1 rounded-lg border p-2 hover:border-primary hover:bg-primary/5"
              >
                <img src={it.url} alt={it.ten} loading="lazy" className="h-14 w-14 object-contain" />
                <span className="line-clamp-1 text-center text-[11px] text-muted-foreground">{it.ten}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hình tải lên</p>
          {libQ.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : uploaded.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Chưa có hình tải lên.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {uploaded.map((r) => (
                <div
                  key={r.id}
                  className="group relative flex flex-col items-center gap-1 rounded-lg border p-2 hover:border-primary hover:bg-primary/5"
                >
                  <button
                    type="button"
                    onClick={() => r.url && onPick(r.url)}
                    className="flex flex-col items-center gap-1"
                  >
                    <img src={r.url} alt={r.ten} loading="lazy" className="h-14 w-14 object-contain" />
                    <span className="line-clamp-1 text-center text-[11px] text-muted-foreground">{r.ten}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteM.mutate(r)}
                    className="absolute right-1 top-1 rounded bg-background/80 p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label="Xoá hình"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Chọn loại đường nối (cáp mạng, cáp quang, sóng vô tuyến…). */
function EdgeKindPicker({ value, onPick }: { value: EdgeKind; onPick: (k: EdgeKind) => void }) {
  const [open, setOpen] = useState(false);
  const cur = EDGE_META[value];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Spline className="mr-1 h-4 w-4" style={{ color: cur.color }} />
          <span className="max-w-[120px] truncate">{cur.label}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-1.5" align="start">
        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Loại đường nối
        </p>
        {EDGE_KINDS.map((k) => {
          const m = EDGE_META[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => { onPick(k); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                k === value && "bg-accent",
              )}
            >
              <svg width="30" height="12" className="shrink-0">
                <line
                  x1="1" y1="6" x2="29" y2="6"
                  stroke={m.color}
                  strokeWidth={m.width}
                  strokeDasharray={m.dash}
                />
              </svg>
              <span className="flex-1">{m.label}</span>
              {k === value && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ===================== Thanh công cụ kiểu FigJam ===================== */

type ToolItem = { value: string; label: string };

function ToolDivider() {
  return <div className="mx-0.5 h-6 w-px bg-border" />;
}

function ToolButton({
  icon: Icon, title, onClick,
}: { icon: typeof HardDrive; title: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" title={title} onClick={onClick} aria-label="Icon">
      <Icon className="h-4 w-4" />
    </Button>
  );
}

/** Nút icon mở danh sách tìm kiếm (tài sản / hệ thống). */
function ToolPicker({
  icon: Icon, title, items, onPick,
}: {
  icon: typeof HardDrive;
  title: string;
  items: ToolItem[];
  onPick: (value: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title={title} aria-label="Icon">
          <Icon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" side="top" align="center">
        <Command>
          <CommandInput placeholder={`Tìm ${title.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup heading={title}>
              {items.map((it) => (
                <CommandItem
                  key={it.value}
                  value={it.label}
                  onSelect={() => { onPick(it.value, it.label); setOpen(false); }}
                >
                  <Plus className="mr-2 h-3.5 w-3.5 opacity-60" />
                  <span className="truncate">{it.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const SHAPE_OPTS: { kind: ShapeKind; icon: typeof HardDrive; label: string }[] = [
  { kind: "rect", icon: Square, label: "Chữ nhật" },
  { kind: "ellipse", icon: Circle, label: "Elip" },
  { kind: "diamond", icon: Diamond, label: "Hình thoi" },
];

function ShapesPicker({ onAdd }: { onAdd: (k: ShapeKind) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Hình khối" aria-label="Shapes">
          <Shapes className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1.5" side="top" align="center">
        <div className="flex gap-1">
          {SHAPE_OPTS.map((o) => (
            <Button
              key={o.kind}
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title={o.label}
              onClick={() => { onAdd(o.kind); setOpen(false); }}
            >
              <o.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ColorPicker({ onPick }: { onPick: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Màu nền khối đang chọn" aria-label="Palette">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="center">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Màu nền</p>
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onPick(c); setOpen(false); }}
              className="h-7 w-7 rounded-md border border-black/10 transition-transform hover:scale-110"
              style={{ background: c }}
              aria-label={`Màu ${c}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Nối nhiều khối: chọn 2+ khối rồi nối chùm tới 1 đích hoặc nối chuỗi. */
function MultiLinkButton({
  selectedNodes, onLinkToTarget, onLinkChain,
}: {
  selectedNodes: { id: string; label: string }[];
  onLinkToTarget: (targetId: string) => void;
  onLinkChain: () => void;
}) {
  const [open, setOpen] = useState(false);
  const enabled = selectedNodes.length >= 2;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title={enabled ? "Nối nhiều khối đã chọn" : "Chọn ít nhất 2 khối để nối"}
          disabled={!enabled} aria-label="GitFork">
          <GitFork className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" side="top" align="center">
        <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Nối {selectedNodes.length} khối đã chọn
        </p>
        <button
          type="button"
          onClick={() => { onLinkChain(); setOpen(false); }}
          className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
        >
          <Waypoints className="h-4 w-4 opacity-70" />
          <span>Nối chuỗi theo vị trí</span>
        </button>
        <p className="mb-1 mt-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Nối chùm tới đích
        </p>
        <div className="max-h-52 space-y-0.5 overflow-y-auto">
          {selectedNodes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => { onLinkToTarget(n.id); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <Link2 className="h-3.5 w-3.5 opacity-70" />
              <span className="truncate">{n.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FigJamToolbar({
  edgeKind, onEdgeKind, onColor, onAddShape, onAddText, onAddDevice, onAddSystem, devices, systems,
  selectedNodes, onLinkToTarget, onLinkChain,
}: {
  edgeKind: EdgeKind;
  onEdgeKind: (k: EdgeKind) => void;
  onColor: (c: string) => void;
  onAddShape: (k: ShapeKind) => void;
  onAddText: () => void;
  onAddDevice: (value: string, label: string) => void;
  onAddSystem: (value: string, label: string) => void;
  devices: ToolItem[];
  systems: ToolItem[];
  selectedNodes: { id: string; label: string }[];
  onLinkToTarget: (targetId: string) => void;
  onLinkChain: () => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border bg-card/95 p-1.5 shadow-lg backdrop-blur">
      <ToolPicker icon={HardDrive} title="Tài sản" items={devices} onPick={onAddDevice} />
      <ToolPicker icon={Network} title="Hệ thống" items={systems} onPick={onAddSystem} />
      <ToolDivider />
      <ToolButton icon={StickyNote} title="Ghi chú dán" onClick={() => onAddShape("sticky")} />
      <ShapesPicker onAdd={onAddShape} />
      <ToolButton icon={Type} title="Văn bản" onClick={onAddText} />
      <ColorPicker onPick={onColor} />
      <ToolDivider />
      <EdgeKindPicker value={edgeKind} onPick={onEdgeKind} />
      <MultiLinkButton
        selectedNodes={selectedNodes}
        onLinkToTarget={onLinkToTarget}
        onLinkChain={onLinkChain}
      />
    </div>
  );
}
