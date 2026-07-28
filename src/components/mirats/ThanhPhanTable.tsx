import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Component, Loader2, Search, X, Cpu, Eye, Network, ExternalLink, Pencil, Check, XCircle, Lock, ChevronLeft, ChevronRight, Unplug, Package, LayoutGrid } from "lucide-react";
import { AnomalyBadge } from "@/components/mirats/AnomalyBadge";
import { useUserPref } from "@/hooks/use-user-pref";
import { StandardTable } from "@/components/mirats/StandardTable";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { Combobox } from "@/components/mirats/Combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTaxonomy } from "@/hooks/use-realtime-taxonomy";
import { normalize } from "@/lib/mirats/global-search";
import { useSession } from "@/hooks/use-session";
import { canWrite } from "@/lib/mirats/quyen";
import { useThietBiChon, useLapThietBi } from "@/lib/mirats/he-thong-thanh-phan";
import { useMultiRoleMap } from "@/lib/mirats/he-thong-thanh-phan";
import { MultiRoleBadge } from "@/components/mirats/MultiRoleBadge";
import { ThaoTaiSanDialog, type ThaoTaiSanTarget } from "@/components/mirats/ThaoTaiSanDialog";
import { KhaiThemCumButtons } from "@/components/mirats/KhaiThemDialogs";

// ---- Kiểu dữ liệu 1 dòng ở chế độ "Theo tài sản": 1 TÀI SẢN + tổng hợp thành phần đang lắp
export type TaiSanRow = {
  id: string;
  ma: string;
  ten: string;
  serial: string;
  model: string;
  chungLoai: string;
  nhaSanXuat: string;
  nhaCungCap: string;
  donViQuanLy: string;
  trangThai: string;
  viTri: string;
  soThanhPhanDangGan: number;
  danhSachThanhPhan: string;
  danhSachHeThong: string;
  // Mở rộng: các thuộc tính chi tiết của tài sản
  pN: string;
  maTaiSanBravo: string;
  namSanXuat: string;
  namKhaiThac: string;
  ngayMua: string;
  hanBaoHanh: string;
  tyLeTuoiTho: string;
  tinhTrangKyThuat: string;
  cheDoKdHc: string;
  ngayBaoTriGanNhat: string;
  ngayBaoTriKeTiep: string;
  // GĐ2-06 anomaly hint
  soSuCo90n: number;
  anomalyScore: number;
};


export function useTaiSanRows() {
  return useQuery({
    queryKey: ["tai-san-thanh-phan-toan-cuc"],
    staleTime: 60_000,
    queryFn: async (): Promise<TaiSanRow[]> => {
      const { data, error } = await supabase.rpc("rpc_tai_san_toan_cuc");
      if (error) throw error;
      return (data ?? []) as TaiSanRow[];
    },
  });
}

// ---- Kiểu dữ liệu 1 dòng: 1 THÀNH PHẦN HỆ THỐNG (vai trò) + tài sản đang lắp (kế thừa)
export type ThanhPhanRow = {
  id: string;
  ma: string;
  ten: string;
  nhomHeThong: string;
  phanLoai: string;
  heThong: string;
  heThongId: string;
  viTriId: string | null;
  loaiYeuCau: string;
  viTri: string;
  trangThai: string;
  // Tài sản đang lắp (rỗng khi chưa lắp)
  thietBiMa: string;
  thietBiTen: string;
  thietBiSerial: string;
  model: string;
  chungLoai: string;
  nhaSanXuat: string;
  nhaCungCap: string;
  daLap: boolean;
  soThanhPhanCuaTaiSan: number;
  // Mở rộng: các thuộc tính của tài sản đang lắp
  taiSanTrangThai: string;
  namSanXuat: string;
  namKhaiThac: string;
  ngayMua: string;
  hanBaoHanh: string;
  pN: string;
  maTaiSanBravo: string;
  tyLeTuoiTho: string;
  tinhTrangKyThuat: string;
  ngayBaoTriGanNhat: string;
  ngayBaoTriKeTiep: string;
  cheDoKdHc: string;
  taiSanViTri: string;
  taiSanDonViQuanLy: string;
};

const TT_LABEL: Record<string, string> = { hoat_dong: "Hoạt động", ngung: "Đã ngừng" };

export function useThanhPhanRows() {
  return useQuery({
    queryKey: ["thanh-phan-toan-cuc"],
    staleTime: 60_000,
    queryFn: async (): Promise<ThanhPhanRow[]> => {
      const { data, error } = await supabase.rpc("rpc_thanh_phan_toan_cuc");
      if (error) throw error;
      return (data ?? []) as ThanhPhanRow[];
    },
  });
}

export type ThanhPhanTableProps = {
  /** Ẩn khối header (tiêu đề + mô tả) khi nhúng vào trang khác */
  hideHeader?: boolean;
  /** Đặt tableKey để lưu preference cột riêng cho từng vị trí nhúng */
  tableKey?: string;
  /** Khi nhúng, cho phép trang cha điều khiển chế độ chỉnh sửa để tránh 2 nút. */
  externalEditMode?: boolean;
};

