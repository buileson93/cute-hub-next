import { useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Network,
  Cpu,
  Building2,
  History,
  Boxes,
  Puzzle,
  FolderTree,
  Layers,
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

export function TreeView({ tree, total }: { tree: TreeNode[]; total: number }) {
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

    const Icon =
      node.kind === "dv"
        ? Building2
        : node.kind === "pl"
          ? Boxes
          : node.kind === "ht"
            ? Network
            : node.kind === "tp"
              ? Puzzle
              : FolderTree;

    return (
      <div key={node.key} className="space-y-1">
        <div
          className={cn(
            "astryx-control group flex h-10 items-center gap-3 rounded-lg px-2 transition-all duration-200 hover:bg-primary/5 w-full cursor-default",
          )}
          style={{ paddingLeft: `${12 + level * 20}px` }}
        >
          <div className="flex w-5 items-center justify-center shrink-0">
            {hasSub ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(node.key);
                }}
                className="rounded-md p-1 hover:bg-primary/10 transition-colors text-muted-foreground group-hover:text-primary"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : null}
          </div>
          <div className="flex w-5 items-center justify-center shrink-0">
            <Icon
              className={cn(
                "h-4.5 w-4.5 transition-colors",
                node.kind === "ht"
                  ? "text-primary"
                  : node.kind === "tp"
                    ? "text-emerald-500"
                    : "text-muted-foreground/60 group-hover:text-muted-foreground",
              )}
            />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
            <span
              className={cn(
                "truncate text-sm tracking-tight",
                node.kind === "ht"
                  ? "font-semibold text-primary"
                  : "font-medium text-foreground/80 group-hover:text-foreground",
              )}
            >
              {node.label}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/40 group-hover:text-primary/60 px-1.5 py-0.5 rounded-full border border-muted-foreground/10 min-w-[1.5rem] text-center shrink-0">
              {node.count}
            </span>
          </div>
          {node.hist && (node.hist.bt > 0 || node.hist.sc > 0) && (
            <div className="flex gap-2 text-[10px]">
              {node.hist.bt > 0 && (
                <span className="text-muted-foreground">BD: {node.hist.bt}</span>
              )}
              {node.hist.sc > 0 && (
                <span className="text-amber-600 font-medium">SC: {node.hist.sc}</span>
              )}
            </div>
          )}
          {node.kind === "ht" && node.sysId && (
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
            {node.sub.map((s) => renderNode(s, level + 1))}
            {node.devices.map((d) => (
              <div
                key={d.id}
                className="group/item flex h-9 items-center gap-3 hover:bg-primary/5 rounded-lg px-2 transition-all duration-200 w-full cursor-default"
                style={{ paddingLeft: `${12 + (level + 1) * 20}px` }}
              >
                <div className="flex w-5 items-center justify-center shrink-0">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/20 group-hover/item:bg-primary/40 transition-colors" />
                </div>
                <div className="flex w-5 items-center justify-center shrink-0">
                  <Cpu className="h-4 w-4 text-muted-foreground/40 group-hover/item:text-primary/60 transition-colors" />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/thiet-bi/$maThietBi"
                      params={{ maThietBi: d.ma_thiet_bi }}
                      search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                      className="text-xs hover:text-primary transition-colors truncate flex-1 font-medium text-foreground/70"
                    >
                      {d.ten}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-[10px] font-mono opacity-80">Mã: {d.ma_thiet_bi}</div>
                  </TooltipContent>
                </Tooltip>
                <div className="ml-auto opacity-0 group-hover/item:opacity-100 flex gap-1 shrink-0 px-1">
                  <AppTooltip noiDung="Xem sổ lý lịch tài sản">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-md hover:bg-primary/10"
                    >
                      <Link
                        to="/thiet-bi/$maThietBi"
                        params={{ maThietBi: d.ma_thiet_bi }}
                        search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                      >
                        <History className="h-3.5 w-3.5 text-primary/60 group-hover/item:text-primary transition-colors" />
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
      {tree.map((n) => renderNode(n, 0))}
      {total === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy dữ liệu phù hợp
        </div>
      )}
    </div>
  );
}
