import { useState, useCallback } from "react";
import {
  ChevronRight, ChevronDown, Network, Cpu, Building2,
  History, Boxes, Puzzle, FolderTree, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@tanstack/react-router";

export interface TreeNode {
  key: string;
  label: string;
  sub: TreeNode[];
  devices: any[];
  count: number;
  hist: { bt: number; sc: number; hh: number };
  kind: "dv" | "pl" | "ht" | "tp";
  sysId?: string;
  tpId?: string;
}

export function TreeView({ tree, total, histMap }: { tree: TreeNode[]; total: number; histMap: Map<string, any> }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const renderNode = (node: TreeNode, level: number) => {
    const isExpanded = expanded.has(node.key);
    const hasSub = node.sub.length > 0 || node.devices.length > 0;
    
    const Icon = node.kind === "dv" ? Building2 
               : node.kind === "pl" ? Boxes 
               : node.kind === "ht" ? Network 
               : node.kind === "tp" ? Puzzle
               : FolderTree;

    return (
      <div key={node.key} className="space-y-1">
        <div 
          className={cn(
            "astryx-control group flex h-9 items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/50 w-full"
          )}
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          <div className="flex w-6 items-center justify-center shrink-0">
            {hasSub ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(node.key);
                }} 
                className="rounded p-0.5 hover:bg-muted"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : null}
          </div>
          <div className="flex w-6 items-center justify-center shrink-0">
            <Icon className={cn("h-4 w-4", 
              node.kind === 'ht' ? 'text-primary' : 
              node.kind === 'tp' ? 'text-emerald-500' : 'text-muted-foreground'
            )} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <span className={cn("truncate text-sm", node.kind === 'ht' ? "font-bold" : "font-medium")}>
              {node.label}
            </span>
            <span className="astryx-badge astryx-badge-primary astryx-number min-w-[1.75rem] h-5 px-1 justify-center shrink-0">
              {node.count}
            </span>
          </div>
          {node.hist && (node.hist.bt > 0 || node.hist.sc > 0) && (
            <div className="flex gap-2 text-[10px]">
               {node.hist.bt > 0 && <span className="text-muted-foreground">BD: {node.hist.bt}</span>}
               {node.hist.sc > 0 && <span className="text-amber-600 font-medium">SC: {node.hist.sc}</span>}
            </div>
          )}
          {node.kind === 'ht' && node.sysId && (
            <div className="ml-auto opacity-0 group-hover:opacity-100 pr-1">
              <AppTooltip noiDung="Xem sổ lý lịch hệ thống">
                <Button asChild variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Link to="/he-thong/$id" params={{ id: node.sysId }}>
                    <History className="h-3.5 w-3.5 text-primary hover:scale-110 transition-transform" />
                    <span className="sr-only">Sổ lý lịch hệ thống</span>
                  </Link>
                </Button>
              </AppTooltip>
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-2 w-px bg-border/40" style={{ left: `${19 + level * 16}px` }} />
            {node.sub.map(s => renderNode(s, level + 1))}
            {node.devices.map(d => (
              <div 
                key={d.id} 
                className="group/item flex h-8 items-center gap-2 hover:bg-muted/30 rounded px-2 transition-colors w-full"
                style={{ paddingLeft: `${8 + (level + 1) * 16}px` }}
              >
                <div className="flex w-6 items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="flex w-6 items-center justify-center shrink-0">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      to="/thiet-bi/$maThietBi" 
                      params={{ maThietBi: d.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                      className="text-xs hover:underline truncate flex-1 font-medium"
                    >
                      {d.ten}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-xs font-mono">Mã: {d.ma_thiet_bi}</div>
                  </TooltipContent>
                </Tooltip>
                <div className="ml-auto opacity-0 group-hover/item:opacity-100 flex gap-2 shrink-0">
                   <AppTooltip noiDung="Xem sổ lý lịch tài sản">
                     <Button asChild variant="ghost" size="sm" className="h-6 w-6 p-0">
                       <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: d.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}>
                         <History className="h-3.5 w-3.5 text-primary hover:scale-110 transition-transform" />
                         <span className="sr-only">Xem sổ lý lịch</span>
                       </Link>
                     </Button>
                   </AppTooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {tree.map(n => renderNode(n, 0))}
      {total === 0 && <div className="py-8 text-center text-sm text-muted-foreground">Không tìm thấy dữ liệu phù hợp</div>}
    </div>
  );
}
