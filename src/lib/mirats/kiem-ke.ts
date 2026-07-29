// ============================================================================
// Kiểm kê tài sản (inventory / stocktaking).
//  - Bảng kiem_ke lưu từng lần kiểm kê: tình trạng, vị trí GPS, ảnh, ghi chú.
//  - RPC ghi_kiem_ke tạo dòng kiểm kê + cập nhật hạn kiểm kê kế tiếp theo chu kỳ.
// Logic tính hạn kế tiếp được tách thành hàm thuần để kiểm thử (TDD) và
// đồng nhất với công thức phía CSDL: ngay_kiem_ke_ke_tiep = ngày kiểm kê + chu kỳ.
// ============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";

/** Chu kỳ kiểm kê mặc định (ngày) — kiểm kê thường niên. */
export const DEFAULT_CHU_KY_KIEM_KE_NGAY = 365;

/**
 * Tính hạn kiểm kê kế tiếp = phần ngày của thời điểm kiểm kê + chu kỳ (ngày).
 * Trả về chuỗi ngày ISO `YYYY-MM-DD` (đồng nhất với kiểu `date` của CSDL).
 * Chu kỳ null/<=0 → dùng mặc định.
 */
export function tinhNgayKiemKeKeTiep(thoiDiem: string | Date, chuKyNgay?: number | null): string {
  const base = typeof thoiDiem === "string" ? new Date(thoiDiem) : thoiDiem;
  if (Number.isNaN(base.getTime())) throw new Error("thoi_diem không hợp lệ");
  const cyc =
    chuKyNgay != null && chuKyNgay > 0 ? Math.round(chuKyNgay) : DEFAULT_CHU_KY_KIEM_KE_NGAY;
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + cyc);
  return d.toISOString().slice(0, 10);
}

export interface KiemKeInput {
  thietBiId: string;
  tinhTrang: string;
  nguoiKiem?: string | null;
  viTriGps?: string | null;
  anhUrl?: string | null;
  ghiChu?: string | null;
  /** Thời điểm kiểm kê (ISO); mặc định thời điểm hiện tại. */
  thoiDiem?: string | null;
  /** Chu kỳ kiểm kê (ngày) để tính hạn kế tiếp; mặc định 365. */
  chuKyNgay?: number | null;
}

/** Kiểm tra dữ liệu trước khi gọi RPC — trả về danh sách lỗi (rỗng nếu hợp lệ). */
export function validateKiemKeInput(input: KiemKeInput): string[] {
  const errs: string[] = [];
  if (!input.thietBiId || !input.thietBiId.trim()) errs.push("Thiếu tài sản cần kiểm kê");
  if (!input.tinhTrang || !input.tinhTrang.trim()) errs.push("Cần nhập tình trạng kiểm kê");
  return errs;
}

export interface KiemKeRow {
  id: string;
  thiet_bi_id: string;
  nguoi_kiem: string | null;
  thoi_diem: string;
  tinh_trang: string;
  vi_tri_gps: string | null;
  anh_url: string | null;
  ghi_chu: string | null;
  created_by: string | null;
  created_at: string;
}

/** Lịch sử kiểm kê của một tài sản. */
export function useInventoryHistory(thietBiId: string | undefined) {
  return useQuery({
    queryKey: ["kiem_ke", thietBiId],
    enabled: !!thietBiId,
    staleTime: 15_000,
    queryFn: async (): Promise<KiemKeRow[]> => {
      const { data, error } = await supabase
        .from("kiem_ke")
        .select(
          "id,thiet_bi_id,nguoi_kiem,thoi_diem,tinh_trang,vi_tri_gps,anh_url,ghi_chu,created_by,created_at",
        )
        .eq("thiet_bi_id", thietBiId!)
        .order("thoi_diem", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as KiemKeRow[];
    },
  });
}

/** Gọi RPC ghi_kiem_ke: tạo dòng kiểm kê + cập nhật hạn kiểm kê kế tiếp. */
export function useGhiKiemKe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: KiemKeInput) => {
      const errs = validateKiemKeInput(input);
      if (errs.length) throw new Error(errs.join(", "));
      const { data, error } = await supabase.rpc("ghi_kiem_ke", {
        _thiet_bi_id: input.thietBiId,
        _tinh_trang: input.tinhTrang,
        _nguoi_kiem: input.nguoiKiem ?? undefined,
        _vi_tri_gps: input.viTriGps ?? undefined,
        _anh_url: input.anhUrl ?? undefined,
        _ghi_chu: input.ghiChu ?? undefined,
        _thoi_diem: input.thoiDiem ?? undefined,
        _chu_ky_ngay: input.chuKyNgay ?? undefined,
      });
      if (error) throw error;
      return data as KiemKeRow;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["kiem_ke", input.thietBiId] });
      qc.invalidateQueries({ queryKey: ["kiem_ke_den_han"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
    },
  });
}

