import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { fetchAllRows } from "@/lib/mirats/paginate";
import type { ThietBi } from "@/lib/mirats/types";

// Standard columns for ThietBi to avoid SELECT * hotspots
export const TB_COLS =
  "id, ma_thiet_bi, ma_tai_san_bravo, ten_thiet_bi, ma_serial, p_n, model, model_id, nha_san_xuat, nha_cung_cap, vi_tri, vi_tri_id, ngay_mua, han_bao_hanh, ghi_chu, he_thong_id, phan_loai_id, nhom_he_thong_id, don_vi_id, trang_thai_id, loai_thiet_bi_id, phan_loai, nam_san_xuat, nam_dua_vao_khai_thac, ty_le_tuoi_tho, noi_quan_ly, thanh_phan, nguoi_giu, don_vi_giu_id, ngay_cap_phat, trang_thai_cap_phat";

export async function fetchThietBi(from: number, to: number, donViCode?: string | null) {
  let q = supabase
    .from("thiet_bi")
    .select(TB_COLS, { count: "exact" })
    .order("ma_thiet_bi", { ascending: true })
    .range(from, to);

  if (donViCode) {
    q = q.eq("don_vi_id", donViCode); // Assuming don_vi_id is the code, or filter by relation
  }

  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: data as ThietBi[], total: count ?? 0 };
}

export function useThietBiList(page: number, pageSize: number, donViCode?: string | null) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ["thiet_bi_paged", { page, pageSize, donViCode }],
    queryFn: () => fetchThietBi(from, to, donViCode),
    staleTime: 60_000,
  });
}
