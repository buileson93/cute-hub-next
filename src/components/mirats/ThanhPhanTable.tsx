import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  X,
  Cpu,
  ExternalLink,
  Pencil,
  Check,
  XCircle,
  Unplug,
  Package,
  LayoutGrid,
  Copy,
  Download,
  Wrench,
  PackageOpen,
  X as XIcon,
} from "lucide-react";
import { EntityHoverCard } from "@/components/mirats/EntityHoverCard";

import { AnomalyBadge } from "@/components/mirats/AnomalyBadge";
import { useUserPref } from "@/hooks/use-user-pref";
import { StandardTable } from "@/components/mirats/StandardTable";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { Combobox } from "@/components/mirats/Combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/backend/client";
import { useRealtimeTaxonomy } from "@/hooks/use-realtime-taxonomy";
import { normalize } from "@/lib/mirats/global-search";
import { useSession } from "@/hooks/use-session";
import { canWrite } from "@/lib/mirats/quyen";
import { useMultiRoleMap } from "@/lib/mirats/he-thong-thanh-phan";
export { useMultiRoleMap };
import { MultiRoleBadge } from "@/components/mirats/MultiRoleBadge";
export { MultiRoleBadge };
import { BulkActionButton } from "@/components/mirats/BulkActionButton";
import { TableExportDialog } from "@/components/mirats/TableExportDialog";
import { THANH_PHAN_PRESETS } from "@/lib/mirats/ui/tp-presets";

import { OperationDialog } from "@/components/mirats/OperationDialog";
export { OperationDialog };
import { ThanhPhanChiTietDialog } from "@/components/mirats/ThanhPhanChiTietDialog";
export { ThanhPhanChiTietDialog };

import { KhaiThemCumButtons } from "@/components/mirats/KhaiThemDialogs";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import type { KeysetCursor } from "@/lib/mirats/db/keyset";
import { ComponentTablePanel } from "./inventory/ComponentTablePanel";
import { AssetTablePanel } from "./inventory/AssetTablePanel";


// ---- Kiểu dữ liệu 1 dòng ở chế độ "Theo tài sản": 1 TÀI SẢN + tổng hợp thành phần đang lắp
export type TaiSanRow = {
  id: string;
  ma: string;
  ten: string;
  serial: string;
  model: string;
  modelId: string | null;
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
  soSuCo90n: number | null;
  anomalyScore: number | null;
};

export function useInfiniteTaiSanRows(q: string = "", bucket: string = "all", enabled: boolean = true) {
  const qc = useQueryClient();
  const queryKey = ["tai-san-thanh-phan-infinite", q, bucket];

  const query = useInfiniteQuery({
    queryKey,
    enabled,
    staleTime: 60_000,
    initialPageParam: null as KeysetCursor | null,
    queryFn: async ({ pageParam, signal }) => {
      const { fetchKeyset } = await import("@/lib/mirats/db/keyset-supabase");
      const res = await fetchKeyset<TaiSanRow>(supabase, {
        bang: "v_tai_san_toan_cuc",
        cot: [
          "id", "ma", "ten", "serial", "model", "modelId", "chungLoai", "nhaSanXuat",
          "nhaCungCap", "donViQuanLy", "trangThai", "viTri", "soThanhPhanDangGan",
          "danhSachThanhPhan", "danhSachHeThong", "pN", "maTaiSanBravo", "namSanXuat",
          "namKhaiThac", "ngayMua", "hanBaoHanh", "tyLeTuoiTho", "tinhTrangKyThuat",
          "cheDoKdHc", "ngayBaoTriGanNhat", "ngayBaoTriKeTiep", "soSuCo90n", "anomalyScore"
        ],
        sortField: "ma",
        dir: "asc",
        cursor: pageParam,
        kichThuoc: 500,
        signal,
        filters: (query) => {
          let qry = query;
          if (q) {
            qry = qry.or(`ma.ilike.%${q}%,ten.ilike.%${q}%,serial.ilike.%${q}%,model.ilike.%${q}%`);
          }
          if (bucket !== "all") {
            if (bucket === "0") qry = qry.eq("soThanhPhanDangGan", 0);
            else if (bucket === "1") qry = qry.eq("soThanhPhanDangGan", 1);
            else if (bucket === "2-3") qry = qry.gte("soThanhPhanDangGan", 2).lte("soThanhPhanDangGan", 3);
            else if (bucket === ">3") qry = qry.gt("soThanhPhanDangGan", 3);
          }
          return qry;
        }
      });
      return res;
    },
    getNextPageParam: (lastPage) => (lastPage.ket ? undefined : lastPage.cursor),
  });

  const fetchAll = useCallback(async () => {
    let currentCursor = query.data?.pages[query.data.pages.length - 1]?.cursor;
    let hasMore = query.hasNextPage;
    
    while (hasMore) {
      const result = await query.fetchNextPage();
      if (!result.hasNextPage) break;
    }
  }, [query]);

  return { ...query, fetchAll };
}

