import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  ReactFlow, Controls, MiniMap, Panel, useReactFlow,
  useNodesState, useEdgesState,
  Handle, Position,
  type Node, type Edge, type NodeTypes, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ChevronRight, ChevronDown, Network, Layers, Cpu, Search, Building2, ListTree, GitFork,
  Pencil, Check, X, Save, Loader2, Eye, MapPin, Plus, Minus, Table2, Boxes, Puzzle,
  Download, Upload, ExternalLink, FolderTree, ArrowRightLeft, ArrowUp, ArrowDown, Palette,
  History, Wrench, AlertTriangle, Package, Users, FileText, ClipboardList, BookMarked, Trash2, Info, Plug, Tags,
} from "lucide-react";
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
import type { MindKind, MindData, PlGroup, DevNode, ViTriChucNangTree } from "./types";
import { LEVEL_META } from "./types";

const KIND_STYLE: Record<MindKind, string> = {
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

const KIND_DOT: Record<MindKind, string> = {
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

const KIND_ICON: Record<MindKind, React.ComponentType<{ className?: string }>> = {
  root: Building2, pl: Boxes, lv: Layers, nh: FolderTree, ht: Network, tb: Cpu, tp: Puzzle, vtg: Plug, vt: MapPin,
};

const KIND_WIDTH: Record<MindKind, string> = {
  root: "w-[260px]", pl: "w-[248px]", lv: "w-[248px]", nh: "w-[268px]",
  ht: "w-[320px]", tb: "w-[308px]", tp: "w-[300px]", vtg: "w-[264px]", vt: "w-[320px]",
};

function TruncatedNodeLabel({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [label]);

  const text = (
    <span
      ref={ref}
      className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium"
      title={truncated ? undefined : label}
    >
      {label}
    </span>
  );

  if (!truncated) return text;
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
        "group relative flex h-8 cursor-pointer items-center text-[11px] leading-none transition-all animate-fade-in",
        KIND_WIDTH[data.kind],
      )}
    >
      <div
        className={cn(
          "relative flex h-full w-full items-center gap-1.5 overflow-hidden rounded-md border border-l-2 px-2 pr-2 backdrop-blur-[1px] transition-all hover:border-primary/60 hover:shadow-sm",
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
          {data.code && <CodeBadge code={data.code} />}
          <TruncatedNodeLabel label={data.label} />
        </div>
        <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { mind: MindNode as any };

export function CayMindMap({ tree, posByHt }: { tree: PlGroup[], posByHt: Map<string, any> }) {
  return (
    <div className="h-full w-full">
      <ReactFlow nodeTypes={nodeTypes} nodes={[]} edges={[]}>
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
