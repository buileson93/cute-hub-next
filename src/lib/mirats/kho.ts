// ============================================================================
// T13 — Kho / Vật tư (sổ cái tồn kho truy nguyên được).
//  - Bảng kho:            điểm lưu trữ vật tư.
//  - Bảng vat_tu:         danh mục vật tư dự phòng / tiêu hao.
//  - Bảng kho_giao_dich:  sổ cái bất biến (nhập/xuất/chuyển/điều chỉnh).
//  - View v_ton_kho:      tồn kho tính từ sổ cái (không sửa số tồn trực tiếp).
//  - View v_ton_kho_canh_bao: vật tư dưới mức tồn tối thiểu.
//  - RPC kho_nhap/kho_xuat/kho_chuyen/kho_kiem_ke: nghiệp vụ có kiểm soát.
// ============================================================================

import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

/** Kích thước trang tiêu chuẩn cho các danh sách phân trang server-side. */
export const KHO_PAGE_SIZE = 200;
export const TON_KHO_PAGE_SIZE = 500;

/** Chuẩn hoá kết quả useInfiniteQuery → API tương thích useQuery cho các consumer hiện có. */
function flattenInfinite<T>(q: {
  data?: { pages: { data: T[]; nextFrom: number | null }[] };
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}) {
  const data = q.data?.pages.flatMap((p) => p.data) as T[] | undefined;
  return {
    data,
    error: q.error,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
    fetchNextPage: q.fetchNextPage,
    hasNextPage: q.hasNextPage ?? false,
    isFetchingNextPage: q.isFetchingNextPage,
  };
}

export type LoaiVatTu = "DU_PHONG" | "TIEU_HAO";
export type LoaiGiaoDich =
  | "NHAP"
  | "XUAT"
  | "CHUYEN_NHAP"
  | "CHUYEN_XUAT"
  | "DIEU_CHINH_TANG"
  | "DIEU_CHINH_GIAM";

export const LOAI_VAT_TU_META: Record<LoaiVatTu, { label: string; cls: string }> = {
  DU_PHONG: { label: "Dự phòng", cls: "bg-sky-100 text-sky-700" },
  TIEU_HAO: { label: "Tiêu hao", cls: "bg-amber-100 text-amber-700" },
};

export const LOAI_GD_META: Record<LoaiGiaoDich, { label: string; cls: string; nhap: boolean }> = {
  NHAP: { label: "Nhập", cls: "bg-emerald-100 text-emerald-700", nhap: true },
  XUAT: { label: "Xuất", cls: "bg-red-100 text-red-700", nhap: false },
  CHUYEN_NHAP: { label: "Chuyển đến", cls: "bg-emerald-100 text-emerald-700", nhap: true },
  CHUYEN_XUAT: { label: "Chuyển đi", cls: "bg-orange-100 text-orange-700", nhap: false },
  DIEU_CHINH_TANG: { label: "Kiểm kê +", cls: "bg-sky-100 text-sky-700", nhap: true },
  DIEU_CHINH_GIAM: { label: "Kiểm kê −", cls: "bg-slate-100 text-slate-600", nhap: false },
};

// ---------------------------------------------------------------------------
// Logic thuần (mirror CSDL) — dùng cho kiểm thử & tính tồn phía client.
// Số tồn LUÔN được suy ra từ tổng hiệu ứng sổ cái, không bao giờ sửa trực tiếp.
// ---------------------------------------------------------------------------

/** Loại giao dịch làm TĂNG tồn (nhập). Đồng nhất với cột sinh `hieu_ung` ở CSDL. */
const LOAI_TANG: ReadonlySet<LoaiGiaoDich> = new Set<LoaiGiaoDich>([
  "NHAP",
  "CHUYEN_NHAP",
  "DIEU_CHINH_TANG",
]);

/** Hiệu ứng của một bút toán lên tồn kho: dương nếu nhập, âm nếu xuất. */
export function hieuUngGiaoDich(loai: LoaiGiaoDich, soLuong: number): number {
  const abs = Math.abs(soLuong);
  return LOAI_TANG.has(loai) ? abs : -abs;
}

/** Tồn kho = tổng hiệu ứng của toàn bộ bút toán (mô phỏng SUM(hieu_ung)). */
export function tinhTonKho(rows: ReadonlyArray<{ loai: LoaiGiaoDich; so_luong: number }>): number {
  return rows.reduce((acc, r) => acc + hieuUngGiaoDich(r.loai, r.so_luong), 0);
}

/** Kiểm tra số lượng giao dịch: phải là số hữu hạn > 0. Trả về lỗi hoặc null. */
export function validateSoLuong(soLuong: number): string | null {
  if (!Number.isFinite(soLuong)) return "Số lượng không hợp lệ";
  if (soLuong <= 0) return "Số lượng phải lớn hơn 0";
  return null;
}

/** Kiểm tra xuất kho: chặn <=0 và chặn vượt tồn khi không cho phép âm. */
export function validateXuat(ton: number, soLuong: number, choPhepAm: boolean): string | null {
  const soErr = validateSoLuong(soLuong);
  if (soErr) return soErr;
  if (!choPhepAm && soLuong > ton) {
    return `Không đủ tồn kho: hiện có ${ton}, cần xuất ${soLuong}`;
  }
  return null;
}