/** @deprecated dùng useInfiniteTaiSanRows */
export function useTaiSanRows() {
  const { data } = useInfiniteTaiSanRows("", "all", true);
  const rows = useMemo(() => data?.pages.flatMap((p) => p.rows) ?? [], [data]);
  return { data: rows, isLoading: false, error: null };
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
  modelId: string | null;

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
  anomalyScore: number | null;
};

export const TT_LABEL: Record<string, string> = { hoat_dong: "Hoạt động", ngung: "Đã ngừng" };

export function useInfiniteThanhPhanRows(q: string = "", enabled: boolean = true) {
  const queryKey = ["thanh-phan-infinite", q];

  const query = useInfiniteQuery({
    queryKey,
    enabled,
    staleTime: 60_000,
    initialPageParam: null as KeysetCursor | null,
    queryFn: async ({ pageParam, signal }) => {
      const { fetchKeyset } = await import("@/lib/mirats/db/keyset-supabase");
      const res = await fetchKeyset<ThanhPhanRow>(supabase, {
        bang: "v_thanh_phan_toan_cuc",
        cot: [
          "id", "ma", "ten", "nhomHeThong", "phanLoai", "heThong", "heThongId",
          "viTriId", "loaiYeuCau", "viTri", "trangThai", "thietBiMa", "thietBiTen",
          "thietBiSerial", "model", "modelId", "chungLoai", "nhaSanXuat", "nhaCungCap",
          "daLap", "soThanhPhanCuaTaiSan", "taiSanTrangThai", "namSanXuat",
          "namKhaiThac", "ngayMua", "hanBaoHanh", "pN", "maTaiSanBravo", "tyLeTuoiTho",
          "tinhTrangKyThuat", "ngayBaoTriGanNhat", "ngayBaoTriKeTiep", "cheDoKdHc",
          "taiSanViTri", "taiSanDonViQuanLy", "anomalyScore"
        ],
        sortField: "ma",
        dir: "asc",
        cursor: pageParam,
        kichThuoc: 500,
        signal,
        filters: (query) => {
          if (q) {
            return query.or(`ma.ilike.%${q}%,ten.ilike.%${q}%,thietBiMa.ilike.%${q}%,thietBiSerial.ilike.%${q}%`);
          }
          return query;
        }
      });
      return res;
    },
    getNextPageParam: (lastPage) => (lastPage.ket ? undefined : lastPage.cursor),
  });

  const fetchAll = useCallback(async () => {
    while (query.hasNextPage) {
      await query.fetchNextPage();
    }
  }, [query]);

  return { ...query, fetchAll };
}

/** @deprecated dùng useInfiniteThanhPhanRows */
export function useThanhPhanRows() {
  const { data } = useInfiniteThanhPhanRows("", true);
  const rows = useMemo(() => data?.pages.flatMap((p) => p.rows) ?? [], [data]);
  return { data: rows, isLoading: false, error: null };
}


