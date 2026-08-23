import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { 
  Search, X, Copy, Download, X as XIcon, Check, Pencil, ExternalLink, 
  Unplug, Wrench, PackageOpen, LayoutGrid, Loader2, Cpu, XCircle 
} from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { thongDiepLoi } from "@/lib/mirats/errors";
import { useSession } from "@/hooks/use-session";
import { canWrite } from "@/lib/mirats/quyen";
import { StandardTable } from "@/components/mirats/StandardTable";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { TableExportDialog } from "@/components/mirats/TableExportDialog";
import { BulkActionButton } from "@/components/mirats/BulkActionButton";
import { MultiRoleBadge } from "@/components/mirats/MultiRoleBadge";
import { THANH_PHAN_PRESETS } from "@/lib/mirats/ui/tp-presets";
import { useMultiRoleMap } from "@/lib/mirats/he-thong-thanh-phan";
import { ThanhPhanChiTietDialog } from "@/components/mirats/ThanhPhanChiTietDialog";
import { KhaiThemCumButtons } from "@/components/mirats/KhaiThemDialogs";
import { OperationDialog } from "@/components/mirats/OperationDialog";
import { Combobox } from "@/components/mirats/Combobox";
import { EntityHoverCard } from "@/components/mirats/EntityHoverCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useInfiniteThanhPhanRows, type ThanhPhanRow, TT_LABEL, LY_DO_KHOA } from "../ThanhPhanTable";

