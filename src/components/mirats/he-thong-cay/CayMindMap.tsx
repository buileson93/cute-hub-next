import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  ReactFlow, Controls, MiniMap, Panel, useReactFlow,
  useNodesState, useEdgesState,
  Handle, Position, Background, BackgroundVariant,
  type Node, type Edge, type NodeTypes, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Node as ReactFlowNode } from "@xyflow/react";
import {
  ChevronRight, ChevronDown, Network, Layers, Cpu, Search, Building2, ListTree, GitFork,
  Pencil, Check, X, Save, Loader2, Eye, MapPin, Plus, Minus, Table2, Boxes, Puzzle,
  Download, Upload, ExternalLink, FolderTree, ArrowRightLeft, ArrowUp, ArrowDown, Palette,
  History, Wrench, AlertTriangle, Package, Users, FileText, ClipboardList, BookMarked, Trash2, Info, Plug, Tags,
} from "lucide-react";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuTrigger, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useCayContext } from "./CayContext";
import type { MindKind, MindData, PlGroup, HtGroup, MoveTarget, MoveReq, MoveGroupReq, MoveDeviceReq } from "./types";
import { LEVEL_META, STATUS_TONE } from "./types";
import { parseHtSysMa, HT_KHAC } from "@/lib/mirats/phan-loai";
import { DUNG_KHAI_THAC_TEN, isRealSystemId, NONE_HT, nhMindTone } from "./utils";
import { toast } from "sonner";

const KIND_STYLE: Record<string, string> = {
  root: "border-primary/60 bg-primary/10 text-foreground",
  pl: "border-rose-500/30 bg-card/70",
  lv: "border-primary/30 bg-card/70",
  nh: "border-violet-500/30 bg-card/70",
  ht: "border-blue-500/30 bg-card/70",
  tb: "border-border bg-card/70",
  tp: "border-emerald-500/30 bg-card/70",
  vtg: "border-sky-500/30 bg-card/70",
  vt: "border-sky-500/25 bg-card/70",
};

const KIND_DOT: Record<string, string> = {
  root: "bg-primary",
  pl: "bg-rose-500",
  lv: "bg-primary",
  nh: "bg-violet-500",
  ht: "bg-blue-500",
  tb: "bg-muted-foreground",
  tp: "bg-emerald-500",
  vtg: "bg-sky-500",
  vt: "bg-sky-400",
};

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  root: Building2, pl: Boxes, lv: Layers, nh: FolderTree, ht: Network, tb: Cpu, tp: Puzzle, vtg: Plug, vt: MapPin,
};

const KIND_WIDTH: Record<string, string> = {
  root: "w-[260px]", pl: "w-[248px]", lv: "w-[248px]", nh: "w-[268px]",
  ht: "w-[320px]", tb: "w-[308px]", tp: "w-[300px]", vtg: "w-[264px]", vt: "w-[320px]",
};

const KIND_H: Record<string, number> = {
  root: 42, pl: 40, lv: 40, nh: 44, ht: 56, tb: 48, tp: 48, vtg: 44, vt: 52,
};

const KIND_W: Record<string, number> = {
  root: 260, pl: 248, lv: 248, nh: 268, ht: 320, tb: 308, tp: 300, vtg: 264, vt: 320,
};

type Raw = {
  id: string;
  kind: MindKind;
  data: MindData;
  children: Raw[];
  x?: number;
  y?: number;
  h?: number;
  center?: number;
  depth?: number;
  parent?: Raw;
};

