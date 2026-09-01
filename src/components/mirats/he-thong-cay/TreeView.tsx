import { useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Network,
  Cpu,
  Building2,
  Eye,
  MapPin,
  Plus,
  Minus,
  Boxes,
  Puzzle,
  History,
  Wrench,
  AlertTriangle,
  FileText,
  FolderTree,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TruncatedNodeLabel } from "./TruncatedNodeLabel";
import { HierarchyRow, HierarchyChildren } from "@/components/mirats/hierarchy/HierarchyNode";

/** Nút thao tác trên node — vùng bấm ≥32px, nhãn cho screen reader. */
function NodeAction({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground",
        "transition-colors hover:bg-muted hover:text-foreground sm:h-7 sm:w-7",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

import { CodeBadge } from "@/components/mirats/CodeBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  PlGroup,
  HtGroup,
  NhGroup,
  DevNode,
  MoveReq,
  MoveGroupReq,
  MoveDeviceReq,
  MoveTarget,
  ViTriChucNangTree,
} from "./types";
import { resolveDeviceDisplayIdentity } from "@/lib/mirats/db-taxonomy";
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
  canManageNodes,
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
  canManageNodes?: boolean;
}) {

  const [expanded, setExpanded] = useState<Set<string>>(new Set(["root"]));
  const [selectedTp, setSelectedTp] = useState<{ vt: any; htId: string } | null>(null);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const moveTargets = tree.flatMap((pl) =>
    pl.fields.flatMap((lv) =>
      lv.groups.map((nh) => ({
        plId: pl.id,
        plLabel: plLabel(pl.id),
        lvId: "",
        lvLabel: "",
        nhKey: nh.ma,
        nhLabel: nhLabel(nh.ma),
      })),
    ),
  );

  const renderDevice = (d: DevNode, htMa: string, level: number) => {
    const tbId = `tb:${d.tb.ma_thiet_bi}`;
    const isExpanded = expanded.has(tbId);
    const hasKids = d.children.length > 0;
    const chips = deviceChips(d.tb);
    const identity = resolveDeviceDisplayIdentity(d.tb);

    return (
      <div key={d.tb.ma_thiet_bi} className="space-y-0.5">
        <HierarchyRow
          icon={Cpu}
          tone="muted"
          expandable={hasKids}
          expanded={isExpanded}
          onToggle={() => toggle(tbId)}
          toggleLabel={identity.primaryLabel}
          leafIcon={Puzzle}
          onActivate={() => onOpenEditor("tb", d.tb.ma_thiet_bi)}
          activateHint="Mở bảng chỉnh sửa tài sản / thành phần"
          title={
            <TruncatedNodeLabel
              label={identity.primaryLabel}
              code={d.tb.ma_thiet_bi}
              identity={identity}
            />
          }
          badges={chips.map((c, i) => (
            <Badge
              key={i}
              variant="outline"
              className={cn("px-1 py-0 text-[9px]", c.className)}
              title={c.title}
            >
              {c.text}
            </Badge>
          ))}
          actions={
            <>
              {canManageNodes && (
                <NodeAction
                  icon={Eye}
                  label="Sửa"
                  onClick={() => onOpenEditor("tb", d.tb.ma_thiet_bi)}
                />
              )}
              <NodeAction icon={AlertTriangle} label="Sự cố" onClick={() => onIncident(htMa)} />
              <NodeAction icon={Wrench} label="Bảo trì" onClick={() => onMaint(htMa)} />
              <NodeAction
                icon={History}
                label="Lý lịch tài sản"
                onClick={() => onRecord("tb", d.tb.ma_thiet_bi, tbLabel(d.tb))}
              />
              {d.tb._thanhPhanId && (
                <NodeAction
                  icon={Eye}
                  label="Chi tiết thành phần"
                  className="text-sky-600"
                  onClick={() =>
                    setSelectedTp({
                      vt: {
                        id: d.tb._thanhPhanId,
                        ma_thanh_phan: d.tb._thanhPhanMa,
                        ten: d.tb._thanhPhanTen || "Thành phần",
                        device: d.tb,
                      },
                      htId: htMa,
                    })
                  }
                />
              )}
            </>
          }
        />
        {isExpanded && (
          <HierarchyChildren>
            {d.children.map((c) => renderDevice({ tb: c, children: [] }, htMa, level + 1))}
          </HierarchyChildren>
        )}
      </div>
    );
  };

  const renderSystem = (ht: HtGroup, parentId: string) => {
    const htId = `${parentId}:${ht.ma}`;
    const isExpanded = expanded.has(htId);
    const htTen = htMind(ht.ma);

    return (
      <div key={ht.ma} className="space-y-0.5">
        <HierarchyRow
          icon={Network}
          tone="primary"
          expandable
          expanded={isExpanded}
          onToggle={() => toggle(htId)}
          toggleLabel={htTen}
          onActivate={() => onOpenEditor("ht", ht.ma)}
          activateHint="Mở bảng chỉnh sửa hệ thống (thêm/sửa/xoá thành phần)"
          title={<TruncatedNodeLabel label={htTen} code={ht.ma} />}
          badges={
            <Badge
              variant="outline"
              className="h-4 min-w-[1.25rem] justify-center px-1 py-0 text-[10px]"
              title={`${ht.count} tài sản`}
            >
              {ht.count}
            </Badge>
          }
          actions={
            <>
              <NodeAction icon={AlertTriangle} label="Sự cố" onClick={() => onIncident(ht.ma)} />
              <NodeAction icon={Wrench} label="Bảo trì" onClick={() => onMaint(ht.ma)} />
              <NodeAction
                icon={History}
                label="Lý lịch hệ thống"
                onClick={() => onHistory(ht.ma)}
              />
              {canManageNodes && (
                <NodeAction
                  icon={Eye}
                  label="Thông tin"
                  onClick={() => onOpenEditor("ht", ht.ma)}
                />
              )}
            </>
          }
        />

        {isExpanded && (
          <HierarchyChildren>
            {ht.devices.map((d) => renderDevice(d, ht.ma, 0))}
            {ht.devices.length === 0 && (
              <p className="px-2 py-1.5 text-xs italic text-muted-foreground">
                Hệ thống chưa có tài sản/thành phần nào.
              </p>
            )}
          </HierarchyChildren>
        )}
      </div>
    );
  };

  const renderGroup = (nh: NhGroup, plId: string) => {
    const nhId = `nh:${plId}:${nh.ma}`;
    const isExpanded = expanded.has(nhId);
    const nhTen = nhLabel(nh.ma);

    return (
      <div key={nh.ma} className="space-y-0.5">
        <HierarchyRow
          icon={FolderTree}
          tone="accent"
          expandable
          expanded={isExpanded}
          onToggle={() => toggle(nhId)}
          toggleLabel={nhTen}
          onActivate={() => onOpenEditor("nh", nh.ma)}
          activateHint="Mở bảng chỉnh sửa nhóm hệ thống"
          title={<TruncatedNodeLabel label={nhTen} code={nh.ma} />}
          badges={
            <Badge
              variant="secondary"
              className="h-4 min-w-[1.25rem] justify-center px-1 py-0 text-[10px]"
              title={`${nh.count} hệ thống`}
            >
              {nh.count}
            </Badge>
          }
        />
        {isExpanded && (
          <HierarchyChildren>
            {nh.systems.map((ht) => renderSystem(ht, nhId))}
          </HierarchyChildren>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 py-2">
      {tree.length === 0 && (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu phân cấp để hiển thị.
        </p>
      )}
      {tree.map((pl) => {
        const plId = `pl:${pl.id}`;
        const isExpanded = expanded.has(plId);
        const isStopped = pl.ten === DUNG_KHAI_THAC_TEN;

        return (
          <div
            key={pl.id}
            className={cn(
              "rounded-xl border bg-card p-2 shadow-sm transition-shadow hover:shadow-md",
              isStopped && "border-dashed opacity-80",
            )}
          >
            <HierarchyRow
              icon={Boxes}
              tone={isStopped ? "muted" : "danger"}
              expandable
              expanded={isExpanded}
              onToggle={() => toggle(plId)}
              toggleLabel={pl.ten}
              title={<span className="font-semibold tracking-tight">{pl.ten}</span>}
              badges={
                <Badge
                  variant="outline"
                  className="h-4 min-w-[1.5rem] justify-center bg-muted/30 px-1 py-0 text-[10px]"
                  title={`${pl.count} hệ thống`}
                >
                  {pl.count}
                </Badge>
              }
              className="hover:bg-transparent"
            />

            {isExpanded && (
              <HierarchyChildren className="mt-1.5">
                {pl.fields.flatMap((lv) => lv.groups).map((nh) => renderGroup(nh, pl.id))}
              </HierarchyChildren>
            )}
          </div>
        );
      })}


      {selectedTp && (
        <ThanhPhanChiTietDialog
          viTri={selectedTp.vt}
          heThongId={selectedTp.htId}
          canManage={!!canManageNodes}
          onClose={() => setSelectedTp(null)}
          onOpenDevice={(ma) => onRecord("tb", ma, "")}
        />
      )}
    </div>
  );
}