export interface KhoRow {
  id: string;
  ma_kho: string | null;
  ten: string;
  vi_tri_id: string | null;
  don_vi_id: string | null;
  ghi_chu: string | null;
  kich_hoat: boolean;
}

export interface VatTuRow {
  id: string;
  ma_vat_tu: string | null;
  ten: string;
  loai: LoaiVatTu;
  don_vi_tinh: string;
  don_gia: number;
  muc_ton_toi_thieu: number;
  model_id: string | null;
  nha_cung_cap_id: string | null;
  don_vi_id: string | null;
  ghi_chu: string | null;
  kich_hoat: boolean;
}

export interface TonKhoRow {
  vat_tu_id: string;
  kho_id: string;
  ten_vat_tu: string;
  ma_vat_tu: string | null;
  loai: LoaiVatTu;
  don_vi_tinh: string;
  muc_ton_toi_thieu: number;
  ten_kho: string;
  don_vi_id: string | null;
  ton_kho: number;
}

export interface CanhBaoRow {
  vat_tu_id: string;
  ten_vat_tu: string;
  ma_vat_tu: string | null;
  loai: LoaiVatTu;
  don_vi_tinh: string;
  muc_ton_toi_thieu: number;
  don_vi_id: string | null;
  tong_ton: number;
}

