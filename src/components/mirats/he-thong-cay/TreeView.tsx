import { useState, useCallback } from "react";
import {
  ChevronRight, ChevronDown, Network, Cpu, Building2,
  Eye, MapPin, Plus, Minus, Boxes, Puzzle,
  History, Wrench, AlertTriangle, FileText, FolderTree, ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { 
  PlGroup, HtGroup, NhGroup, DevNode, 
  MoveReq, MoveGroupReq, MoveDeviceReq, MoveTarget, 
  ViTriChucNangTree 
} from "./types";
import { LEVEL_META } from "./types";
import { DUNG_KHAI_THAC_TEN, deviceChips } from "./utils";

export function TreeView({
  tree,
  plLabel,
  lvLabel,
  nhLabel,
  htMind,
  tbLabel,
  canManage,
  onOpenEditor,
  onHistory,
  onIncident,
  onMaint,
  onRecord,
  onRename,
  onMoveSystem,
  onMoveGroup,
  onMoveDevice,
  posByHt,
}: {
  tree: PlGroup[];
  plLabel: (id: string) => string;
  lvLabel: (id: string) => string;
  nhLabel: (ma: string) => string;
  htMind: (ma: string) => string;
  tbLabel: (t: any) => string;
  canManage: boolean;
  onOpenEditor: (kind: any, ma: string) => void;
  onHistory: (htMa: string) => void;
  onIncident: (htMa: string) => void;
  onMaint: (htMa: string) => void;
  onRecord: (kind: "tb" | "tp", ma: string, ten: string) => void;
  onRename: (kind: any, ma: string, ten: string) => void;
  onMoveSystem: (req: MoveReq) => void;
  onMoveGroup: (req: MoveGroupReq) => void;
  onMoveDevice: (req: MoveDeviceReq) => void;
  posByHt: Map<string, any>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["root"]));

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const moveTargets = tree.flatMap(pl => 
    pl.fields.flatMap(lv => 
      lv.groups.map(nh => ({ 
        plId: pl.id, plLabel: plLabel(pl.id), lvId: "", lvLabel: "", nhKey: nh.ma, nhLabel: nhLabel(nh.ma) 
      }))
    )
  );

  const renderDevice = (d: DevNode, htMa: string, level: number) => {
    const tbId = `tb:${d.tb.ma_thiet_bi}`;
    const isExpanded = expanded.has(tbId);
    const hasKids = d.children.length > 0;
    const chips = deviceChips(d.tb);

    return (
      <div key={d.tb.ma_thiet_bi} className="space-y-1">
        <div className={cn("group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50", level > 0 && "ml-4")}>
          <div className="flex w-6 items-center justify-center shrink-0">
            {hasKids ? (
              <button onClick={() => toggle(tbId)} className="rounded p-0.5 hover:bg-muted">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <Puzzle className="h-3 w-3 opacity-30" />
            )}
          </div>
          <Cpu className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate text-sm font-medium cursor-help">{tbLabel(d.tb)}</span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-xs font-mono">Mã: {d.tb.ma_thiet_bi}</div>
              </TooltipContent>
            </Tooltip>
            {chips.map((c, i) => (
              <Badge key={i} variant="outline" className={cn("px-1 py-0 text-[9px]", c.className)} title={c.title}>
                {c.text}
              </Badge>
            ))}
          </div>
          
          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
             <button onClick={() => onOpenEditor("tb", d.tb.ma_thiet_bi)} className="rounded p-1 hover:bg-muted" title="Sửa">
               <Eye className="h-3.5 w-3.5" />
             </button>
             <button onClick={() => onRecord("tb", d.tb.ma_thiet_bi, tbLabel(d.tb))} className="rounded p-1 hover:bg-muted" title="Sổ lý lịch">
               <History className="h-3.5 w-3.5" />
             </button>
          </div>
        </div>
        {isExpanded && d.children.map(c => renderDevice({ tb: c, children: [] }, htMa, level + 1))}
      </div>
    );
  };

  const renderSystem = (ht: HtGroup, parentId: string) => {
    const htId = `${parentId}:${ht.ma}`;
    const isExpanded = expanded.has(htId);
    
    return (
      <div key={ht.ma} className="space-y-1">
        <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
          <button onClick={() => toggle(htId)} className="rounded p-0.5 hover:bg-muted">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <Network className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 truncate text-sm font-medium">{htMind(ht.ma)}</span>
          <Badge variant="outline" className="shrink-0">{ht.count}</Badge>
          
          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
             <button onClick={() => onHistory(ht.ma)} className="rounded p-1 hover:bg-muted" title="Lịch sử">
               <History className="h-4 w-4" />
             </button>
             <button onClick={() => onOpenEditor("ht", ht.ma)} className="rounded p-1 hover:bg-muted" title="Thông tin">
               <Eye className="h-4 w-4" />
             </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="ml-6 border-l pl-2 space-y-1">
            {ht.devices.map(d => renderDevice(d, ht.ma, 0))}
            {ht.devices.length === 0 && <p className="py-2 text-xs italic text-muted-foreground">Trống</p>}
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (nh: NhGroup, plId: string) => {
    const nhId = `nh:${plId}:${nh.ma}`;
    const isExpanded = expanded.has(nhId);

    return (
      <div key={nh.ma} className="space-y-1">
        <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
          <button onClick={() => toggle(nhId)} className="rounded p-0.5 hover:bg-muted">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <FolderTree className="h-4 w-4 shrink-0 text-violet-500" />
          <span className="flex-1 truncate text-sm font-semibold">{nhLabel(nh.ma)}</span>
          <Badge variant="secondary" className="shrink-0">{nh.count}</Badge>
        </div>
        {isExpanded && (
          <div className="ml-6 space-y-1 border-l pl-2">
            {nh.systems.map(ht => renderSystem(ht, nhId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 py-2">
      {tree.map((pl) => {
        const plId = `pl:${pl.id}`;
        const isExpanded = expanded.has(plId);
        const isStopped = pl.ten === DUNG_KHAI_THAC_TEN;
        
        return (
          <div key={pl.id} className={cn("rounded-lg border bg-card p-3", isStopped && "border-dashed opacity-80")}>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(plId)} className="rounded p-1 hover:bg-muted">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <Boxes className={cn("h-5 w-5", isStopped ? "text-muted-foreground" : "text-rose-500")} />
              <span className="text-base font-bold">{pl.ten}</span>
              <Badge variant="outline" className="ml-auto">{pl.count}</Badge>
            </div>
            
            {isExpanded && (
              <div className="mt-4 space-y-2 pl-2">
                {pl.fields.flatMap(lv => lv.groups).map(nh => renderGroup(nh, pl.id))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
