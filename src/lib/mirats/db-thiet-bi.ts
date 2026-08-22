import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
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
    // Assuming don_vi_id matches the code passed in (which is usually true in MIRATS RLS)
    q = q.eq("don_vi_id", donViCode); 
  }

  const { data, count, error } = await q;
  if (error) throw error;

  // Simple mapping to satisfy ThietBi type requirements for the UI
  const rows = (data ?? []).map((r: any) => ({
    ma_thiet_bi: r.ma_thiet_bi || r.id,
    ten: r.ten_thiet_bi || "(Không tên)",
    serial: r.ma_serial || "",
    p_n: r.p_n || "",
    model: r.model || "",
    don_vi: r.don_vi_id || "", // Mapping don_vi_id to don_vi string
    he_thong: r.he_thong_id || "",
    nhom_he_thong: r.nhom_he_thong_id || "",
    loai: "",
    nha_san_xuat: r.nha_san_xuat || "",
    nha_cung_cap: r.nha_cung_cap || "",
    vi_tri: r.vi_tri || "",
    ngay_mua: r.ngay_mua || "",
    ngay_dua_vao_su_dung: r.nam_dua_vao_khai_thac || "",
    han_bao_hanh: r.han_bao_hanh || "",
    gia_tri_mua: 0,
    nguon_von: "",
    tuoi_tho_thiet_ke_nam: 0,
    trang_thai: r.trang_thai_id || "",
    muc_do_quan_trong: "",
    tinh_trang_ky_thuat: "",
    thiet_bi_cha: null,
    ghi_chu: r.ghi_chu || null,
  })) as ThietBi[];

  return { rows, total: count ?? 0 };
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
