import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Search, X, Cpu, ExternalLink, Copy, Download, X as XIcon, Unplug, Wrench, PackageOpen, Loader2, Check, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";
import { thongDiepLoi } from "@/lib/mirats/errors";
import { StandardTable } from "@/components/mirats/StandardTable";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { InheritedValue, TextCell } from "./InheritedValue";
import { ContactCell, MetaPopover } from "./ContactCell";
import {
  buildContacts,
  buildMetaItems,
  formatContactsForExport,
  toDisplayString,
} from "@/lib/mirats/inventory/contact-format";
import { BulkActionButton } from "@/components/mirats/BulkActionButton";
import { TableExportDialog } from "@/components/mirats/TableExportDialog";
import { AnomalyBadge } from "@/components/mirats/AnomalyBadge";
import { MultiRoleBadge } from "@/components/mirats/MultiRoleBadge";
import { CellPreview, ModelCell, type TaiSanRow, useInfiniteTaiSanRows, useModelRegistry, useMultiRoleMap } from "../ThanhPhanTable";
import { normalize } from "@/lib/mirats/global-search";
import { csvFileName, downloadCsv, toCsv, trangThaiBaoHanh } from "@/lib/mirats/inventory/csv";

/**
 * Xuất CSV đúng 4 cột nghiệp vụ bắt buộc cho tập kết quả đang lọc.
 * ponytail: cố định 4 cột theo yêu cầu nghiệp vụ; cần xuất tuỳ biến thì dùng
 * hộp thoại "Xuất dữ liệu" sẵn có trên thanh công cụ bảng.
 */
