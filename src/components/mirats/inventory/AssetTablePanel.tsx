import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Search, X, Cpu, ExternalLink, Copy, Download, X as XIcon, Unplug, Wrench, PackageOpen, Loader2, Check, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";
import { StandardTable } from "@/components/mirats/StandardTable";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { BulkActionButton } from "@/components/mirats/BulkActionButton";
import { TableExportDialog } from "@/components/mirats/TableExportDialog";
import { AnomalyBadge } from "@/components/mirats/AnomalyBadge";
import { MultiRoleBadge } from "@/components/mirats/MultiRoleBadge";
import { CellPreview, ModelCell, type TaiSanRow, useInfiniteTaiSanRows, useModelRegistry, useMultiRoleMap } from "../ThanhPhanTable";
import { normalize } from "@/lib/mirats/global-search";

export function AssetTablePanel({
  tableKey,
  hideHeader,
  editMode,
  setEditMode,
  allowEdit,
  ModeToggle,
}: {
  tableKey: string;
  hideHeader: boolean;
  editMode: boolean;
  setEditMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  allowEdit: boolean;
  ModeToggle: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ] = useDebounce(q, 300);
  const [bucket, setBucket] = useState<"all" | "0" | "1" | "2-3" | ">3">("all");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { data: multiRoleMap } = useMultiRoleMap();
  const { data: modelRegistry = {} } = useModelRegistry();

  const {
    data: tsData,
    fetchNextPage: fetchNextTs,
    hasNextPage: hasNextTs,
    isFetchingNextPage: isFetchingTs,
    isLoading: loadingTsReal,
    error: errorTsReal,
  } = useInfiniteTaiSanRows(debouncedQ, bucket, true);

  const taiSanRows = useMemo(() => tsData?.pages.flatMap((p) => p.rows) ?? [], [tsData]);
  const totalTs = tsData?.pages[0]?.totalCount ?? 0;

  // Client-side fallback filter if server filter isn't 100% matched yet
  const filteredTaiSan = useMemo(() => {
    const t = normalize(debouncedQ).trim();
    const inBucket = (n: number) => {
      if (bucket === "all") return true;
      if (bucket === "0") return n === 0;
      if (bucket === "1") return n === 1;
      if (bucket === "2-3") return n >= 2 && n <= 3;
      return n > 3;
    };
    return taiSanRows.filter((r) => {
      if (!inBucket(r.soThanhPhanDangGan)) return false;
      if (!t) return true;
      return normalize(
        [
          r.ma, r.ten, r.serial, r.model, r.chungLoai, r.nhaSanXuat, r.nhaCungCap,
          r.donViQuanLy, r.viTri, r.danhSachHeThong, r.danhSachThanhPhan, r.pN,
          r.maTaiSanBravo, r.namSanXuat, r.namKhaiThac, r.tinhTrangKyThuat, r.cheDoKdHc
        ].join(" ")
      ).includes(t);
    });
  }, [taiSanRows, debouncedQ, bucket]);

  async function copyCodes(codes: string[]) {
    const text = codes.filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${codes.length} mã tài sản.`);
    } catch (err) {
      toast.error("Không thể sao chép vào bộ nhớ tạm.");
    }
  }

  return (
    <StandardTable<TaiSanRow>
      tableKey={`${tableKey}:tai-san`}
      rows={filteredTaiSan}
      trangThai={{ dangTai: loadingTsReal, loi: errorTsReal }}
      infiniteScroll={{
        hasNextPage: hasNextTs,
        fetchNextPage: fetchNextTs,
        isFetchingNextPage: isFetchingTs,
        totalCount: totalTs,
      }}
      getRowId={(r) => r.id}
      selected={selectedIds}
      setSelected={setSelectedIds}
      requireFilterToShow={false}
      emptyText="Không có tài sản phù hợp."
      countUnit="tài sản"
      maxHeightClass={hideHeader ? "min-h-0 flex-1" : undefined}
      selectable
      bulkActions={({ selectedRows, visibleColumns, allColumns, filteredRows, pageRows, clear }) => (
        <>
          <BulkActionButton
            label="Sao chép mã"
            icon={<Copy className="h-3.5 w-3.5" />}
            variant="outline"
            xacNhan={{
              tieuDe: "Sao chép mã các tài sản đã chọn?",
              moTa: <>Sẽ chép <b>{selectedRows.length}</b> mã tài sản vào bộ nhớ tạm.</>,
              nutXacNhan: "Sao chép",
            }}
            onRun={() => copyCodes(selectedRows.map((r) => r.ma))}
          />
          <TableExportDialog<TaiSanRow>
            ten="tai-san"
            countUnit="tài sản"
            visibleColumns={visibleColumns}
            allColumns={allColumns}
            rowsByScope={{ selected: selectedRows, filtered: filteredRows, page: pageRows }}
            trigger={
              <AppTooltip noiDung="Xuất dữ liệu ra file CSV">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                  <Download className="h-3.5 w-3.5" />
                  <span className="sr-only">Xuất CSV…</span>
                </Button>
              </AppTooltip>
            }
          />
          <AppTooltip noiDung="Bỏ chọn">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={clear}>
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Bỏ chọn</span>
            </Button>
          </AppTooltip>
        </>
      )}
      toolbarLeft={
        <div className="flex items-center gap-1.5">
          {ModeToggle}
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 transition-all", searchExpanded || q ? "text-primary" : "text-muted-foreground")}
              onClick={() => {
                setSearchExpanded(!searchExpanded);
                if (!searchExpanded) setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
            {(searchExpanded || q) && (
              <div className="flex items-center">
                <Input
                  ref={searchInputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm tài sản…"
                  className="h-7 w-[180px] bg-background text-xs shadow-sm ml-1 pr-7"
                />
                {q && (
                  <button type="button" onClick={() => setQ("")} className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
          <Select value={bucket} onValueChange={(v) => setBucket(v as any)}>
            <SelectTrigger className="h-7 w-[90px] px-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2-3">2 – 3</SelectItem>
              <SelectItem value=">3">&gt; 3</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-md border border-border/50">
            <span className="tabular-nums">
              Đã tải {taiSanRows.length} {totalTs > 0 ? `/ ${totalTs.toLocaleString("vi-VN")}` : ""} tài sản
            </span>
          </div>
        </div>
      }
      columns={[
        {
          key: "ma",
          label: "Mã tài sản",
          minW: "min-w-[140px]",
          filter: "text",
          value: (r) => r.ma,
          priority: "primary",
          cell: (r) => <CodeBadge code={r.ma} />,
          defaultHidden: true,
        },
        {
          key: "ten",
          label: "Tên tài sản",
          minW: "min-w-[220px]",
          cellClassName: "max-w-[280px]",
          filter: "text",
          sticky: true,
          value: (r) => r.ten,
          priority: "primary",
          cell: (r) => (
            <div className="flex items-start gap-1.5">
              <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: r.ma }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="group flex flex-1 items-start gap-1 hover:text-primary">
                <span title={r.ten} className="line-clamp-2 break-words font-medium leading-snug group-hover:underline">{r.ten || "—"}</span>
                <AnomalyBadge score={Number(r.anomalyScore) || 0} count90d={Number(r.soSuCo90n) || 0} className="shrink-0" />
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <MultiRoleBadge info={multiRoleMap?.byMa.get(r.ma)} compact side="left" />
            </div>
          ),
        },
        {
          key: "soThanhPhanDangGan",
          label: "Số thành phần đang gắn",
          minW: "min-w-[180px]",
          align: "center",
          filter: "cat",
          sortable: true,
          sortValue: (r) => r.soThanhPhanDangGan,
          value: (r) => String(r.soThanhPhanDangGan),
          cell: (r) => r.soThanhPhanDangGan === 0 ? (
            <Badge variant="outline" className="gap-1 text-muted-foreground"><Unplug className="h-3 w-3" /> Chưa gắn</Badge>
          ) : r.soThanhPhanDangGan > 1 ? (
            <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"><Cpu className="h-3 w-3" /> {r.soThanhPhanDangGan} thành phần</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1"><Cpu className="h-3 w-3" /> 1 thành phần</Badge>
          ),
        },
        {
          key: "danhSachHeThong",
          label: "Hệ thống đang lắp",
          minW: "min-w-[200px]",
          cellClassName: "max-w-[240px]",
          filter: "text",
          value: (r) => r.danhSachHeThong,
          cell: (r) => <CellPreview title={`Hệ thống đang lắp — ${r.ma}`} content={r.danhSachHeThong} className="line-clamp-3 break-words text-[12px] leading-snug" />,
        },
        {
          key: "danhSachThanhPhan",
          label: "Thành phần đang lắp",
          minW: "min-w-[260px]",
          cellClassName: "max-w-[320px]",
          filter: "text",
          value: (r) => r.danhSachThanhPhan,
          cell: (r) => <CellPreview title={`Thành phần đang lắp — ${r.ma}`} content={r.danhSachThanhPhan} preformatted className="whitespace-pre-line break-words text-xs leading-relaxed line-clamp-4" />,
        },
        {
          key: "serial",
          label: "Serial",
          minW: "min-w-[130px]",
          cellClassName: "max-w-[180px]",
          filter: "text",
          hideBelow: "lg",
          value: (r) => r.serial,
          priority: "secondary",
          cell: (r) => r.serial ? <span className="break-all font-mono text-xs text-muted-foreground">{r.serial}</span> : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
          key: "model",
          label: "Model",
          minW: "min-w-[150px]",
          cellClassName: "max-w-[200px]",
          filter: "cat",
          hideBelow: "lg",
          value: (r) => r.model,
          priority: "secondary",
          cell: (r) => <ModelCell model={r.model} modelId={r.modelId || undefined} registry={modelRegistry} />,
        },
        {
          key: "chungLoai",
          label: "Chủng loại",
          minW: "min-w-[150px]",
          cellClassName: "max-w-[200px]",
          filter: "cat",
          hideBelow: "xl",
          value: (r) => r.chungLoai,
          priority: "detail",
          cell: (r) => r.chungLoai ? <span title={r.chungLoai} className="line-clamp-2 break-words text-sm leading-snug">{r.chungLoai}</span> : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
          key: "nhaSanXuat",
          label: "Nhà sản xuất",
          minW: "min-w-[170px]",
          cellClassName: "max-w-[220px]",
          filter: "cat",
          defaultHidden: true,
          hideBelow: "2xl",
          value: (r) => r.nhaSanXuat,
          priority: "detail",
          cell: (r) => r.nhaSanXuat ? <span title={r.nhaSanXuat} className="line-clamp-2 break-words text-sm leading-snug">{r.nhaSanXuat}</span> : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
          key: "donViQuanLy",
          label: "Đơn vị quản lý",
          minW: "min-w-[160px]",
          cellClassName: "max-w-[200px]",
          filter: "cat",
          hideBelow: "xl",
          value: (r) => r.donViQuanLy,
          priority: "secondary",
          cell: (r) => r.donViQuanLy ? <span title={r.donViQuanLy} className="line-clamp-2 break-words text-[12px] leading-snug">{r.donViQuanLy}</span> : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
          key: "viTri",
          label: "Vị trí",
          minW: "min-w-[160px]",
          cellClassName: "max-w-[200px]",
          filter: "cat",
          hideBelow: "lg",
          value: (r) => r.viTri,
          priority: "secondary",
          cell: (r) => r.viTri ? <span title={r.viTri} className="line-clamp-2 break-words text-[12px]">{r.viTri}</span> : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
          key: "trangThai",
          label: "Trạng thái",
          minW: "min-w-[130px]",
          align: "center",
          filter: "cat",
          value: (r) => r.trangThai,
          priority: "secondary",
          cell: (r) => r.trangThai ? <Badge variant="secondary" className="text-[10px]">{r.trangThai}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
          key: "actions",
          label: "Hành động",
          minW: "min-w-[150px]",
          align: "center",
          hideBelow: "md",
          value: () => "",
          cell: (r) => (
            <Button asChild size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" title="Mở sổ lý lịch tài sản">
              <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: (r as any).thietBiMa || (r as any).ma }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}>
                <ExternalLink className="h-3.5 w-3.5" /> Sổ lý lịch
              </Link>
            </Button>
          ),
        },
      ]}
    />
  );
}