// ---- Tiện ích thao tác hàng loạt trên dòng đã chọn ----
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function copyCodes(codes: string[]) {
  const text = codes.filter(Boolean).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${codes.length} mã.`);
  } catch {
    toast.error("Trình duyệt không cho phép sao chép.");
  }
}

/** Model Registry Map dùng cho ModelCell */
type ModelRegistry = Record<
  string,
  {
    id: string;
    ma: string;
    ten: string;
    so_model: string | null;
    p_n: string | null;
    hinh_anh: string | null;
    mo_ta: string | null;
    nha_san_xuat: string;
    loai_thiet_bi: string;
  }
>;

/** Hook lấy toàn bộ danh mục model để dùng cho hover card */
export function useModelRegistry() {
  return useQuery({
    queryKey: ["dm_model_registry"],
    queryFn: async (): Promise<ModelRegistry> => {
      const { data, error } = await supabase
        .from("dm_model")
        .select(
          `
          id, ma, ten, so_model, p_n, hinh_anh, mo_ta, 
          nsx:nha_san_xuat_id(ten), 
          loai:loai_thiet_bi_id(ten)
        `,
        )
        .eq("active", true);
      if (error) throw error;

      const map: ModelRegistry = {};
      (data ?? []).forEach((m: any) => {
        map[m.id] = {
          id: m.id,
          ma: m.ma,
          ten: m.ten,
          so_model: m.so_model,
          p_n: m.p_n,
          hinh_anh: m.hinh_anh,
          mo_ta: m.mo_ta,
          nha_san_xuat: m.nsx?.ten || "",
          loai_thiet_bi: m.loai?.ten || "",
        };
      });
      return map;
    },
    staleTime: 5 * 60_000,
  });
}


/** Lý do hiển thị khi vai trò hiện tại không được sửa dữ liệu hệ thống kỹ thuật. */
export const LY_DO_KHOA =
  "Vai trò của bạn chỉ được xem: cần quyền sửa dữ liệu Hệ thống kỹ thuật (Admin / Phòng KT / Phụ trách đơn vị) để đổi trạng thái hàng loạt.";

/** Nội dung hộp thoại xác nhận đổi trạng thái hàng loạt. */
function MoTaXacNhan({ rows, tt }: { rows: readonly { ma: string }[]; tt: string }) {
  return (
    <>
      <div>
        Sẽ đặt trạng thái <b>{tt}</b> cho <b>{rows.length}</b> thành phần đã chọn (bao gồm cả dòng ở
        các trang khác). Thao tác này ghi trực tiếp vào dữ liệu.
      </div>
      <div className="max-h-24 overflow-auto rounded bg-muted/50 p-2 font-mono text-[11px]">
        {rows
          .slice(0, 30)
          .map((r) => r.ma)
          .join(", ")}
        {rows.length > 30 ? ` … (+${rows.length - 30})` : ""}
      </div>
    </>
  );
}

export type ThanhPhanTableProps = {
  /** Ẩn khối header (tiêu đề + mô tả) khi nhúng vào trang khác */
  hideHeader?: boolean;
  /** Đặt tableKey để lưu preference cột riêng cho từng vị trí nhúng */
  tableKey?: string;
  /** Khi nhúng, cho phép trang cha điều khiển chế độ chỉnh sửa để tránh 2 nút. */
  externalEditMode?: boolean;
};

export function ThanhPhanTable({
  hideHeader = false,
  tableKey = "mirats:unified-tp-table", // Sử dụng key chung để share preference
  externalEditMode,
}: ThanhPhanTableProps) {
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useUserPref<"component" | "asset">(
    "thanh-phan:view-mode",
    "component",
  );
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isExternalEdit = externalEditMode !== undefined;
  const editMode = isExternalEdit ? externalEditMode : internalEditMode;
  const setEditMode = isExternalEdit ? () => {} : setInternalEditMode;

  const { roles } = useSession();
  const allowEdit = canWrite("he_thong", roles);

  const ModeToggle = (
    <div className="flex items-center gap-1.5 p-0.5 bg-muted/30 border rounded-md shrink-0">
      <Button
        size="sm"
        variant={viewMode === "component" ? "default" : "ghost"}
        className={cn(
          "h-7 gap-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-tight transition-all",
          viewMode === "component" && "bg-background shadow-sm text-primary"
        )}
        onClick={() => {
          setViewMode("component");
          setSelectedIds(new Set());
        }}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>Theo thành phần</span>
      </Button>
      
      <Button
        size="sm"
        variant={viewMode === "asset" ? "default" : "ghost"}
        className={cn(
          "h-7 gap-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-tight transition-all",
          viewMode === "asset" && "bg-background shadow-sm text-primary"
        )}
        onClick={() => {
          setViewMode("asset");
          setSelectedIds(new Set());
        }}
      >
        <Package className="h-3.5 w-3.5" />
        <span>Theo tài sản</span>
      </Button>
    </div>
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-1.5 overflow-hidden", !hideHeader && "p-2")}>
      {viewMode === "component" ? (
        <ComponentTablePanel 
          tableKey={tableKey} 
          hideHeader={hideHeader}
          editMode={editMode}
          setEditMode={setEditMode}
          allowEdit={allowEdit}
          ModeToggle={ModeToggle}
        />
      ) : (
        <AssetTablePanel 
          tableKey={tableKey} 
          hideHeader={hideHeader}
          editMode={editMode}
          setEditMode={setEditMode}
          allowEdit={allowEdit}
          ModeToggle={ModeToggle}
        />
      )}
    </div>
  );
}

export function ModelCell({
  model,
  modelId,
  registry,
}: {
  model?: string;
  modelId?: string | null;
  registry: Record<string, any>;
}) {
  if (!model && !modelId) return <span className="text-xs text-muted-foreground">—</span>;
  const entry = modelId ? (registry as any)[modelId] : null;

  if (!entry) {
    return (
      <span title={model} className="line-clamp-2 break-words text-[12px] font-medium leading-snug">
        {model || "—"}
      </span>
    );
  }

  return (
    <EntityHoverCard loai="dm_model" row={entry}>
      <span className="line-clamp-2 cursor-pointer break-words text-[12px] font-medium leading-snug text-primary underline-offset-4 decoration-primary/30 hover:underline">
        {model || entry.ten || "—"}
      </span>
    </EntityHoverCard>
  );
}

export function CellPreview({
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
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`w-full cursor-pointer text-left hover:text-primary ${className ?? ""}`}
        aria-label={`Xem chi tiết ${title.toLowerCase()}`}
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