function TruncatedNodeLabel({ label, code }: { label: string; code?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    let frameId: number;
    const update = () => {
      frameId = requestAnimationFrame(() => {
        if (!el) return;
        const isTruncated = el.scrollWidth > el.clientWidth + 1;
        setTruncated(prev => prev !== isTruncated ? isTruncated : prev);
      });
    };
    
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", update);
    };
  }, [label]);

  const text = (
    <span
      ref={ref}
      className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium"
    >
      {label}
    </span>
  );

  // Hiển thị tooltip nếu bị cắt HOẶC nếu có mã
  if (!truncated && !code) return text;
  
  const content = code ? (
    <div className="flex flex-col gap-0.5">
      <div className="font-semibold">{label}</div>
      <div className="text-[10px] opacity-80 font-mono">Mã: {code}</div>
    </div>
  ) : (
    label
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{text}</TooltipTrigger>
      <TooltipContent side="top" align="center" className="max-w-80 break-words leading-snug">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function MindNode({ data }: { data: MindData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const Icon = KIND_ICON[data.kind];

  const startInline = () => {
    if (!data.canManage || data.kind === "root") return;
    setDraft(data.label);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== data.label) data.onRename?.(v);
  };

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1 rounded-lg border px-2 py-1.5", KIND_STYLE[data.kind])} onClick={(e) => e.stopPropagation()}>
        <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
        <input
          autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="w-44 rounded border bg-background px-2 py-1 text-xs text-foreground outline-none"
        />
        <button className="rounded p-1 hover:bg-muted" onClick={commit} title="Lưu"><Check className="h-3.5 w-3.5 text-green-600" /></button>
        <button className="rounded p-1 hover:bg-muted" onClick={() => setEditing(false)} title="Huỷ"><X className="h-3.5 w-3.5" /></button>
        <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div
      onDoubleClick={(e) => { e.stopPropagation(); startInline(); }}
      className={cn(
        "group relative flex cursor-pointer items-center text-[11px] leading-none transition-mirats-fast animate-fade-in",
        UI_DENSITY.CONTROL_H,
        KIND_WIDTH[data.kind],
      )}
    >
      <div
        className={cn(
          "relative flex h-full w-full items-center gap-1.5 overflow-hidden rounded-md border border-l-2 px-2 pr-2 backdrop-blur-[1px] transition-mirats-fast hover:border-primary/60 hover:bg-muted/40",
        KIND_STYLE[data.kind],
        data.tone,
        data.dim && "opacity-20 saturate-0",
        data.active && "z-10 border-primary ring-1 ring-primary/60",
        data.hit && "z-10 border-amber-500 ring-1 ring-amber-500 animate-pulse",
      )}
    >
        <Handle type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-muted-foreground/30" />
        {data.collapsible ? (
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border text-[9px] transition-colors",
              data.expanded ? "border-primary/50 bg-primary/15 text-primary" : "border-muted-foreground/30 bg-background text-muted-foreground",
            )}
            title={data.expanded ? "Thu nhỏ" : "Mở rộng"}
            onClick={(e) => { e.stopPropagation(); data.toggle?.(); }}
          >
            {data.expanded ? <Minus className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
          </span>
        ) : (
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-sm", KIND_DOT[data.kind])} />
        )}
        <Icon className="h-3 w-3 shrink-0 opacity-60" />

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          <TruncatedNodeLabel label={data.label} code={data.code} />
        </div>
        
        {data.count !== undefined && <Badge variant="secondary" className="text-[9px] opacity-70 shrink-0">{data.count}</Badge>}
        
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
           {data.onOpenEditor && (
             <button onClick={(e) => { e.stopPropagation(); data.onOpenEditor?.(); }} className="rounded p-0.5 hover:bg-muted" title="Chi tiết">
               <Eye className="h-3 w-3" />
             </button>
           )}
            {data.onIncident && (
              <button onClick={(e) => { e.stopPropagation(); data.onIncident?.(); }} className="rounded p-0.5 hover:bg-muted" title="Sự cố">
                <AlertTriangle className="h-3 w-3 text-red-500" />
              </button>
            )}
            {data.onMaint && (
              <button onClick={(e) => { e.stopPropagation(); data.onMaint?.(); }} className="rounded p-0.5 hover:bg-muted" title="Bảo trì">
                <Wrench className="h-3 w-3 text-sky-500" />
              </button>
            )}
            {data.onRecord && (
              <button onClick={(e) => { e.stopPropagation(); data.onRecord?.(); }} className="rounded p-0.5 hover:bg-muted" title="Lý lịch tài sản">
                <History className="h-3 w-3" />
              </button>
            )}
            {data.onHistory && (
              <button onClick={(e) => { e.stopPropagation(); data.onHistory?.(); }} className="rounded p-0.5 hover:bg-muted" title="Lý lịch hệ thống">
                <History className="h-3 w-3 text-primary" />
              </button>
            )}
        </div>
        
        <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
      </div>
    </div>
  );
}
function LayerNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div className="pointer-events-none select-none rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
      {d.label}
    </div>
  );
}