export function ComponentTablePanel({
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
  const [debouncedQ] = useDebounce(q, 500);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTp, setSelectedTp] = useState<{ row: ThanhPhanRow; heThongId: string } | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { roles } = useSession();
  const { data: multiRoleMap } = useMultiRoleMap();

  const {
    data: rowsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteThanhPhanRows(debouncedQ, true);

  const rows = useMemo(() => rowsData?.pages.flatMap((p) => p.rows) ?? [], [rowsData]);
  const totalTp = rowsData?.pages[0]?.totalCount ?? 0;

  async function bulkTrangThai(ids: string[], trangThai: "hoat_dong" | "ngung", clear: () => void) {
    if (ids.length === 0) return;
    setBulkBusy(true);
    const { error: e } = await supabase
      .from("he_thong_thanh_phan")
      .update({ trang_thai: trangThai })
      .in("id", ids);
    setBulkBusy(false);
    if (e) {
      toast.error(e.message || "Không cập nhật được trạng thái hàng loạt.");
      return;
    }
    toast.success(`Đã đặt ${ids.length} thành phần → ${TT_LABEL[trangThai]}.`);
    clear();
    qc.invalidateQueries({ queryKey: ["thanh-phan-infinite"] });
  }

  async function saveField(id: string, field: "ten" | "trang_thai", value: string) {
    try {
      if (field === "ten") {
        const { saveEntityFieldSecurely } = await import("@/lib/mirats/ui/save-entity-securely");
        await saveEntityFieldSecurely({
          kind: "tp",
          id,
          field: "ten",
          value,
          userRoles: roles || [],
        });
        toast.success("Đã lưu tên thành công");
      } else {
        const { error: e } = await supabase
          .from("he_thong_thanh_phan")
          .update({ trang_thai: value })
          .eq("id", id);
        if (e) throw e;
        toast.success("Đã cập nhật trạng thái");
      }
      qc.invalidateQueries({ queryKey: ["thanh-phan-infinite"] });
    } catch (error: unknown) {
      toast.error(thongDiepLoi(error, "Không lưu được thay đổi"));
      throw error;
    }
  }

  return (
    <>
      <StandardTable<ThanhPhanRow>
        className="astryx-table"
        tableKey={tableKey}
        rows={rows}
        trangThai={{ dangTai: isLoading || isFetchingNextPage, loi: error }}
        infiniteScroll={{
          hasNextPage,
          fetchNextPage,
          isFetchingNextPage,
          totalCount: totalTp,
        }}
        getRowId={(r) => r.id}
        selected={selectedIds}
        setSelected={setSelectedIds}
        requireFilterToShow={false}
        emptyText="Không có thành phần hệ thống phù hợp."
        countUnit="thành phần"
        maxHeightClass={hideHeader ? "min-h-0 flex-1" : undefined}
        selectable
        editMode={editMode}
        presets={THANH_PHAN_PRESETS}
        bulkActions={({ selectedRows, visibleColumns, allColumns, filteredRows, pageRows, clear }) => (
          <>
            <BulkActionButton
              label="Đặt Hoạt động"
              icon={<Check className="h-3.5 w-3.5" />}
              duocPhep={allowEdit}
              lyDoKhoa={LY_DO_KHOA}
              busy={bulkBusy}
              variant="outline"
              xacNhan={{
                tieuDe: "Đặt trạng thái Hoạt động?",
                moTa: (
                  <div>
                    Sẽ đặt trạng thái <b>Hoạt động</b> cho <b>{selectedRows.length}</b> thành phần đã chọn.
                  </div>
                ),
                nutXacNhan: "Đặt Hoạt động",
              }}
              onRun={() => bulkTrangThai(selectedRows.map((r) => r.id), "hoat_dong", clear)}
            />
            <BulkActionButton
              label="Đặt Đã ngừng"
              icon={<XCircle className="h-3.5 w-3.5" />}
              duocPhep={allowEdit}
              lyDoKhoa={LY_DO_KHOA}
              busy={bulkBusy}
              variant="outline"
              xacNhan={{
                tieuDe: "Đặt trạng thái Đã ngừng?",
                moTa: (
                  <div>
                    Sẽ đặt trạng thái <b>Đã ngừng</b> cho <b>{selectedRows.length}</b> thành phần đã chọn.
                  </div>
                ),
                nutXacNhan: "Đặt Đã ngừng",
                nguyHiem: true,
              }}
              onRun={() => bulkTrangThai(selectedRows.map((r) => r.id), "ngung", clear)}
            />
            <BulkActionButton
              label="Sao chép mã"
              icon={<Copy className="h-3.5 w-3.5" />}
              variant="outline"
              xacNhan={{
                tieuDe: "Sao chép mã các dòng đã chọn?",
                moTa: <>Sẽ chép <b>{selectedRows.length}</b> mã thành phần vào bộ nhớ tạm.</>,
                nutXacNhan: "Sao chép",
              }}
              onRun={() => {
                const codes = selectedRows.map((r) => r.ma).filter(Boolean);
                navigator.clipboard.writeText(codes.join("\n"));
                toast.success(`Đã sao chép ${codes.length} mã.`);
              }}
            />
            <TableExportDialog<ThanhPhanRow>
              ten="thanh-phan"
              countUnit="thành phần"
              visibleColumns={visibleColumns}
              allColumns={allColumns}
              rowsByScope={{ selected: selectedRows, filtered: filteredRows, page: pageRows }}
              trigger={
                <AppTooltip noiDung="Xuất dữ liệu ra file CSV">
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </AppTooltip>
              }
            />
            <AppTooltip noiDung="Bỏ chọn tất cả">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={clear}>
                <XIcon className="h-4 w-4" />
              </Button>
            </AppTooltip>
          </>
        )}
        toolbarLeft={
          <div className="flex items-center gap-1.5">
            {allowEdit && (
              <div className="flex items-center gap-1">
                {editMode && <KhaiThemCumButtons />}
                <AppTooltip noiDung={editMode ? "Hoàn tất chỉnh sửa" : "Bật chỉnh sửa nhanh"}>
                  <Button
                    size="sm"
                    variant={editMode ? "default" : "outline"}
                    className="h-7 w-7 p-0"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                </AppTooltip>
              </div>
            )}
            {ModeToggle}
            <div className="relative flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", (searchExpanded || q) && "text-primary")}
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
                    placeholder="Tìm vai trò, tên…"
                    className="h-7 w-[180px] bg-background text-xs shadow-sm ml-1 pr-7"
                  />
                  {q && (
                    <button type="button" onClick={() => setQ("")} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-md border">
              <span className="tabular-nums">Đã tải {rows.length} / {totalTp.toLocaleString("vi-VN")} thành phần</span>
            </div>
          </div>
        }
        columns={[
          {
            key: "ten",
            label: "Thành phần & Mã",
            minW: "min-w-[240px]",
            cellClassName: "max-w-[320px]",
            sticky: true,
            priority: "primary",
            cell: (r) => (
              <div className="group flex flex-col gap-0.5 cursor-pointer p-1" onClick={() => setSelectedTp({ row: r, heThongId: r.heThongId })}>
                {editMode && allowEdit ? (
                  <InlineTextEdit initial={r.ten} onSave={(v) => saveField(r.id, "ten", v)} />
                ) : (
                  <span className="line-clamp-2 text-[12px] font-bold">{r.ten || "—"}</span>
                )}
                {r.ma && <CodeBadge code={r.ma} className="bg-transparent border-transparent text-muted-foreground" />}
              </div>
            ),
          },
          { key: "heThong", label: "Hệ thống", minW: "min-w-[200px]", cell: (r) => <span className="text-[12px]">{r.heThong}</span> },
          { key: "nhomHeThong", label: "Nhóm hệ thống", minW: "min-w-[160px]", hideBelow: "md" },
          { key: "phanLoai", label: "Phân loại", minW: "min-w-[160px]", hideBelow: "md" },
          { key: "ma", label: "Mã TP", minW: "min-w-[140px]", defaultHidden: true, cell: (r) => <CodeBadge code={r.ma} /> },
          {
            key: "viTri",
            label: "Vị trí",
            minW: "min-w-[180px]",
            cell: (r) => (
              editMode && allowEdit ? (
                <InlineViTriEdit row={r} onChanged={() => qc.invalidateQueries({ queryKey: ["thanh-phan-infinite"] })} />
              ) : <span className="text-[12px]">{r.viTri || "—"}</span>
            )
          },
          {
            key: "trangThai",
            label: "Trạng thái",
            minW: "min-w-[120px]",
            align: "center",
            cell: (r) => (
              editMode && allowEdit ? (
                <Select
                  value={r.trangThai === "Hoạt động" ? "hoat_dong" : r.trangThai === "Đã ngừng" ? "ngung" : ""}
                  onValueChange={(v) => void saveField(r.id, "trang_thai", v)}
                >
                  <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoat_dong">Hoạt động</SelectItem>
                    <SelectItem value="ngung">Đã ngừng</SelectItem>
                  </SelectContent>
                </Select>
              ) : <Badge variant={r.trangThai === "Hoạt động" ? "secondary" : "outline"}>{r.trangThai}</Badge>
            )
          },
          {
            key: "thietBi",
            label: "Tài sản lắp",
            minW: "min-w-[240px]",
            cell: (r) => (
              editMode && allowEdit ? (
                <InlineTaiSanEdit row={r} onChanged={() => qc.invalidateQueries({ queryKey: ["thanh-phan-infinite"] })} />
              ) : r.daLap ? (
                <div className="flex items-start gap-1.5">
                  <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: r.thietBiMa }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="flex-1 hover:text-primary">
                    <span className="line-clamp-2 text-[12px] font-bold">{r.thietBiTen || "—"}</span>
                    <div className="flex items-center gap-1.5">
                      <CodeBadge code={r.thietBiMa} />
                      <MultiRoleBadge info={multiRoleMap?.byMa.get(r.thietBiMa)} compact currentThanhPhanId={r.id} />
                    </div>
                  </Link>
                </div>
              ) : <Badge variant="outline" className="h-8 w-full border-dashed opacity-50"><Unplug className="h-3 w-3 mr-1" /> Trống</Badge>
            )
          },
          {
            key: "actions",
            label: "Hành động",
            minW: "min-w-[150px]",
            align: "center",
            cell: (r) => (
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setSelectedTp({ row: r, heThongId: r.heThongId })}>
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Chi tiết
              </Button>
            )
          }
        ]}
      />

      {selectedTp && (
        <ThanhPhanChiTietDialog
          viTri={{
            id: selectedTp.row.id,
            ma_thanh_phan: selectedTp.row.ma,
            ten: selectedTp.row.ten,
            he_thong_id: selectedTp.row.heThongId,
            loai_thiet_bi_yeu_cau: selectedTp.row.modelId,
            trang_thai: selectedTp.row.trangThai === "Đã ngừng" ? "ngung" : "hoat_dong",
            bat_buoc: false,
            device: selectedTp.row.daLap ? {
              thiet_bi_id: "",
              ma_thiet_bi: selectedTp.row.thietBiMa,
              ten_thiet_bi: selectedTp.row.thietBiTen,
              ma_serial: selectedTp.row.thietBiSerial,
            } : null,
          } as any}
          heThongId={selectedTp.heThongId}
          canManage={allowEdit}
          onClose={() => setSelectedTp(null)}
          onOpenDevice={(ma) => navigate({ to: "/thiet-bi/$maThietBi", params: { maThietBi: ma }, search: { tab: "tong-quan", doc: undefined, q: undefined } })}
        />
      )}
    </>
  );
}