function xuatCsvTaiSan(rows: readonly TaiSanRow[]) {
  if (rows.length === 0) {
    toast.error("Không có dữ liệu để xuất.");
    return;
  }
  const csv = toCsv([
    ["MODEL", "SERIAL", "Người liên hệ", "Trạng thái bảo hành"],
    ...rows.map((r) => [
      r.model ?? "",
      r.serial ?? "",
      formatContactsForExport(buildContacts(r)),
      trangThaiBaoHanh(r.hanBaoHanh),
    ]),
  ]);
  downloadCsv(csvFileName("thanh-phan-tai-san"), csv);
  toast.success(`Đã xuất ${rows.length} dòng ra CSV.`);
}

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
  setEditMode: (v: boolean) => void;
  allowEdit: boolean;
  ModeToggle: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ] = useDebounce(q, 500);
  const [bucket, setBucket] = useState<"all" | "0" | "1" | "2-3" | ">3">("all");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const qc = useQueryClient();
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
          r.maTaiSanBravo, r.namSanXuat, r.namKhaiThac, r.tinhTrangKyThuat, r.cheDoKdHc,
          r.trangThai, r.hanBaoHanh, trangThaiBaoHanh(r.hanBaoHanh),
          formatContactsForExport(buildContacts(r)),
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
      toast.error(thongDiepLoi(err, "Không thể sao chép vào bộ nhớ tạm."));
    }
  }

  async function deleteTaiSan(ids: string[]) {
    if (ids.length === 0) return;
    const { error: e } = await supabase
      .from("thiet_bi")
      .delete()
      .in("id", ids);
    if (e) {
      toast.error(thongDiepLoi(e, "Không thể xóa hàng loạt."));
      return;
    }
    toast.success(`Đã xóa ${ids.length} tài sản.`);
    qc.invalidateQueries({ queryKey: ["tai-san-infinite"] });
  }

  return (
    <StandardTable<TaiSanRow>
      tableKey={`${tableKey}:tai-san`}
      rows={filteredTaiSan}
      trangThai={{ dangTai: loadingTsReal || isFetchingTs, loi: errorTsReal }}
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
      maxHeightClass={hideHeader ? "min-h-0 flex-1 overflow-y-auto" : undefined}
      selectable
      exportable
      ten="tai-san"
      domain="thiet_bi"
      allowBulkDelete={allowEdit && editMode}
      onBulkDelete={async (ids) => deleteTaiSan(Array.from(ids))}
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
          <AppTooltip noiDung="Bỏ chọn">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={clear}>
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Bỏ chọn</span>
            </Button>
          </AppTooltip>
        </>
      )}
      toolbarLeft={
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
              <div className="flex items-center group relative">
                <Input
                  ref={searchInputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm tài sản…"
                  className={cn(
                    "h-7 w-[180px] bg-background text-xs shadow-sm ml-1 pr-7 transition-all",
                    loadingTsReal && "border-primary/50"
                  )}
                />
                {loadingTsReal && (
                  <div className="absolute right-7 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary/50" />
                  </div>
                )}
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
          <div className="flex items-center gap-1.5 text-meta font-medium text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-md border border-border/50">
            <span className="tabular-nums">
              {taiSanRows.length} / {totalTs > 0 ? totalTs.toLocaleString("vi-VN") : "—"} tài sản
            </span>
          </div>
        </div>
      }
      toolbarRight={({ filteredRows }) => (
        <AppTooltip noiDung="Xuất CSV: Model, Serial, Người liên hệ, Trạng thái bảo hành">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 px-2 text-meta font-semibold"
            disabled={loadingTsReal || filteredRows.length === 0}
            aria-label="Xuất CSV danh sách thành phần & tài sản đang lọc"
            onClick={() => xuatCsvTaiSan(filteredRows)}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </Button>
        </AppTooltip>
      )}

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
          minW: "min-w-[280px]",
          cellClassName: "max-w-[400px]",
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
          minW: "min-w-[140px]",
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
          label: "Đang lắp trong hệ thống",
          minW: "min-w-[220px]",
          cellClassName: "max-w-[300px]",
          filter: "text",
          value: (r) => `${r.danhSachHeThong} ${r.danhSachThanhPhan}`,
          priority: "primary",
          cell: (r) =>
            r.danhSachHeThong || r.danhSachThanhPhan ? (
              <div className="flex min-w-0 flex-col gap-0.5">
                <InheritedValue
                  value={r.danhSachHeThong || "—"}
                  nguon="Kế thừa từ quan hệ lắp đặt hiện hành"
                />
                <CellPreview
                  title={`Thành phần đang lắp — ${r.ma}`}
                  content={r.danhSachThanhPhan}
                  preformatted
                  className="line-clamp-2 whitespace-pre-line break-words text-meta leading-snug text-muted-foreground"
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        },
        {
          key: "danhSachThanhPhan",
          label: "Thành phần đang lắp",
          minW: "min-w-[160px]",
          cellClassName: "max-w-[200px]",
          filter: "text",
          defaultHidden: true,
          value: (r) => r.danhSachThanhPhan,
          cell: (r) => <CellPreview title={`Thành phần đang lắp — ${r.ma}`} content={r.danhSachThanhPhan} preformatted className="whitespace-pre-line break-words text-xs leading-relaxed line-clamp-4" />,
        },
        {
          key: "model",
          label: "Model & Serial",
          minW: "min-w-[180px]",
          cellClassName: "max-w-[240px]",
          filter: "cat",
          hideBelow: "lg",
          value: (r) => `${r.model} ${r.serial}`,
          priority: "secondary",
          cell: (r) => {
            // Popover chỉ chứa metadata BỔ SUNG — không lặp lại Model/Serial.
            const meta = buildMetaItems(
              [
                { label: "Chủng loại", value: r.chungLoai },
                { label: "Hãng SX", value: r.nhaSanXuat },
                { label: "P/N", value: r.pN },
                { label: "Mã Bravo", value: r.maTaiSanBravo },
                { label: "Năm SX", value: r.namSanXuat },
                { label: "Hạn bảo hành", value: r.hanBaoHanh },
                { label: "Nhà cung cấp", value: r.nhaCungCap },
              ],
              [r.model, r.serial],
            );
            return (
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-1">
                  <ModelCell model={r.model} modelId={r.modelId || undefined} registry={modelRegistry} />
                  <MetaPopover
                    title="Thông tin bổ sung"
                    items={meta}
                    label={`Xem thông tin bổ sung của tài sản ${r.ma}`}
                  />
                </div>
                {r.serial ? (
                  <span className="block truncate font-mono text-meta text-muted-foreground">
                    {r.serial}
                  </span>
                ) : null}
              </div>
            );
          },
        },
        {
          key: "serial",
          label: "Serial",
          minW: "min-w-[130px]",
          filter: "text",
          defaultHidden: true,
          value: (r) => r.serial,
          cell: (r) => <span className="break-all font-mono text-xs text-muted-foreground">{r.serial || "—"}</span>,
        },
        {
          key: "lienHe",
          label: "Liên hệ",
          minW: "min-w-[180px]",
          cellClassName: "max-w-[240px]",
          filter: "text",
          hideBelow: "xl",
          priority: "secondary",
          value: (r) => formatContactsForExport(buildContacts(r)),
          cell: (r) => <ContactCell contacts={buildContacts(r)} />,
        },
        {
          key: "nhaCungCap",
          label: "Nhà cung cấp",
          minW: "min-w-[170px]",
          cellClassName: "max-w-[220px]",
          filter: "cat",
          defaultHidden: true,
          value: (r) => r.nhaCungCap,
          cell: (r) => <TextCell value={r.nhaCungCap} />,
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
          cell: (r) => <TextCell value={r.chungLoai} />,
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
          key: "viTri",
          label: "Vị trí & Đơn vị quản lý",
          minW: "min-w-[180px]",
          cellClassName: "max-w-[240px]",
          filter: "cat",
          hideBelow: "lg",
          value: (r) => `${r.viTri} ${r.donViQuanLy}`,
          priority: "secondary",
          cell: (r) => (
            <div className="flex min-w-0 flex-col gap-0.5">
              <TextCell value={r.viTri} dong={1} />
              <InheritedValue
                value={r.donViQuanLy}
                nguon="Kế thừa từ đơn vị quản lý tài sản"
                className="text-meta"
              />
            </div>
          ),
        },
        {
          key: "donViQuanLy",
          label: "Đơn vị quản lý",
          minW: "min-w-[160px]",
          filter: "cat",
          defaultHidden: true,
          value: (r) => r.donViQuanLy,
          cell: (r) => <TextCell value={r.donViQuanLy} dong={1} />,
        },
        {
          key: "trangThai",
          label: "Trạng thái",
          minW: "min-w-[130px]",
          align: "center",
          filter: "cat",
          value: (r) => r.trangThai,
          priority: "secondary",
          cell: (r) => r.trangThai ? <Badge variant="secondary" className="text-mini">{r.trangThai}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
        },
        // ---- Metadata (chỉ hiện ở chế độ "Tất cả cột" / khi bật thủ công) ----
        ...([
          ["pN", "P/N", (r: TaiSanRow) => r.pN],
          ["maTaiSanBravo", "Mã tài sản Bravo", (r: TaiSanRow) => r.maTaiSanBravo],
          ["namSanXuat", "Năm sản xuất", (r: TaiSanRow) => r.namSanXuat],
          ["namKhaiThac", "Năm khai thác", (r: TaiSanRow) => r.namKhaiThac],
          ["ngayMua", "Ngày mua", (r: TaiSanRow) => r.ngayMua],
          ["hanBaoHanh", "Hạn bảo hành", (r: TaiSanRow) => r.hanBaoHanh],
          ["tyLeTuoiTho", "Tỷ lệ tuổi thọ", (r: TaiSanRow) => r.tyLeTuoiTho],
          ["tinhTrangKyThuat", "Tình trạng kỹ thuật", (r: TaiSanRow) => r.tinhTrangKyThuat],
          ["cheDoKdHc", "Chế độ KĐ/HC", (r: TaiSanRow) => r.cheDoKdHc],
          ["ngayBaoTriGanNhat", "Bảo trì gần nhất", (r: TaiSanRow) => r.ngayBaoTriGanNhat],
          ["ngayBaoTriKeTiep", "Bảo trì kế tiếp", (r: TaiSanRow) => r.ngayBaoTriKeTiep],
        ] as const).map(([key, label, get]) => ({
          key,
          label,
          minW: "min-w-[140px]",
          defaultHidden: true,
          value: (r: TaiSanRow) => toDisplayString(get(r)),
          cell: (r: TaiSanRow) => <TextCell value={toDisplayString(get(r))} dong={1} />,
        })),
        {
          key: "actions",
          label: "",
          minW: "min-w-[56px]",
          align: "center",
          hideBelow: "md",
          value: () => "",
          cell: (r) => (
            <AppTooltip noiDung="Mở sổ lý lịch tài sản">
              <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                <Link
                  to="/thiet-bi/$maThietBi"
                  params={{ maThietBi: r.ma }}
                  search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                  aria-label={`Mở sổ lý lịch ${r.ma}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </AppTooltip>
          ),
        },
      ]}
    />
  );
}
