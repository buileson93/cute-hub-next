// ============================================================================
// Cây phân cấp trong Sổ lý lịch — Đơn vị → Phân loại → Hệ thống → Thành phần.
// Dùng chung ngôn ngữ hiển thị với Cây phân cấp hệ thống thông qua các
// primitive trong components/mirats/hierarchy/HierarchyNode (HierarchyRow,
// HierarchyChildren, NodeIcon). Nhờ đó icon, spacing, typography, trạng thái
// hover/selected và vùng bấm toggle đồng nhất giữa hai màn hình.
//
// Chống hiệu ứng "nhảy" khi mở node: mọi hàng đều có cùng cấu trúc cột
// (toggle | icon | nội dung | actions); node lá dùng ô giữ chỗ thay vì bỏ
// trống, và vùng actions luôn chiếm chỗ (chỉ đổi opacity khi hover).
// ============================================================================
import { useState, useCallback } from "react";
import { Network, Cpu, Building2, History, Boxes, Puzzle, FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Link } from "@tanstack/react-router";
import {
  HierarchyRow,
  HierarchyChildren,
  type NodeTone,
} from "@/components/mirats/hierarchy/HierarchyNode";

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

const KIND_META: Record<
  TreeNode["kind"],
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: NodeTone }
> = {
  dv: { label: "Đơn vị", icon: Building2, tone: "muted" },
  pl: { label: "Phân loại", icon: Boxes, tone: "accent" },
  ht: { label: "Hệ thống", icon: Network, tone: "primary" },
  tp: { label: "Thành phần", icon: Puzzle, tone: "success" },
};

function CountMeta({ node }: { node: TreeNode }) {
  return (
    <>
      <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
        {KIND_META[node.kind]?.label ?? "Nhánh"}
      </Badge>
      <span className="tabular-nums">
        {node.count} tài sản
      </span>
      {node.hist?.bt > 0 && <span>· BD {node.hist.bt}</span>}
      {node.hist?.sc > 0 && <span className="text-warning">· SC {node.hist.sc}</span>}
      {node.hist?.hh > 0 && <span className="text-destructive">· HH {node.hist.hh}</span>}
    </>
  );
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

  const renderNode = (node: TreeNode) => {
    const isExpanded = expanded.has(node.key);
    const hasSub = node.sub.length > 0 || node.devices.length > 0;
    const meta = KIND_META[node.kind] ?? {
      label: "Nhánh",
      icon: FolderTree,
      tone: "muted" as NodeTone,
    };

    return (
      <div key={node.key} className="space-y-1">
        <HierarchyRow
          icon={meta.icon}
          tone={meta.tone}
          title={node.label}
          meta={<CountMeta node={node} />}
          expandable={hasSub}
          expanded={isExpanded}
          onToggle={() => toggle(node.key)}
          toggleLabel={node.label}
          surface={node.kind === "dv" ? "plain" : "card"}
          actions={
            node.kind === "ht" && node.sysId ? (
              <AppTooltip noiDung="Xem sổ lý lịch hệ thống">
                <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                  <Link to="/he-thong/$id" params={{ id: node.sysId }}>
                    <History className="h-3.5 w-3.5 text-primary" />
                    <span className="sr-only">Sổ lý lịch hệ thống</span>
                  </Link>
                </Button>
              </AppTooltip>
            ) : undefined
          }
        />

        {isExpanded && hasSub && (
          <HierarchyChildren>
            {node.sub.map((s) => renderNode(s))}
            {node.devices.map((d) => (
              <HierarchyRow
                key={d.id}
                icon={Cpu}
                tone="muted"
                title={d.ten || d.ma_thiet_bi}
                meta={
                  <>
                    <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
                      Tài sản
                    </Badge>
                    <span className="font-mono">{d.ma_thiet_bi}</span>
                  </>
                }
                actions={
                  <AppTooltip noiDung="Xem sổ lý lịch tài sản">
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                      <Link
                        to="/thiet-bi/$maThietBi"
                        params={{ maThietBi: d.ma_thiet_bi }}
                        search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                      >
                        <History className="h-3.5 w-3.5 text-primary" />
                        <span className="sr-only">Xem sổ lý lịch</span>
                      </Link>
                    </Button>
                  </AppTooltip>
                }
              />
            ))}
          </HierarchyChildren>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {tree.map((n) => renderNode(n))}
      {total === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy dữ liệu phù hợp
        </div>
      )}
    </div>
  );
}
