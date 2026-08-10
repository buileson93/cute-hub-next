import { useState, useCallback } from "react";
import {
  ChevronRight, ChevronDown, Network, Cpu, Building2,
  History, Boxes, Puzzle, FolderTree, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CodeBadge } from "@/components/mirats/CodeBadge";
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
            "group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50",
            level > 0 && "ml-4"
          )}
        >
          <div className="flex w-6 items-center justify-center shrink-0">
            {hasSub ? (
              <button onClick={() => toggle(node.key)} className="rounded p-0.5 hover:bg-muted">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : null}
          </div>
          <Icon className={cn("h-4 w-4 shrink-0", 
            node.kind === 'ht' ? 'text-primary' : 
            node.kind === 'tp' ? 'text-emerald-500' : 'text-muted-foreground'
          )} />
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <span className={cn("truncate text-sm", node.kind === 'ht' ? "font-bold" : "font-medium")}>
              {node.label}
            </span>
            <Badge variant="secondary" className="px-1 py-0 text-[10px] tabular-nums">
              {node.count}
            </Badge>
          </div>
          {node.hist && (node.hist.bt > 0 || node.hist.sc > 0) && (
            <div className="flex gap-2 text-[10px] mr-2">
               {node.hist.bt > 0 && <span className="text-muted-foreground">BD: {node.hist.bt}</span>}
               {node.hist.sc > 0 && <span className="text-amber-600 font-medium">SC: {node.hist.sc}</span>}
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className="border-l ml-5 pl-1">
            {node.sub.map(s => renderNode(s, level + 1))}
            {node.devices.map(d => (
              <div key={d.id} className="ml-8 flex items-center gap-2 py-1">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground/50" />
                <CodeBadge code={d.ma_thiet_bi} className="text-[10px]" />
                <Link 
                  to="/thiet-bi/$maThietBi" 
                  params={{ maThietBi: d.ma_thiet_bi }}
                  className="text-xs hover:underline truncate"
                >
                  {d.ten}
                </Link>
                <div className="ml-auto opacity-0 group-hover:opacity-100">
                   <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: d.ma_thiet_bi }}>
                     <History className="h-3 w-3 text-muted-foreground" />
                   </Link>
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