export function ThanhPhanTable({ hideHeader = false, tableKey = "he-thong:thanh-phan-toan-cuc", externalEditMode }: ThanhPhanTableProps) {
  const { data: rows = [], isLoading, error } = useThanhPhanRows();
  const { data: taiSanRows = [], isLoading: loadingTS, error: errorTS } = useTaiSanRows();
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useUserPref<"component" | "asset">("thanh-phan:view-mode", "component");
  const [bucket, setBucket] = useState<"all" | "0" | "1" | "2-3" | ">3">("all");
  const [internalEditMode, setInternalEditMode] = useState(false);
  const editMode = externalEditMode !== undefined ? externalEditMode : internalEditMode;
  const setEditMode = setInternalEditMode;
  const navigate = useNavigate();
  const qc = useQueryClient();
  useRealtimeTaxonomy();
  const { roles } = useSession();
  const allowEdit = canWrite("he_thong", roles);

  async function saveField(id: string, field: "ten" | "trang_thai", value: string) {
    const payload = (field === "ten" ? { ten: value } : { trang_thai: value }) as {
      ten?: string;
      trang_thai?: string;
    };
    const { error: e } = await supabase
      .from("he_thong_thanh_phan")
      .update(payload)
      .eq("id", id);
    if (e) {
      toast.error(e.message || "Không lưu được thay đổi");
      throw e;
    }
    toast.success("Đã lưu");
    qc.invalidateQueries({ queryKey: ["thanh-phan-toan-cuc"] });
  }

  const filtered = useMemo(() => {
    const t = normalize(q).trim();
    if (!t) return rows;
    return rows.filter((r) =>
      normalize(
        [
          r.ma, r.ten, r.nhomHeThong, r.phanLoai, r.heThong,
          r.thietBiMa, r.thietBiTen, r.thietBiSerial,
          r.model, r.chungLoai, r.nhaSanXuat, r.nhaCungCap,
          r.loaiYeuCau, r.viTri,
          r.pN, r.maTaiSanBravo, r.namSanXuat, r.namKhaiThac,
          r.taiSanTrangThai, r.taiSanViTri, r.taiSanDonViQuanLy,
          r.tinhTrangKyThuat, r.cheDoKdHc,
        ].join(" "),
      ).includes(t),
    );
  }, [rows, q]);

  const filteredTaiSan = useMemo(() => {
    const t = normalize(q).trim();
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
        [r.ma, r.ten, r.serial, r.model, r.chungLoai, r.nhaSanXuat, r.nhaCungCap, r.donViQuanLy, r.viTri, r.danhSachHeThong, r.danhSachThanhPhan, r.pN, r.maTaiSanBravo, r.namSanXuat, r.namKhaiThac, r.tinhTrangKyThuat, r.cheDoKdHc].join(" "),
      ).includes(t);
    });

  }, [taiSanRows, q, bucket]);

  const soLap = useMemo(() => filtered.filter((r) => r.daLap).length, [filtered]);
  const soTaiSanCoLap = useMemo(() => filteredTaiSan.filter((r) => r.soThanhPhanDangGan > 0).length, [filteredTaiSan]);

  // ---- Phân trang phía client ----
  // `filteredTotal` = tổng số dòng SAU khi StandardTable áp dụng bộ lọc cột (nhận qua callback).
  // Nhờ vậy bộ lọc chạy trên TOÀN BỘ dữ liệu, không chỉ trang hiện tại.
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState(1);
  const [filteredTotal, setFilteredTotal] = useState(0);
  useEffect(() => { setPage(1); }, [q, pageSize, viewMode, bucket]);
  const total = filteredTotal;
  const totalPages = pageSize >= total ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = (currentPage - 1) * pageSize;

  const ModeToggle = (
    <div className="inline-flex items-center rounded-md border bg-muted/30 p-0.5">
      <Button
        size="sm"
        variant={viewMode === "component" ? "default" : "ghost"}
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={() => setViewMode("component")}
        title="1 dòng = 1 thành phần hệ thống"
      >
        <LayoutGrid className="h-3.5 w-3.5" /> Theo thành phần
        <Badge variant="secondary" className="ml-1 px-1 text-[10px]">{rows.length.toLocaleString("vi-VN")}</Badge>
      </Button>
      <Button
        size="sm"
        variant={viewMode === "asset" ? "default" : "ghost"}
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={() => setViewMode("asset")}
        title="1 dòng = 1 tài sản, hiện số thành phần đang gắn"
      >
        <Package className="h-3.5 w-3.5" /> Theo tài sản
        <Badge variant="secondary" className="ml-1 px-1 text-[10px]">{taiSanRows.length.toLocaleString("vi-VN")}</Badge>
      </Button>
    </div>
  );



  return (
    <div className={hideHeader ? "flex h-full min-h-0 flex-col gap-3" : "space-y-4 p-4 sm:p-6 lg:p-8"}>
      {!hideHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Component className="h-6 w-6 text-primary" /> Hệ thống — Thành phần & tài sản
              {editMode ? (
                <Badge className="ml-1 gap-1 bg-primary/10 text-[11px] text-primary hover:bg-primary/15">
                  <Pencil className="h-3 w-3" /> Đang chỉnh sửa
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-1 gap-1 border-amber-500/40 text-[11px] text-amber-700 dark:text-amber-400">
                  <Eye className="h-3 w-3" /> Chỉ tra cứu
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bảng ở mức <span className="font-medium">thành phần hệ thống</span>: nhóm — hệ thống — thành phần — <span className="font-medium">tài sản đang lắp</span> (kế thừa serial, model, chủng loại, NSX, NCC) — vị trí — trạng thái. Thành phần chưa lắp tài sản thì các cột kế thừa để trống.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ModeToggle}
            {allowEdit && editMode && <KhaiThemCumButtons />}
            {allowEdit ? (
              <Button
                size="sm"
                variant={editMode ? "default" : "outline"}
                className="gap-1.5"
                onClick={() => setEditMode((v) => !v)}
                title="Bật chỉnh sửa nhanh: Tên, Trạng thái, Tài sản đang lắp"
              >
                {editMode ? (<><Check className="h-4 w-4" /> Xong</>) : (<><Pencil className="h-4 w-4" /> Chỉnh sửa</>)}
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5" disabled title="Bạn không có quyền chỉnh sửa">
                <Lock className="h-4 w-4" /> Chỉ tra cứu
              </Button>
            )}
            <Button asChild size="sm" variant="default" className="gap-1.5">
              <Link to="/he-thong/cay">
                <Network className="h-4 w-4" /> Quản lý trong cây hệ thống
              </Link>
            </Button>
          </div>
        </div>
      )}

      {hideHeader && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {ModeToggle}
          {allowEdit && editMode && <KhaiThemCumButtons />}
          {allowEdit && externalEditMode === undefined && (
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => setEditMode((v) => !v)}
              title="Bật chỉnh sửa nhanh: Tên, Trạng thái, Tài sản đang lắp"
            >
              {editMode ? (<><Check className="h-4 w-4" /> Xong</>) : (<><Pencil className="h-4 w-4" /> Chỉnh sửa</>)}
            </Button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu…
        </div>
      )}
      {error && (
        <div className="text-sm text-destructive">Lỗi tải dữ liệu: {(error as Error).message}</div>
      )}

      {!isLoading && !error && viewMode === "component" && (
        <StandardTable<ThanhPhanRow>
          tableKey={tableKey}
          rows={filtered}
          clientPagination={{ page: currentPage, pageSize, onFilteredTotalChange: setFilteredTotal }}
          getRowId={(r) => r.id}
          requireFilterToShow={false}
          emptyText="Không có thành phần hệ thống phù hợp."
          countUnit="thành phần"
          maxHeightClass={hideHeader ? "min-h-0 flex-1" : undefined}
          toolbarLeft={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm mã vai trò, tên, hệ thống, tài sản, serial…"
                  className="h-8 w-[300px] pl-7 pr-7"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Xoá tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Cpu className="h-3 w-3" /> {soLap.toLocaleString("vi-VN")} đã lắp tài sản
              </Badge>
              <div className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Hiển thị</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(v === "all" ? Math.max(total, 1) : Number(v))}>
                  <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="all">Tất cả</SelectItem>
                  </SelectContent>
                </Select>
                <span>/ trang</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Trang trước">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {total === 0 ? "0" : `${pageStart + 1}–${Math.min(pageStart + pageSize, total)}`} / {total.toLocaleString("vi-VN")}
                  <span className="mx-1">·</span>
                  Trang {currentPage}/{totalPages}
                </span>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Trang sau">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          }

          columns={[
            // ==== Cột thuộc THÀNH PHẦN HỆ THỐNG (không kế thừa) ====
            {
              key: "ten",
              label: "Thành phần hệ thống",
              minW: "min-w-[240px]",
              cellClassName: "max-w-[280px]",
              filter: "text",
              sticky: true,
              value: (r) => r.ten,
              cell: (r) =>
                editMode && allowEdit ? (
                  <InlineTextEdit
                    initial={r.ten}
                    placeholder="Tên thành phần"
                    onSave={(v) => saveField(r.id, "ten", v)}
                  />
                ) : (
                  <span title={r.ten} className="line-clamp-2 break-words font-medium leading-snug">{r.ten || "—"}</span>
                ),
            },
            { key: "heThong", label: "Hệ thống", minW: "min-w-[200px]", cellClassName: "max-w-[240px]", filter: "cat", value: (r) => r.heThong },
            { key: "nhomHeThong", label: "Nhóm hệ thống", minW: "min-w-[160px]", cellClassName: "max-w-[200px]", filter: "cat", value: (r) => r.nhomHeThong, hideBelow: "md" },
            { key: "phanLoai", label: "Phân loại hệ thống", minW: "min-w-[160px]", cellClassName: "max-w-[200px]", filter: "cat", value: (r) => r.phanLoai, hideBelow: "md" },
            {
              key: "ma",
              label: "Mã thành phần",
              minW: "min-w-[140px]",
              filter: "text",
              value: (r) => r.ma,
              cell: (r) => <CodeBadge code={r.ma} />,
              hideBelow: "lg",
              defaultHidden: true,
            },
            { key: "viTri", label: "Vị trí lắp đặt", minW: "min-w-[160px]", cellClassName: "max-w-[200px]", filter: "text", value: (r) => r.viTri, hideBelow: "lg" },
            { key: "loai", label: "Loại yêu cầu", minW: "min-w-[150px]", cellClassName: "max-w-[180px]", filter: "cat", value: (r) => r.loaiYeuCau, hideBelow: "xl" },
            {
              key: "trangThai",
              label: "Trạng thái",
              minW: "min-w-[120px]",
              align: "center",
              filter: "cat",
              value: (r) => r.trangThai,
              cell: (r) =>
                editMode && allowEdit ? (
                  <Select
                    value={r.trangThai === "Hoạt động" ? "hoat_dong" : r.trangThai === "Đã ngừng" ? "ngung" : ""}
                    onValueChange={(v) => { void saveField(r.id, "trang_thai", v); }}
                  >
                    <SelectTrigger className="h-7 w-[130px] text-xs">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoat_dong">Hoạt động</SelectItem>
                      <SelectItem value="ngung">Đã ngừng</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={r.trangThai === "Hoạt động" ? "secondary" : "outline"} className="text-[11px]">
                    {r.trangThai || "—"}
                  </Badge>
                ),
            },
            // ==== TÀI SẢN ĐANG LẮP + các cột KẾ THỪA từ tài sản ====
            {
              key: "thietBi",
              label: "Tài sản đang lắp",
              minW: "min-w-[240px]",
              cellClassName: "max-w-[280px]",
              filter: "text",
              value: (r) => [r.thietBiMa, r.thietBiTen].filter(Boolean).join(" "),
              cell: (r) =>
                editMode && allowEdit ? (
                  <InlineTaiSanEdit row={r} onChanged={() => qc.invalidateQueries({ queryKey: ["thanh-phan-toan-cuc"] })} />
                ) : r.daLap ? (
                  <Link
                    to="/thiet-bi/$maThietBi"
                    params={{ maThietBi: r.thietBiMa }}
                    className="group flex items-start gap-1.5 rounded-sm hover:bg-primary/5 -mx-1 px-1 py-0.5"
                    title="Mở sổ lý lịch tài sản"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span title={r.thietBiTen} className="line-clamp-2 break-words text-sm font-medium leading-snug group-hover:text-primary group-hover:underline">
                        {r.thietBiTen || "—"}
                      </span>
                      <CodeBadge code={r.thietBiMa} className="w-fit" />
                    </div>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ) : (
                  <span className="text-xs italic text-muted-foreground">Chưa lắp tài sản</span>
                ),
            },
            {
              key: "soThanhPhanCuaTaiSan",
              label: "Số thành phần đang gắn",
              minW: "min-w-[170px]",
              filter: "cat",
              hideBelow: "xl",
              inherited: true,
              value: (r) => (r.daLap ? String(r.soThanhPhanCuaTaiSan) : ""),
              cell: (r) =>
                !r.daLap ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : r.soThanhPhanCuaTaiSan > 1 ? (
                  <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">
                    <Cpu className="h-3 w-3" />
                    {r.soThanhPhanCuaTaiSan} thành phần
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <Cpu className="h-3 w-3" />1 thành phần
                  </Badge>
                ),
            },
            {
              key: "serial",
              label: "Số serial",
              minW: "min-w-[130px]",
              filter: "text",
              hideBelow: "xl",
              inherited: true,
              value: (r) => r.thietBiSerial,
              cell: (r) =>
                r.thietBiSerial ? (
                  <span className="font-mono text-xs text-muted-foreground">{r.thietBiSerial}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                ),
            },
            { key: "model", label: "Model", minW: "min-w-[150px]", cellClassName: "max-w-[200px]", filter: "cat", hideBelow: "lg", inherited: true, value: (r) => r.model, cell: (r) => r.model ? <span title={r.model} className="line-clamp-2 break-words text-sm leading-snug">{r.model}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "chungLoai", label: "Chủng loại", minW: "min-w-[150px]", cellClassName: "max-w-[200px]", filter: "cat", hideBelow: "xl", inherited: true, value: (r) => r.chungLoai, cell: (r) => r.chungLoai ? <span title={r.chungLoai} className="line-clamp-2 break-words text-sm leading-snug">{r.chungLoai}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "nhaSanXuat", label: "Nhà sản xuất", minW: "min-w-[170px]", cellClassName: "max-w-[220px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.nhaSanXuat, cell: (r) => r.nhaSanXuat ? <span title={r.nhaSanXuat} className="line-clamp-2 break-words text-sm leading-snug">{r.nhaSanXuat}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "nhaCungCap", label: "Nhà cung cấp", minW: "min-w-[170px]", cellClassName: "max-w-[220px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.nhaCungCap, cell: (r) => r.nhaCungCap ? <span title={r.nhaCungCap} className="line-clamp-2 break-words text-sm leading-snug">{r.nhaCungCap}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "pN", label: "P/N", minW: "min-w-[120px]", filter: "text", defaultHidden: true, hideBelow: "xl", inherited: true, value: (r) => r.pN, cell: (r) => r.pN ? <span className="font-mono text-xs">{r.pN}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "maTaiSanBravo", label: "Mã Bravo", minW: "min-w-[130px]", filter: "text", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.maTaiSanBravo, cell: (r) => r.maTaiSanBravo ? <span className="font-mono text-xs text-muted-foreground">{r.maTaiSanBravo}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "taiSanTrangThai", label: "Trạng thái tài sản", minW: "min-w-[140px]", align: "center", filter: "cat", defaultHidden: true, hideBelow: "xl", inherited: true, value: (r) => r.taiSanTrangThai, cell: (r) => r.taiSanTrangThai ? <Badge variant="outline" className="text-[11px]">{r.taiSanTrangThai}</Badge> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "namSanXuat", label: "Năm SX", minW: "min-w-[90px]", align: "center", filter: "cat", defaultHidden: true, hideBelow: "xl", inherited: true, value: (r) => r.namSanXuat, sortValue: (r) => Number(r.namSanXuat) || 0 },
            { key: "namKhaiThac", label: "Năm khai thác", minW: "min-w-[120px]", align: "center", filter: "cat", defaultHidden: true, hideBelow: "xl", inherited: true, value: (r) => r.namKhaiThac, sortValue: (r) => Number(r.namKhaiThac) || 0 },
            { key: "ngayMua", label: "Ngày mua", minW: "min-w-[110px]", filter: "text", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.ngayMua },
            { key: "hanBaoHanh", label: "Hạn bảo hành", minW: "min-w-[120px]", filter: "text", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.hanBaoHanh },
            { key: "tyLeTuoiTho", label: "% Tuổi thọ", minW: "min-w-[110px]", align: "right", filter: "text", defaultHidden: true, hideBelow: "xl", inherited: true, value: (r) => r.tyLeTuoiTho, sortValue: (r) => parseFloat(r.tyLeTuoiTho) || 0 },
            { key: "tinhTrangKyThuat", label: "Tình trạng kỹ thuật", minW: "min-w-[160px]", cellClassName: "max-w-[220px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.tinhTrangKyThuat, cell: (r) => r.tinhTrangKyThuat ? <span title={r.tinhTrangKyThuat} className="line-clamp-2 break-words text-sm leading-snug">{r.tinhTrangKyThuat}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "cheDoKdHc", label: "Chế độ KD/HC", minW: "min-w-[130px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.cheDoKdHc },
            { key: "ngayBaoTriGanNhat", label: "BT gần nhất", minW: "min-w-[120px]", filter: "text", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.ngayBaoTriGanNhat },
            { key: "ngayBaoTriKeTiep", label: "BT kế tiếp", minW: "min-w-[120px]", filter: "text", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.ngayBaoTriKeTiep },
            { key: "taiSanViTri", label: "Vị trí tài sản", minW: "min-w-[160px]", cellClassName: "max-w-[220px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.taiSanViTri },
            { key: "taiSanDonViQuanLy", label: "ĐVQL tài sản", minW: "min-w-[140px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", inherited: true, value: (r) => r.taiSanDonViQuanLy },
            {
              key: "actions",
              label: "Hành động",
              minW: "min-w-[150px]",
              align: "center",
              hideBelow: "md",
              value: () => "",
              cell: (r) => (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Điều hướng sang cây hệ thống và mở Sheet chi tiết dùng chung.
                    // Có tài sản → dùng editTb hiện có; chưa lắp → chỉ mở cây tại focus mặc định.
                    navigate({
                      to: "/he-thong/cay",
                      search: r.daLap && r.thietBiMa ? { editTb: r.thietBiMa } : {},
                    });
                  }}
                  title="Mở Sheet chi tiết trong cây hệ thống (dùng chung với view Danh sách/Sơ đồ)"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Mở chi tiết
                </Button>
              ),
            },
          ]}
        />
      )}

      {loadingTS && viewMode === "asset" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu tài sản…
        </div>
      )}
      {errorTS && viewMode === "asset" && (
        <div className="text-sm text-destructive">Lỗi tải tài sản: {(errorTS as Error).message}</div>
      )}

      {!loadingTS && !errorTS && viewMode === "asset" && (
        <StandardTable<TaiSanRow>
          tableKey={`${tableKey}:tai-san`}
          rows={filteredTaiSan}
          clientPagination={{ page: currentPage, pageSize, onFilteredTotalChange: setFilteredTotal }}
          getRowId={(r) => r.id}
          requireFilterToShow={false}
          emptyText="Không có tài sản phù hợp."
          countUnit="tài sản"
          maxHeightClass={hideHeader ? "min-h-0 flex-1" : undefined}
          toolbarLeft={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm mã tài sản, tên, serial, model, hệ thống…"
                  className="h-8 w-[300px] pl-7 pr-7"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Xoá tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Cpu className="h-3 w-3" /> {soTaiSanCoLap.toLocaleString("vi-VN")} tài sản đang gắn thành phần
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Số thành phần:</span>
                <Select value={bucket} onValueChange={(v) => setBucket(v as typeof bucket)}>
                  <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="0">Chưa gắn (0)</SelectItem>
                    <SelectItem value="1">Đúng 1</SelectItem>
                    <SelectItem value="2-3">2 – 3</SelectItem>
                    <SelectItem value=">3">Nhiều hơn 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Hiển thị</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(v === "all" ? Math.max(total, 1) : Number(v))}>
                  <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="all">Tất cả</SelectItem>
                  </SelectContent>
                </Select>
                <span>/ trang</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Trang trước">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {total === 0 ? "0" : `${pageStart + 1}–${Math.min(pageStart + pageSize, total)}`} / {total.toLocaleString("vi-VN")}
                  <span className="mx-1">·</span>
                  Trang {currentPage}/{totalPages}
                </span>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Trang sau">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
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
              cell: (r) => <CodeBadge code={r.ma} />,
            },
            {
              key: "ten",
              label: "Tên tài sản",
              minW: "min-w-[220px]",
              cellClassName: "max-w-[280px]",
              filter: "text",
              sticky: true,
              value: (r) => r.ten,
              cell: (r) => (
                <Link
                  to="/thiet-bi/$maThietBi"
                  params={{ maThietBi: r.ma }}
                  className="group flex items-start gap-1 hover:text-primary"
                >
                  <span title={r.ten} className="line-clamp-2 break-words font-medium leading-snug group-hover:underline">{r.ten || "—"}</span>
                  <AnomalyBadge score={Number(r.anomalyScore) || 0} count90d={Number(r.soSuCo90n) || 0} className="shrink-0" />
                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
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
              cell: (r) =>
                r.soThanhPhanDangGan === 0 ? (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <Unplug className="h-3 w-3" /> Chưa gắn
                  </Badge>
                ) : r.soThanhPhanDangGan > 1 ? (
                  <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">
                    <Cpu className="h-3 w-3" /> {r.soThanhPhanDangGan} thành phần
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Cpu className="h-3 w-3" /> 1 thành phần
                  </Badge>
                ),
            },
            {
              key: "danhSachHeThong",
              label: "Hệ thống đang lắp",
              minW: "min-w-[200px]",
              cellClassName: "max-w-[240px]",
              filter: "text",
              value: (r) => r.danhSachHeThong,
              cell: (r) => (
                <CellPreview
                  title={`Hệ thống đang lắp — ${r.ma}`}
                  content={r.danhSachHeThong}
                  className="line-clamp-3 break-words text-sm leading-snug"
                />
              ),
            },
            {
              key: "danhSachThanhPhan",
              label: "Thành phần đang lắp",
              minW: "min-w-[260px]",
              cellClassName: "max-w-[320px]",
              filter: "text",
              value: (r) => r.danhSachThanhPhan,
              cell: (r) => (
                <CellPreview
                  title={`Thành phần đang lắp — ${r.ma}`}
                  content={r.danhSachThanhPhan}
                  preformatted
                  className="whitespace-pre-line break-words text-xs leading-relaxed line-clamp-4"
                />
              ),
            },
            { key: "serial", label: "Serial", minW: "min-w-[130px]", cellClassName: "max-w-[180px]", filter: "text", hideBelow: "lg", value: (r) => r.serial, cell: (r) => r.serial ? <span className="break-all font-mono text-xs text-muted-foreground">{r.serial}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "model", label: "Model", minW: "min-w-[150px]", cellClassName: "max-w-[200px]", filter: "cat", hideBelow: "lg", value: (r) => r.model, cell: (r) => r.model ? <span title={r.model} className="line-clamp-2 break-words text-sm leading-snug">{r.model}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "chungLoai", label: "Chủng loại", minW: "min-w-[150px]", cellClassName: "max-w-[200px]", filter: "cat", hideBelow: "xl", value: (r) => r.chungLoai, cell: (r) => r.chungLoai ? <span title={r.chungLoai} className="line-clamp-2 break-words text-sm leading-snug">{r.chungLoai}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "nhaSanXuat", label: "Nhà sản xuất", minW: "min-w-[170px]", cellClassName: "max-w-[220px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", value: (r) => r.nhaSanXuat, cell: (r) => r.nhaSanXuat ? <span title={r.nhaSanXuat} className="line-clamp-2 break-words text-sm leading-snug">{r.nhaSanXuat}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "nhaCungCap", label: "Nhà cung cấp", minW: "min-w-[170px]", cellClassName: "max-w-[220px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", value: (r) => r.nhaCungCap, cell: (r) => r.nhaCungCap ? <span title={r.nhaCungCap} className="line-clamp-2 break-words text-sm leading-snug">{r.nhaCungCap}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "donViQuanLy", label: "Đơn vị quản lý", minW: "min-w-[160px]", cellClassName: "max-w-[200px]", filter: "cat", hideBelow: "xl", inherited: true, value: (r) => r.donViQuanLy, cell: (r) => r.donViQuanLy ? <span title={r.donViQuanLy} className="line-clamp-2 break-words text-sm leading-snug">{r.donViQuanLy}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "viTri", label: "Vị trí", minW: "min-w-[160px]", cellClassName: "max-w-[200px]", filter: "cat", hideBelow: "lg", inherited: true, value: (r) => r.viTri, cell: (r) => r.viTri ? <span title={r.viTri} className="line-clamp-2 break-words text-sm leading-snug">{r.viTri}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "trangThai", label: "Trạng thái", minW: "min-w-[130px]", align: "center", filter: "cat", value: (r) => r.trangThai, cell: (r) => r.trangThai ? <Badge variant="secondary" className="text-[11px]">{r.trangThai}</Badge> : <span className="text-xs text-muted-foreground">—</span> },
            // ---- Thuộc tính mở rộng của tài sản ----
            { key: "pN", label: "P/N", minW: "min-w-[120px]", filter: "text", defaultHidden: true, hideBelow: "xl", value: (r) => r.pN, cell: (r) => r.pN ? <span className="font-mono text-xs">{r.pN}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "maTaiSanBravo", label: "Mã Bravo", minW: "min-w-[130px]", filter: "text", defaultHidden: true, hideBelow: "2xl", value: (r) => r.maTaiSanBravo, cell: (r) => r.maTaiSanBravo ? <span className="font-mono text-xs text-muted-foreground">{r.maTaiSanBravo}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "namSanXuat", label: "Năm SX", minW: "min-w-[90px]", align: "center", filter: "cat", defaultHidden: true, hideBelow: "xl", value: (r) => r.namSanXuat, sortValue: (r) => Number(r.namSanXuat) || 0 },
            { key: "namKhaiThac", label: "Năm khai thác", minW: "min-w-[120px]", align: "center", filter: "cat", defaultHidden: true, hideBelow: "xl", value: (r) => r.namKhaiThac, sortValue: (r) => Number(r.namKhaiThac) || 0 },
            { key: "ngayMua", label: "Ngày mua", minW: "min-w-[110px]", filter: "text", defaultHidden: true, hideBelow: "2xl", value: (r) => r.ngayMua },
            { key: "hanBaoHanh", label: "Hạn bảo hành", minW: "min-w-[120px]", filter: "text", defaultHidden: true, hideBelow: "2xl", value: (r) => r.hanBaoHanh },
            { key: "tyLeTuoiTho", label: "% Tuổi thọ", minW: "min-w-[110px]", align: "right", filter: "text", defaultHidden: true, hideBelow: "xl", value: (r) => r.tyLeTuoiTho, sortValue: (r) => parseFloat(r.tyLeTuoiTho) || 0 },
            { key: "tinhTrangKyThuat", label: "Tình trạng kỹ thuật", minW: "min-w-[160px]", cellClassName: "max-w-[220px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", value: (r) => r.tinhTrangKyThuat, cell: (r) => r.tinhTrangKyThuat ? <span title={r.tinhTrangKyThuat} className="line-clamp-2 break-words text-sm leading-snug">{r.tinhTrangKyThuat}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "cheDoKdHc", label: "Chế độ KD/HC", minW: "min-w-[130px]", filter: "cat", defaultHidden: true, hideBelow: "2xl", value: (r) => r.cheDoKdHc },
            { key: "ngayBaoTriGanNhat", label: "BT gần nhất", minW: "min-w-[120px]", filter: "text", defaultHidden: true, hideBelow: "2xl", value: (r) => r.ngayBaoTriGanNhat },
            { key: "ngayBaoTriKeTiep", label: "BT kế tiếp", minW: "min-w-[120px]", filter: "text", defaultHidden: true, hideBelow: "2xl", value: (r) => r.ngayBaoTriKeTiep },
            {

              key: "actions",
              label: "Hành động",
              minW: "min-w-[150px]",
              align: "center",
              hideBelow: "md",
              value: () => "",
              cell: (r) => (
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs"
                  title="Mở sổ lý lịch tài sản"
                >
                  <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: r.ma }}>
                    <ExternalLink className="h-3.5 w-3.5" /> Sổ lý lịch
                  </Link>
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

function InlineTextEdit({
  initial,
  placeholder,
  onSave,
}: {
  initial: string;
  placeholder?: string;
  onSave: (v: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const initialRef = useRef(initial);
  useEffect(() => {
    setValue(initial);
    initialRef.current = initial;
  }, [initial]);

  const dirty = value.trim() !== (initialRef.current ?? "").trim();

  async function commit() {
    if (!dirty || saving) return;
    const v = value.trim();
    if (!v) {
      setValue(initialRef.current);
      return;
    }
    setSaving(true);
    try {
      await onSave(v);
      initialRef.current = v;
    } catch {
      setValue(initialRef.current);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
          if (e.key === "Escape") { setValue(initialRef.current); (e.target as HTMLInputElement).blur(); }
        }}
        placeholder={placeholder}
        disabled={saving}
        className="h-7 text-sm font-medium"
      />
      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      {dirty && !saving && (
        <>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); void commit(); }}
            className="text-emerald-600 hover:text-emerald-500"
            aria-label="Lưu"
            title="Lưu (Enter)"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setValue(initialRef.current); }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Huỷ"
            title="Huỷ (Esc)"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

function InlineTaiSanEdit({ row, onChanged }: { row: ThanhPhanRow; onChanged: () => void }) {
  const { data: dsThietBi = [], isLoading } = useThietBiChon();
  const lapMut = useLapThietBi(row.heThongId);
  const [pending, setPending] = useState<string>("");
  const [thaoTarget, setThaoTarget] = useState<ThaoTaiSanTarget | null>(null);

  const options = useMemo(
    () =>
      dsThietBi.map((t) => ({
        value: t.id,
        label: `${t.ma_thiet_bi} — ${t.ten_thiet_bi ?? ""}`.trim(),
        hint: t.dangLap
          ? `Đang lắp: ${t.viTriHienTai ?? "—"}${t.ma_serial ? " · SN " + t.ma_serial : ""}`
          : t.ma_serial
            ? `SN ${t.ma_serial}`
            : undefined,
      })),
    [dsThietBi],
  );

  const busy = lapMut.isPending;

  async function doLap(thietBiId: string) {
    if (!thietBiId || busy) return;
    if (row.daLap) {
      toast.error("Thành phần đang có tài sản — bấm 'Tháo' trước rồi lắp mới");
      setPending("");
      return;
    }
    try {
      await lapMut.mutateAsync({ thanhPhanId: row.id, thietBiId, lyDo: "Lắp nhanh từ bảng" });
      toast.success("Đã lắp tài sản — kế thừa vị trí & đơn vị quản lý");
      setPending("");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message || "Không lắp được");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {row.daLap && (
        <div className="flex items-center gap-1.5">
          <CodeBadge code={row.thietBiMa} className="w-fit" />
          <span className="truncate text-xs text-muted-foreground">{row.thietBiTen}</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        {row.daLap ? (
          <div
            className="flex h-7 w-[240px] items-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-2 text-[11px] italic text-muted-foreground"
            title="Bấm 'Tháo' để chọn vị trí đích cho tài sản cũ, sau đó mới lắp tài sản mới"
          >
            Tháo trước khi lắp mới…
          </div>
        ) : (
          <Combobox
            options={options}
            value={pending}
            onChange={(v) => { setPending(v); void doLap(v); }}
            placeholder={isLoading ? "Đang tải…" : "Chọn tài sản để lắp…"}
            searchPlaceholder="Tìm mã / tên / serial…"
            emptyText="Không có tài sản phù hợp"
            className="h-7 w-[240px] text-xs"
          />
        )}
        {row.daLap && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-1.5 text-xs text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() => setThaoTarget({
              heThongId: row.heThongId,
              thanhPhanId: row.id,
              maThanhPhan: row.ma,
              tenThanhPhan: row.ten,
              viTriHienTaiId: row.viTriId,
              viTriHienTaiTen: row.viTri || null,
            })}
            title="Tháo tài sản khỏi thành phần"
          >
            <Unplug className="h-3.5 w-3.5" /> Tháo
          </Button>
        )}
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      <ThaoTaiSanDialog target={thaoTarget} onClose={() => { setThaoTarget(null); onChanged(); }} />
    </div>
  );
}


// Ô có nội dung dài: bấm để mở modal xem đầy đủ
function CellPreview({
  title,
  content,
  className,
  preformatted = false,
  children,
}: {
  title: string;
  content: string;
  className?: string;
  preformatted?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!content) return <span className="text-xs italic text-muted-foreground">—</span>;
  return (
    <>
      <button
        type="button"
        title={content}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`w-full cursor-pointer text-left hover:text-primary ${className ?? ""}`}
      >
        {children ?? content}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">Nội dung đầy đủ của ô</DialogDescription>
          </DialogHeader>
          <div
            className={
              preformatted
                ? "max-h-[60vh] overflow-auto whitespace-pre-line break-words rounded-md bg-muted/40 p-3 text-sm leading-relaxed"
                : "max-h-[60vh] overflow-auto break-words text-sm leading-relaxed"
            }
          >
            {content}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
