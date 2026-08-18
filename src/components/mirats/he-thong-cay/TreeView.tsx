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
import { ThanhPhanChiTietDialog } from "../ThanhPhanChiTietDialog";
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
  const [selectedTp, setSelectedTp] = useState<{ vt: any, htId: string } | null>(null);

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
             <button onClick={() => onIncident(htMa)} className="rounded p-1 hover:bg-muted" title="Sự cố">
               <AlertTriangle className="h-3.5 w-3.5" />
             </button>
             <button onClick={() => onMaint(htMa)} className="rounded p-1 hover:bg-muted" title="Bảo trì">
               <Wrench className="h-3.5 w-3.5" />
             </button>
              <button onClick={() => onRecord("tb", d.tb.ma_thiet_bi, tbLabel(d.tb))} className="rounded p-1 hover:bg-muted" title="Lý lịch tài sản">
                <History className="h-3.5 w-3.5" />
              </button>
              {d.tb._thanhPhanId && (
                <button 
                  onClick={() => setSelectedTp({ 
                    vt: { 
                      id: d.tb._thanhPhanId, 
                      ma_thanh_phan: d.tb._thanhPhanMa, 
                      ten: d.tb._thanhPhanTen || "Thành phần",
                      device: d.tb 
                    }, 
                    htId: htMa 
                  })} 
                  className="rounded p-1 hover:bg-muted" title="Chi tiết thành phần"
                >
                  <Eye className="h-3.5 w-3.5 text-sky-600" />
                </button>
              )}
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
        <div className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/50">
          <button onClick={() => toggle(htId)} className="rounded p-0.5 hover:bg-muted shrink-0">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <Network className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="flex-1 truncate text-[13px] font-medium leading-tight">{htMind(ht.ma)}</span>
          <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0 h-4 min-w-[1.25rem] justify-center">{ht.count}</Badge>
          
          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
             <button onClick={() => onIncident(ht.ma)} className="rounded p-1 hover:bg-muted" title="Sự cố">
               <AlertTriangle className="h-4 w-4" />
             </button>
             <button onClick={() => onMaint(ht.ma)} className="rounded p-1 hover:bg-muted" title="Bảo trì">
               <Wrench className="h-4 w-4" />
             </button>
             <button onClick={() => onHistory(ht.ma)} className="rounded p-1 hover:bg-muted" title="Lý lịch hệ thống">
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
        <div className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/50">
          <button onClick={() => toggle(nhId)} className="rounded p-0.5 hover:bg-muted shrink-0">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <FolderTree className="h-3.5 w-3.5 shrink-0 text-violet-500" />
          <span className="flex-1 truncate text-[13px] font-semibold leading-tight">{nhLabel(nh.ma)}</span>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-1 py-0 h-4 min-w-[1.25rem] justify-center">{nh.count}</Badge>
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
          <div key={pl.id} className={cn("rounded-lg border bg-card p-2 shadow-sm", isStopped && "border-dashed opacity-80")}>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(plId)} className="rounded p-1 hover:bg-muted shrink-0">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              <Boxes className={cn("h-4 w-4 shrink-0", isStopped ? "text-muted-foreground" : "text-rose-500")} />
              <span className="text-sm font-bold tracking-tight">{pl.ten}</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 h-4 min-w-[1.5rem] justify-center bg-muted/30">{pl.count}</Badge>
            </div>
            
            {isExpanded && (
              <div className="mt-4 space-y-2 pl-2">
                {pl.fields.flatMap(lv => lv.groups).map(nh => renderGroup(nh, pl.id))}
              </div>
            )}
          </div>
        );
      })}

      {selectedTp && (
        <ThanhPhanChiTietDialog
          viTri={selectedTp.vt}
          heThongId={selectedTp.htId}
          canManage={canManage}
          onClose={() => setSelectedTp(null)}
          onOpenDevice={(ma) => onRecord("tb", ma, "")}
        />
      )}
    </div>
  );
}