// Re-implementing minor helpers inside the file to keep it self-contained for the panel split
function InlineTextEdit({ initial, onSave }: { initial: string; onSave: (v: string) => Promise<void> }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const initialRef = useRef(initial);

  async function commit() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave(value);
      setDirty(false);
      initialRef.current = value;
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Input
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(e.target.value !== initialRef.current); }}
        onKeyDown={(e) => e.key === "Enter" && void commit()}
        className="h-7 border-none bg-transparent p-0 text-[12px] font-bold focus-visible:ring-0"
        disabled={saving}
      />
      {dirty && !saving && <button type="button" onClick={commit} className="text-emerald-600"><Check className="h-3.5 w-3.5" /></button>}
    </div>
  );
}

function InlineViTriEdit({ row, onChanged }: { row: ThanhPhanRow; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const { data: dsViTri = [], isLoading } = useQuery({
    queryKey: ["dm-vi-tri-picker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_vi_tri").select("id, ma, ten").eq("active", true).is("merged_into", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const options = useMemo(() => [{ value: "", label: "— Trống —" }, ...dsViTri.map(v => ({ value: v.id, label: v.ten, hint: v.ma }))], [dsViTri]);

  async function save(v: string) {
    setSaving(true);
    try {
      const { error } = await supabase.from("he_thong_thanh_phan").update({ vi_tri_id: v || null }).eq("id", row.id);
      if (error) throw error;
      toast.success("Đã cập nhật vị trí");
      onChanged();
    } finally { setSaving(false); }
  }

  return (
    <Combobox options={options} value={row.viTriId ?? ""} onChange={save} loading={isLoading} className="h-7 w-[200px] text-[11px]" />
  );
}

function InlineTaiSanEdit({ row, onChanged }: { row: ThanhPhanRow; onChanged: () => void }) {
  const [op, setOp] = useState<{ mode: "lap" | "thao" | "thay"; target: any } | null>(null);
  const target = useMemo(() => ({ heThongId: row.heThongId, thanhPhanId: row.id, maThanhPhan: row.ma, tenThanhPhan: row.ten, viTriId: row.viTriId }), [row]);

  return (
    <div className="flex flex-col gap-1">
      {row.daLap && (
        <div className="flex items-center gap-1">
          <CodeBadge code={row.thietBiMa} />
          <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setOp({ mode: "thao", target })}>Tháo</Button>
        </div>
      )}
      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setOp({ mode: row.daLap ? "thay" : "lap", target })}>
        {row.daLap ? "Thay thế…" : "Lắp tài sản…"}
      </Button>
      {op && <OperationDialog mode={op.mode as any} target={op.target} onClose={() => setOp(null)} onSuccess={onChanged} />}
    </div>
  );
}