export interface GiaoDichRow {
  id: string;
  so_ct: string | null;
  nhom_ct: string | null;
  vat_tu_id: string;
  kho_id: string;
  loai: LoaiGiaoDich;
  so_luong: number;
  hieu_ung: number;
  don_gia: number;
  ngay: string;
  ghi_chu: string | null;
  don_vi_id: string | null;
  vat_tu?: { ten: string; ma_vat_tu: string | null; don_vi_tinh: string } | null;
  kho?: { ten: string } | null;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useKhoList() {
  return useQuery({
    queryKey: ["kho"],
    staleTime: 30_000,
    queryFn: async (): Promise<KhoRow[]> => {
      const { data, error } = await supabase
        .from("kho")
        .select("*")
        .order("ten", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as KhoRow[];
    },
  });
}

/** vat_tu — phân trang range 200/trang, sắp xếp theo tên. */
export function useVatTuList() {
  const q = useInfiniteQuery({
    queryKey: ["vat_tu"] as const,
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: async ({ pageParam }): Promise<{ data: VatTuRow[]; nextFrom: number | null }> => {
      const from = pageParam;
      const to = from + KHO_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("vat_tu")
        .select("*")
        .order("ten", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to);
      if (error) throw error;
      const rows = (data ?? []) as unknown as VatTuRow[];
      return { data: rows, nextFrom: rows.length < KHO_PAGE_SIZE ? null : to + 1 };
    },
    getNextPageParam: (last) => last.nextFrom,
  });
  return flattenInfinite<VatTuRow>(q);
}

/** v_ton_kho — phân trang range 500/trang. */
export function useTonKho() {
  const q = useInfiniteQuery({
    queryKey: ["v_ton_kho"] as const,
    initialPageParam: 0,
    staleTime: 15_000,
    queryFn: async ({ pageParam }): Promise<{ data: TonKhoRow[]; nextFrom: number | null }> => {
      const from = pageParam;
      const to = from + TON_KHO_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("v_ton_kho")
        .select("*")
        .order("ten_vat_tu", { ascending: true })
        .order("vat_tu_id", { ascending: true })
        .range(from, to);
      if (error) throw error;
      const rows = (data ?? []) as unknown as TonKhoRow[];
      return { data: rows, nextFrom: rows.length < TON_KHO_PAGE_SIZE ? null : to + 1 };
    },
    getNextPageParam: (last) => last.nextFrom,
  });
  return flattenInfinite<TonKhoRow>(q);
}

/** v_ton_kho_canh_bao — luôn nhỏ (chỉ hàng dưới min), giữ query đơn giản. */
export function useTonKhoCanhBao() {
  return useQuery({
    queryKey: ["v_ton_kho_canh_bao"],
    staleTime: 15_000,
    queryFn: async (): Promise<CanhBaoRow[]> => {
      const { data, error } = await supabase
        .from("v_ton_kho_canh_bao")
        .select("*")
        .order("ten_vat_tu", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CanhBaoRow[];
    },
  });
}

/** kho_giao_dich — phân trang range 200/trang, mới nhất trước. */
export function useGiaoDich() {
  const q = useInfiniteQuery({
    queryKey: ["kho_giao_dich"] as const,
    initialPageParam: 0,
    staleTime: 15_000,
    queryFn: async ({ pageParam }): Promise<{ data: GiaoDichRow[]; nextFrom: number | null }> => {
      const from = pageParam;
      const to = from + KHO_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("kho_giao_dich")
        .select("*, vat_tu:vat_tu_id(ten,ma_vat_tu,don_vi_tinh), kho:kho_id(ten)")
        .order("ngay", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) throw error;
      const rows = (data ?? []) as unknown as GiaoDichRow[];
      return { data: rows, nextFrom: rows.length < KHO_PAGE_SIZE ? null : to + 1 };
    },
    getNextPageParam: (last) => last.nextFrom,
  });
  return flattenInfinite<GiaoDichRow>(q);
}

export interface OptionItem {
  id: string;
  label: string;
}

export function useModelOptions() {
  return useQuery({
    queryKey: ["kho_model_options"],
    staleTime: 60_000,
    queryFn: async (): Promise<OptionItem[]> => {
      const { data, error } = await supabase
        .from("dm_model")
        .select("id,ten,p_n")
        .order("ten", { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id as string,
        label: `${r.ten as string}${r.p_n ? ` · ${r.p_n as string}` : ""}`,
      }));
    },
  });
}

export function useNccOptions() {
  return useQuery({
    queryKey: ["kho_ncc_options"],
    staleTime: 60_000,
    queryFn: async (): Promise<OptionItem[]> => {
      const { data, error } = await supabase
        .from("dm_nha_cung_cap")
        .select("id,ten")
        .order("ten", { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []).map((r) => ({ id: r.id as string, label: r.ten as string }));
    },
  });
}

export function useDonViOptions() {
  return useQuery({
    queryKey: ["kho_don_vi_options"],
    staleTime: 60_000,
    queryFn: async (): Promise<OptionItem[]> => {
      const { data, error } = await supabase
        .from("dm_don_vi")
        .select("id,ma,ten")
        .order("ten", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id as string,
        label: `${r.ten as string} (${r.ma as string})`,
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function invalidateKho(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["kho"] });
  qc.invalidateQueries({ queryKey: ["vat_tu"] });
  qc.invalidateQueries({ queryKey: ["v_ton_kho"] });
  qc.invalidateQueries({ queryKey: ["v_ton_kho_canh_bao"] });
  qc.invalidateQueries({ queryKey: ["kho_giao_dich"] });
}

export function useTaoKho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<KhoRow> & { ten: string }) => {
      const { error } = await supabase.from("kho").insert({
        ma_kho: input.ma_kho ?? null,
        ten: input.ten,
        vi_tri_id: input.vi_tri_id ?? null,
        don_vi_id: input.don_vi_id ?? null,
        ghi_chu: input.ghi_chu ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateKho(qc),
  });
}

export function useTaoVatTu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<VatTuRow> & { ten: string }) => {
      const { error } = await supabase.from("vat_tu").insert({
        ma_vat_tu: input.ma_vat_tu ?? null,
        ten: input.ten,
        loai: input.loai ?? "DU_PHONG",
        don_vi_tinh: input.don_vi_tinh ?? "cái",
        don_gia: input.don_gia ?? 0,
        muc_ton_toi_thieu: input.muc_ton_toi_thieu ?? 0,
        model_id: input.model_id ?? null,
        nha_cung_cap_id: input.nha_cung_cap_id ?? null,
        don_vi_id: input.don_vi_id ?? null,
        ghi_chu: input.ghi_chu ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateKho(qc),
  });
}

export interface NhapXuatInput {
  vatTuId: string;
  khoId: string;
  soLuong: number;
  donGia?: number;
  ghiChu?: string | null;
  choPhepAm?: boolean;
}

export function useKhoNhap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NhapXuatInput) => {
      const { error } = await supabase.rpc("kho_nhap", {
        _vat_tu_id: input.vatTuId,
        _kho_id: input.khoId,
        _so_luong: input.soLuong,
        _don_gia: input.donGia ?? 0,
        _ghi_chu: input.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateKho(qc),
  });
}

export function useKhoXuat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NhapXuatInput) => {
      const { error } = await supabase.rpc("kho_xuat", {
        _vat_tu_id: input.vatTuId,
        _kho_id: input.khoId,
        _so_luong: input.soLuong,
        _don_gia: input.donGia ?? 0,
        _ghi_chu: input.ghiChu ?? undefined,
        _cho_phep_am: input.choPhepAm ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateKho(qc),
  });
}

export function useKhoChuyen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      vatTuId: string;
      khoNguonId: string;
      khoDichId: string;
      soLuong: number;
      ghiChu?: string | null;
      choPhepAm?: boolean;
    }) => {
      const { error } = await supabase.rpc("kho_chuyen", {
        _vat_tu_id: input.vatTuId,
        _kho_nguon_id: input.khoNguonId,
        _kho_dich_id: input.khoDichId,
        _so_luong: input.soLuong,
        _ghi_chu: input.ghiChu ?? undefined,
        _cho_phep_am: input.choPhepAm ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateKho(qc),
  });
}

export function useKhoKiemKe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      vatTuId: string;
      khoId: string;
      soLuongThucTe: number;
      ghiChu?: string | null;
    }) => {
      const { error } = await supabase.rpc("kho_kiem_ke", {
        _vat_tu_id: input.vatTuId,
        _kho_id: input.khoId,
        _so_luong_thuc_te: input.soLuongThucTe,
        _ghi_chu: input.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateKho(qc),
  });
}