// ---------- Tài sản đến hạn kiểm kê ----------
export interface DueDevice {
  id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  vi_tri: string | null;
  ngay_kiem_ke_ke_tiep: string | null;
  don_vi_id: string | null;
}

/**
 * Danh sách tài sản đến hạn kiểm kê: chưa có hạn (null) hoặc hạn <= hôm nay.
 * Sắp xếp hạn cũ nhất lên đầu; tài sản chưa từng kiểm kê xếp sau các hạn quá.
 */
export function useDueForInventory() {
  return useQuery({
    queryKey: ["kiem_ke_den_han"],
    staleTime: 30_000,
    queryFn: async (): Promise<DueDevice[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("id,ma_thiet_bi,ten_thiet_bi,vi_tri,ngay_kiem_ke_ke_tiep,don_vi_id")
        .or(`ngay_kiem_ke_ke_tiep.is.null,ngay_kiem_ke_ke_tiep.lte.${today}`)
        .order("ngay_kiem_ke_ke_tiep", { ascending: true, nullsFirst: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as DueDevice[];
    },
  });
}

/**
 * Tải ảnh kiểm kê lên bucket tài sản (dùng chung `thiet-bi-hinh-anh`),
 * trả về đường dẫn file để lưu vào cột anh_url.
 */
export async function uploadKiemKeAnh(thietBiId: string, file: File): Promise<string> {
  const safe = file.name.replace(/[^\w.-]+/g, "_");
  const path = `kiem-ke/${thietBiId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await storage
    .from("thiet-bi-hinh-anh")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Xoá file ảnh kiểm kê (dùng để dọn file mồ côi khi ghi kiểm kê thất bại). */
export async function removeKiemKeAnh(path: string): Promise<void> {
  const { error } = await storage.from("thiet-bi-hinh-anh").remove([path]);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Điều phối "upload ảnh + ghi kiểm kê" như một thao tác nguyên tử phía client:
// nếu ghi kiểm kê (RPC) thất bại SAU khi ảnh đã upload, xoá file mồ côi để
// tránh rác trong storage. Nhận các phụ thuộc để dễ kiểm thử (TDD).
// ---------------------------------------------------------------------------
export interface KiemKeVoiAnhDeps {
  upload: (thietBiId: string, file: File) => Promise<string>;
  rpc: (input: KiemKeInput) => Promise<unknown>;
  remove: (path: string) => Promise<void>;
}

export const defaultKiemKeVoiAnhDeps: KiemKeVoiAnhDeps = {
  upload: uploadKiemKeAnh,
  rpc: async () => {
    throw new Error("rpc chưa được cấu hình");
  },
  remove: removeKiemKeAnh,
};

/**
 * Ghi một lần kiểm kê kèm ảnh (tuỳ chọn):
 *  1. Nếu có file → upload trước, lấy anh_url.
 *  2. Gọi RPC ghi kiểm kê với anh_url.
 *  3. Nếu RPC lỗi mà ảnh đã upload → xoá file mồ côi rồi ném lại lỗi gốc.
 */
export async function ghiKiemKeVoiAnh(
  thietBiId: string,
  base: Omit<KiemKeInput, "thietBiId" | "anhUrl">,
  file: File | null,
  deps: KiemKeVoiAnhDeps,
): Promise<unknown> {
  let anhUrl: string | null = null;
  if (file) anhUrl = await deps.upload(thietBiId, file);
  try {
    return await deps.rpc({ ...base, thietBiId, anhUrl });
  } catch (err) {
    if (anhUrl) {
      try {
        await deps.remove(anhUrl);
      } catch {
        // Nuốt lỗi dọn dẹp: ưu tiên báo lỗi gốc của nghiệp vụ.
      }
    }
    throw err;
  }
}
