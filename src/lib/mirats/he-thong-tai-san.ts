// ============================================================================
// Quan hệ "Tài sản thuộc Hệ thống" (thiet_bi.he_thong_id → dm_he_thong.id).
//
// Phần logic thuần (đếm, lọc ứng viên) tách khỏi React để unit-test được;
// hook chỉ chịu trách nhiệm nạp dữ liệu thật từ CSDL.
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { fetchAllRows } from "@/lib/mirats/paginate";

export interface TaiSanRef {
  id: string;
  ma: string;
  ten: string;
  heThongId: string | null;
}

/** Bỏ dấu + viết hoa để so khớp tìm kiếm tiếng Việt. */
export function khongDau(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .trim();
}

/** Số tài sản đang gắn cho từng hệ thống. */
export function demTaiSanTheoHeThong(rows: readonly TaiSanRef[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    if (!r?.heThongId) continue;
    out.set(r.heThongId, (out.get(r.heThongId) ?? 0) + 1);
  }
  return out;
}

/** Danh sách tài sản đang thuộc một hệ thống (đã lọc theo từ khoá). */
export function taiSanCuaHeThong(
  rows: readonly TaiSanRef[],
  heThongId: string,
  q = "",
): TaiSanRef[] {
  const k = khongDau(q);
  return rows.filter(
    (r) =>
      r.heThongId === heThongId &&
      (!k || khongDau(r.ma).includes(k) || khongDau(r.ten).includes(k)),
  );
}

/**
 * Ứng viên có thể gán thêm vào hệ thống: mọi tài sản chưa thuộc hệ thống này.
 * Tài sản đang thuộc hệ thống khác vẫn hiện (kèm cảnh báo ở UI) vì nghiệp vụ
 * cho phép điều chuyển, nhưng luôn xếp sau tài sản độc lập.
 */
export function ungVienGanVaoHeThong(
  rows: readonly TaiSanRef[],
  heThongId: string,
  q = "",
  limit = 50,
): TaiSanRef[] {
  const k = khongDau(q);
  const found = rows.filter(
    (r) =>
      r.heThongId !== heThongId &&
      (!k || khongDau(r.ma).includes(k) || khongDau(r.ten).includes(k)),
  );
  found.sort((a, b) => {
    const fa = a.heThongId ? 1 : 0;
    const fb = b.heThongId ? 1 : 0;
    if (fa !== fb) return fa - fb;
    return a.ma.localeCompare(b.ma, "vi");
  });
  return found.slice(0, Math.max(0, limit));
}

/** Sinh mã hệ thống duy nhất từ mã nhóm + tên (không đụng CSDL). */
export function sinhMaHeThong(nhomMa: string, ten: string, maDaCo: readonly string[]): string {
  const base = `${khongDau(nhomMa) || "HT"}_${khongDau(ten).replace(/[^A-Z0-9]+/g, "_")}`
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
  const taken = new Set(maDaCo.map((m) => m.toUpperCase()));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}_${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}_${Date.now()}`;
}

/** Nạp chỉ mục tài sản ↔ hệ thống (chỉ 4 cột, đủ cho đếm & gán). */
export function useHeThongTaiSan() {
  return useQuery<TaiSanRef[]>({
    queryKey: ["he_thong_tai_san_index"],
    staleTime: 60_000,
    queryFn: async () => {
      const rows = await fetchAllRows<{
        id: string;
        ma_thiet_bi: string | null;
        ten_thiet_bi: string | null;
        he_thong_id: string | null;
      }>((from, to) =>
        supabase
          .from("thiet_bi")
          .select("id, ma_thiet_bi, ten_thiet_bi, he_thong_id")
          .order("ma_thiet_bi")
          .range(from, to),
      );
      return rows.map((r) => ({
        id: r.id,
        ma: r.ma_thiet_bi ?? "",
        ten: r.ten_thiet_bi ?? r.ma_thiet_bi ?? "Chưa có tên",
        heThongId: r.he_thong_id,
      }));
    },
  });
}