const nodeTypes: NodeTypes = { mind: MindNode, layer: LayerNode };


export function CayMindMap({ 
  tree, 
  posByHt, 
  scopeText,
  canManage,
  onRename,
  onOpenEditor,
  onHistory,
  onIncident,
  onMaint,
  onRecord,
  onMoveSystem,
  onMoveGroup,
  onMoveDevice,
  plMind,
  nhMind,
  htMind,
  tbMind,
  devices,
}: { 
  tree: PlGroup[]; 
  posByHt: Map<string, any>; 
  scopeText: string;
  canManage: boolean;
  onRename: (kind: any, ma: string, ten: string) => void;
  onOpenEditor: (kind: any, ma: string) => void;
  onHistory: (htMa: string) => void;
  onIncident: (htMa: string) => void;
  onMaint: (htMa: string) => void;
  onRecord: (kind: "tb" | "tp", ma: string, ten: string) => void;
  onMoveSystem: (req: MoveReq) => void;
  onMoveGroup: (req: MoveGroupReq) => void;
  onMoveDevice: (req: MoveDeviceReq) => void;
  plMind: (id: string) => string;
  nhMind: (ma: string) => string;
  htMind: (ma: string) => string;
  tbMind: (t: any) => string;
  devices: any[];
}) {
  const { searchQuery, focus, toggleNode, expandedNodes } = useCayContext();

  let rf: any = null;
  try {
    // Safety check: useReactFlow must be used inside ReactFlowProvider
    // In HeThongCayPageWrapper we already wrap with ReactFlowProvider, 
    // but we add a try-catch for robustness.
    rf = useReactFlow();
  } catch (e) {
    console.warn("CayMindMap: useReactFlow called outside provider or during early mount");
  }
  
  const initialExpanded = useMemo(() => {
    const set = new Set(["root", "root-stopped"]);
    for (const pl of tree) {
      set.add(`pl:${pl.id}`);
      for (const lv of pl.fields) {
        if (lv.id && lv.id !== "all") set.add(`lv:${pl.id}:${lv.id}`);
        for (const nh of lv.groups) {
          set.add(`nh:${pl.id}:${nh.ma}`);
          for (const ht of nh.systems.slice(0, 3)) {
            set.add(`ht:${pl.id}:${nh.ma}:${ht.ma}`);
          }
        }
      }
    }
    return set;
  }, [tree]);

  // Seed context with initial expanded if it's currently just root
  useEffect(() => {
    if (expandedNodes.size <= 2 && initialExpanded.size > 2) {
      initialExpanded.forEach(id => {
        if (!expandedNodes.has(id)) toggleNode(id);
      });
    }
  }, [initialExpanded, expandedNodes, toggleNode]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<ReactFlowNode>([]);

  const toggle = useCallback((id: string) => {
    toggleNode(id);
  }, [toggleNode]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const justOpenedRef = useRef<string | null>(null);


  // LỖI 5: Nối focus target vào sơ đồ
  useEffect(() => {
    if (!focus) return;
    
    const path: string[] = ["root"];
    if (focus.plId) {
      const plId = `pl:${focus.plId}`;
      path.push(plId);
      if (focus.nhMa) {
        const nhId = `nh:${focus.plId}:${focus.nhMa}`;
        path.push(nhId);
        if (focus.htMa) {
          const htId = `ht:${focus.plId}:${focus.nhMa}:${focus.htMa}`;
          path.push(htId);
        }
      }
    }

    // Instead of local state, we should ideally trigger toggleNode via context, 
    // but for search-focus we can just expand locally if needed, 
    // though CayContext already seeds expandedNodes.
    path.forEach(id => toggleNode(id));

    const targetId = focus.kind === "tb" ? `tb:${focus.ma}` : 
                     focus.kind === "ht" ? `ht:${focus.plId}:${focus.nhMa}:${focus.ma}` :
                     focus.kind === "nh" ? `nh:${focus.plId}:${focus.ma}` :
                     focus.kind === "pl" ? `pl:${focus.ma}` : "root";
    
    setActiveId(targetId);

    // Zoom to node after expansion settles
    setTimeout(() => {
      const node = rfNodes.find(n => n.id === targetId);
      if (node && node.position && rf) {
        rf.fitView({ nodes: [node], duration: 800, padding: 0.5 });
      }
    }, 300);
  }, [focus, rfNodes, rf, toggleNode]);
  
  const recenter = useCallback(() => {
    if (rf) rf.fitView({ duration: 400, padding: 0.2 });
  }, [rf]);

  const { finiteNodes } = useMemo(() => {
    if (rfNodes.length === 0) return { finiteNodes: false };
    const fn = rfNodes.every(n => Number.isFinite(n.position?.x) && Number.isFinite(n.position?.y));
    return { finiteNodes: fn };
  }, [rfNodes]);

  const lastFitViewRef = useRef<number>(0);

  useEffect(() => {
    if (rfNodes.length > 0 && finiteNodes && rf) {
      const now = Date.now();
      if (now - lastFitViewRef.current < 2000) return; // Throttling fitView
      lastFitViewRef.current = now;

      const timer = setTimeout(() => {
        rf.fitView({ duration: 600, padding: 0.1 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [rfNodes.length, rf, finiteNodes]);

  // Using toggle from context now

  const moveTargets = useMemo<MoveTarget[]>(() => {
    const out: MoveTarget[] = [];
    for (const pl of tree)
      for (const lv of pl.fields)
        for (const nh of lv.groups)
          out.push({ plId: pl.id, plLabel: plMind(pl.id), lvId: "", lvLabel: "", nhKey: nh.ma, nhLabel: nhMind(nh.ma) });
    return out;
  }, [tree, plMind, nhMind]);

  const { nodes, edges } = useMemo(() => {
    // Safety guard: if tree is not yet loaded, return empty to prevent building invalid diagram
    if (!tree || tree.length === 0) return { nodes: [], edges: [] };

    const expanded = expandedNodes; // Use context state
    const COL_GAP = 96;
    const estHeight = (kind: MindKind) => KIND_H[kind] ?? 46;
    const ROW_GAP = 16;

    const stoppedPl = tree.find((pl) => pl.ten === DUNG_KHAI_THAC_TEN);
    const normalTree = tree.filter((pl) => pl.ten !== DUNG_KHAI_THAC_TEN);

    const rootRaw: Raw = {
      id: "root", kind: "root",
      data: { kind: "root", label: scopeText, count: normalTree.length, collapsible: true, expanded: expanded.has("root"), toggle: () => toggle("root") },
      children: [],
    };

    const pushSystem = (parent: Raw, ht: HtGroup, htId: string, unitMode: boolean) => {
      try {
        const htSysId = parseHtSysMa(ht.ma).sysName;
        const htPosCount = (isRealSystemId(htSysId) ? posByHt?.get(htSysId) : undefined)?.length ?? 0;
        const htRaw: Raw = {
          id: htId, kind: "ht",
          data: {
            kind: "ht", ma: ht.ma, label: htMind(ht.ma),
            count: ht.devices.length, collapsible: ht.devices.length > 0 || htPosCount > 0, expanded: expanded.has(htId),
            canManage: canManage && ht.ma !== HT_KHAC,
            toggle: () => toggle(htId), onRename: (t) => onRename("ht", ht.ma, t), onOpenEditor: () => onOpenEditor("ht", ht.ma),
            onHistory: () => onHistory(ht.ma),
            onIncident: () => onIncident(ht.ma),
            onMaint: () => onMaint(ht.ma),
            onMove: unitMode ? undefined : (toNhomId, toLvId, toNhKey, toNhTen) => {
               const sysId = parseHtSysMa(ht.ma).sysName;
               if (!isRealSystemId(sysId)) return;
               onMoveSystem({ heThongId: sysId, tenHeThong: htMind(ht.ma), toNhomId, toLvId, toNhKey, toNhTen });
            }
          },
          children: [],
        };
        parent.children.push(htRaw);
        if (!expanded.has(htId)) return;

        for (const d of ht.devices) {
          const tbId = `tb:${d.tb.ma_thiet_bi}`;
          const hasKids = d.children.length > 0;
          const tbRaw: Raw = {
            id: tbId, kind: "tb",
            data: {
              kind: "tb", ma: d.tb.ma_thiet_bi, label: tbMind(d.tb), code: d.tb.ma_thiet_bi,
              count: hasKids ? d.children.length : undefined,
              collapsible: hasKids, expanded: expanded.has(tbId), canManage,
              toggle: () => toggle(tbId), onRename: (t) => onRename("tb", d.tb.ma_thiet_bi, t), onOpenEditor: () => onOpenEditor("tb", d.tb.ma_thiet_bi),
              onRecord: () => onRecord("tb", d.tb.ma_thiet_bi, tbMind(d.tb)),
            },
            children: [],
          };
          htRaw.children.push(tbRaw);
        }
      } catch (e) {
        console.error("pushSystem error:", e);
      }
    };

    if (expanded.has("root")) {
      for (const pl of normalTree) {
        const plId = `pl:${pl.id}`;
        const unitMode = !!pl.fields[0]?.groups[0]?.passthrough;
        const nhGroups = pl.fields.flatMap(lv => lv.groups);
        const plRaw: Raw = {
          id: plId, kind: "pl",
          data: {
            kind: "pl", ma: pl.id, label: unitMode ? pl.ten : plMind(pl.id),
            count: unitMode ? nhGroups[0]?.systems.length : nhGroups.length,
            collapsible: true, expanded: expanded.has(plId), toggle: () => toggle(plId),
            canManage: canManage && !unitMode, onRename: (t) => onRename("pl", pl.id, t), onOpenEditor: () => onOpenEditor("pl", pl.id)
          },
          children: [],
        };
        rootRaw.children.push(plRaw);
        if (expanded.has(plId)) {
          for (const nh of nhGroups) {
            const nhId = `nh:${pl.id}:${nh.ma}`;
            const nhRaw: Raw = {
              id: nhId, kind: "nh",
              data: {
                kind: "nh", ma: nh.ma, label: nhMind(nh.ma), count: nh.systems.length,
                tone: nhMindTone(nh.mau), collapsible: nh.systems.length > 0, expanded: expanded.has(nhId),
                toggle: () => toggle(nhId), onRename: (t) => onRename("nh", nh.ma, t), onOpenEditor: () => onOpenEditor("nh", nh.ma)
              },
              children: [],
            };
            plRaw.children.push(nhRaw);
            if (expanded.has(nhId)) {
              for (const ht of nh.systems) pushSystem(nhRaw, ht, `ht:${pl.id}:${nh.ma}:${ht.ma}`, false);
            }
          }
        }
      }
    }

    const stoppedPlRaw: Raw = {
       id: "root-stopped", kind: "root",
       data: { kind: "root", label: stoppedPl ? stoppedPl.ten : DUNG_KHAI_THAC_TEN, count: stoppedPl?.fields[0].groups[0].systems.length, collapsible: true, expanded: expanded.has("root-stopped"), toggle: () => toggle("root-stopped") },
       children: []
    };
    if (stoppedPl && expanded.has("root-stopped")) {
       for (const ht of stoppedPl.fields[0].groups[0].systems) {
         pushSystem(stoppedPlRaw, ht, `ht:stopped:${ht.ma}`, false);
       }
    }

    const allRaw: Raw[] = [];
    let cursor = 0;
    const shiftSubtree = (n: Raw, dy: number) => {
      n.y = (n.y ?? 0) + dy;
      n.center = (n.center ?? 0) + dy;
      for (const c of n.children) shiftSubtree(c, dy);
    };
    
    const place = (n: Raw, depth: number, parent?: Raw) => {
      n.depth = depth;
      n.parent = parent;
      n.h = estHeight(n.kind);
      allRaw.push(n);
      if (n.children.length === 0) {
        n.y = cursor;
        n.center = cursor + n.h / 2;
        cursor += n.h + ROW_GAP;
        return;
      }
      const top = cursor;
      for (const c of n.children) place(c, depth + 1, n);
      const firstMid = n.children[0].center ?? 0;
      const lastMid = n.children[n.children.length - 1].center ?? 0;
      let center = (firstMid + lastMid) / 2;
      const parentTop = center - n.h / 2;
      if (parentTop < top) {
        const dy = top - parentTop;
        for (const c of n.children) shiftSubtree(c, dy);
        cursor += dy;
        center += dy;
      }
      n.center = center;
      n.y = center - n.h / 2;
      const parentBottom = center + n.h / 2;
      if (parentBottom + ROW_GAP > cursor) cursor = parentBottom + ROW_GAP;
    };
    
    place(rootRaw, 0);
    cursor += ROW_GAP * 2;
    place(stoppedPlRaw, 0);

    const maxDepth = allRaw.reduce((m, n) => Math.max(m, n.depth ?? 0), 0);
    const colW: number[] = Array.from({ length: maxDepth + 1 }, () => 0);
    for (const n of allRaw) {
      const w = KIND_W[n.kind] ?? 160;
      colW[n.depth!] = Math.max(colW[n.depth!], w);
    }
    const COL: number[] = [];
    for (let d = 0; d <= maxDepth; d++) {
      COL[d] = d === 0 ? 0 : COL[d - 1] + (colW[d - 1] || 160) + COL_GAP;
    }

    const nodes: ReactFlowNode[] = [];
    const edges: Edge[] = [];
    
    const walk = (n: Raw) => {
      const nd = n.data as MindData;
      const x = COL[n.depth!];
      nodes.push({ id: n.id, type: "mind", position: { x, y: n.y! }, data: n.data, draggable: canManage });
      for (const c of n.children) {
        edges.push({ id: `${n.id}->${c.id}`, source: n.id, target: c.id, type: "smoothstep", style: { stroke: "var(--border)", strokeWidth: 1 } });
        walk(c);
      }
    };
    walk(rootRaw);
    walk(stoppedPlRaw);

    const unitMode = tree.some((pl) => pl.fields[0]?.groups[0]?.passthrough);
    const layerLabels = unitMode
      ? ["Toàn hệ thống", "Đơn vị", "Hệ thống", "Thành phần hệ thống", "Thành phần tài sản"]
      : ["Toàn hệ thống", "Phân loại", "Nhóm hệ thống", "Hệ thống", "Thành phần hệ thống", "Thành phần tài sản"];

    const layerNodes: ReactFlowNode[] = layerLabels
      .map((label, i) => ({ label, i }))
      .filter(({ i }) => Number.isFinite(COL[i]))
      .map(({ label, i }) => ({
        id: `layer:${i}`, type: "layer", position: { x: COL[i], y: -80 },
        data: { label }, selectable: false, draggable: false, focusable: false,
      }));

    const finiteNodes = nodes.every(n => Number.isFinite(n.position?.x) && Number.isFinite(n.position?.y));

    console.debug("[CayMindMap] buildNodes", {
      deviceCount: devices.length,
      treeCount: tree.length,
      nodeCount: nodes.length,
      finiteNodes,
      errorNodes: finiteNodes ? [] : nodes.filter(n => !Number.isFinite(n.position?.x) || !Number.isFinite(n.position?.y)).map(n => n.id)
    });

    return { nodes: [...layerNodes, ...nodes], edges, finiteNodes };
  }, [tree, expandedNodes, scopeText, htMind, plMind, nhMind, tbMind, canManage, toggle, onRename, onOpenEditor, onHistory, onRecord, onMoveSystem, posByHt, devices]);


  useEffect(() => { 
    if (nodes.length > 0) {
      setRfNodes(nodes); 
    }
  }, [nodes, setRfNodes]);

  const dragRef = useRef<{ startX: number; startY: number; desc: Map<string, { x: number; y: number }> } | null>(null);

  const collectDescendants = useCallback((rootId: string): Set<string> => {
    const childMap = new Map<string, string[]>();
    for (const e of edges) {
      const arr = childMap.get(e.source) ?? [];
      arr.push(e.target);
      childMap.set(e.source, arr);
    }
    const desc = new Set<string>();
    const stack = [...(childMap.get(rootId) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (desc.has(id)) continue;
      desc.add(id);
      for (const c of childMap.get(id) ?? []) stack.push(c);
    }
    return desc;
  }, [edges]);


  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ minHeight: 'inherit' }}>
      <ReactFlow 
        nodeTypes={nodeTypes} 
        nodes={rfNodes} 
        edges={edges} 
        onNodesChange={onNodesChange} 
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={1.5}
        onNodeDragStart={(_e, node) => {
          const desc = collectDescendants(String(node.id));
          const posMap = new Map<string, { x: number; y: number }>();
          for (const n of rfNodes) if (desc.has(String(n.id))) posMap.set(String(n.id), { x: n.position.x, y: n.position.y });
          dragRef.current = { startX: node.position.x, startY: node.position.y, desc: posMap };
        }}
        onNodeDrag={(_e, node) => {
          const dr = dragRef.current;
          if (!dr || dr.desc.size === 0) return;
          const dx = node.position.x - dr.startX;
          const dy = node.position.y - dr.startY;
          setRfNodes((prev) => prev.map((n) => {
            const base = dr.desc.get(String(n.id));
            return base ? { ...n, position: { x: base.x + dx, y: base.y + dy } } : n;
          }));
        }}
        onNodeDragStop={(_e, node) => {
          dragRef.current = null;
          const d = node.data as MindData;
          const reset = () => setRfNodes(nodes);

          const hitFirst = (prefixes: string[]) =>
            rf?.getIntersectingNodes(node).find((n: ReactFlowNode) => prefixes.some((p) => String(n.id).startsWith(p)));

          if (d.kind === "ht" && d.ma) {
            const sysId = parseHtSysMa(d.ma).sysName;
            const hitNode = hitFirst(["nh:", "pl:", "lv:"]);
            if (hitNode && isRealSystemId(sysId)) {
              const parts = String(hitNode.id).split(":");
              const toNhomId = parts[1] ?? "";
              const toLvId = parts[2];
              const toNhKey = String(hitNode.id).startsWith("nh:") ? parts.slice(3).join(":") : undefined;
              const hitData = hitNode.data as MindData;
              onMoveSystem({ heThongId: sysId, tenHeThong: d.label, toNhomId, toLvId, toNhKey, toNhTen: toNhKey ? hitData.label : undefined });
            }
            return reset();
          }

          if (d.kind === "tb" && d.ma) {
             const hitNode = hitFirst(["ht:"]);
             if (hitNode) {
               const hitData = hitNode.data as MindData;
               const toHtId = hitData.ma ? parseHtSysMa(hitData.ma).sysName : "";
               if (isRealSystemId(toHtId)) onMoveDevice({ deviceMa: d.ma, label: d.label, toHtId, toHtLabel: hitData.label });
             }
             return reset();
          }

          return reset();
        }}
      >
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!hidden sm:!block" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {rfNodes.filter(n => n.type === 'mind').length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="flex flex-col items-center gap-4 p-8 bg-card/80 backdrop-blur border rounded-xl shadow-2xl pointer-events-auto">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold">Chưa có dữ liệu sơ đồ</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">Không tìm thấy hệ thống nào khớp với bộ lọc hiện tại.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="gap-2">
                <Loader2 className="w-4 h-4" /> Tải lại trang
              </Button>
            </div>
          </div>
        )}

        <Panel position="top-right" className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={recenter}>
                    <GitFork className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Căn giữa sơ đồ</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => rf?.zoomTo(1)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Phóng đại 100%</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
