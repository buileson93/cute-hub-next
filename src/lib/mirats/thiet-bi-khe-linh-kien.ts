// ============================================================================
// TẦNG 2 của mẫu hình "khe ↔ đơn vị ↔ gán theo thời gian":
//   Tài sản -> Khe linh kiện (thiet_bi_khe_linh_kien) -> Linh kiện (thiet_bi.la_linh_kien).
//   - NHỊP I (cấu trúc): khai thêm / sửa / ngừng khe linh kiện.
//   - NHỊP II (vận hành): lắp / tháo / thay thế / điều chuyển linh kiện (RPC atomic).
// Ô "linh kiện đang lắp" là CHỈ-ĐỌC, suy ra từ dòng gan_linh_kien hiệu lực.
// Song song hoàn toàn với he-thong-thanh-phan.ts (tầng 1).
// ============================================================================
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

export type TrangThaiKhe = "hoat_dong" | "ngung";

export interface KheLinhKien {
  id: string;
  thiet_bi_id: string;
  ma_khe: string;
  ten: string;
  loai_thiet_bi_yeu_cau: string | null;
  khe_cha: string | null;
  bat_buoc: boolean;
  thu_tu: number | null;
  mo_ta: string | null;
  trang_thai: TrangThaiKhe;
  hieu_luc_tu: string | null;
  hieu_luc_den: string | null;
}

/** Linh kiện đang giữ một khe (đọc từ dòng gan_linh_kien den_ngay IS NULL). */
export interface LinhKienDangLap {
  gan_id: string;
  khe_id: string;
  linh_kien_id: string;
  tu_ngay: string;
  ly_do: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string | null;
  ma_serial: string | null;
}

export interface LinhKienRanh {
  id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string | null;
  ma_serial: string | null;
  loai_thiet_bi_id: string | null;
  don_vi_quan_ly_id: string | null;
  trang_thai_ma: string | null;
  trang_thai_ten: string | null;
}

export interface KheLinhKienTree extends KheLinhKien {
  linhKien: {
    linh_kien_id: string;
    ma_thiet_bi: string;
    ten_thiet_bi: string | null;
    ma_serial: string | null;
  } | null;
}

const KEY = {
  khe: (tbId: string) => ["khe-linh-kien", tbId] as const,
  dangLap: (tbId: string) => ["linh-kien-dang-lap", tbId] as const,
  ranh: ["linh-kien-ranh"] as const,
};

/** Danh sách khe linh kiện + linh kiện đang lắp của một tài sản. */
export function useKheLinhKien(thietBiId: string) {
  return useQuery({
    queryKey: KEY.khe(thietBiId),
    enabled: Boolean(thietBiId),
    queryFn: async (): Promise<KheLinhKienTree[]> => {
      const [kheRes, ganRes] = await Promise.all([
        supabase
          .from("thiet_bi_khe_linh_kien")
          .select(
            "id, thiet_bi_id, ma_khe, ten, loai_thiet_bi_yeu_cau, khe_cha, bat_buoc, thu_tu, mo_ta, trang_thai, hieu_luc_tu, hieu_luc_den",
          )
          .eq("thiet_bi_id", thietBiId)
          .order("thu_tu", { ascending: true, nullsFirst: false })
          .order("ma_khe", { ascending: true }),
        supabase
          .from("gan_linh_kien")
          .select(
            "khe_id, linh_kien_id, thiet_bi_khe_linh_kien!inner(thiet_bi_id), linh_kien:linh_kien_id(ma_thiet_bi, ten_thiet_bi, ma_serial)",
          )
          .is("den_ngay", null)
          .eq("thiet_bi_khe_linh_kien.thiet_bi_id", thietBiId),
      ]);
      if (kheRes.error) throw kheRes.error;
      if (ganRes.error) throw ganRes.error;
      const byKhe = new Map<string, KheLinhKienTree["linhKien"]>();
      for (const g of (ganRes.data ?? []) as unknown as Array<{
        khe_id: string;
        linh_kien_id: string;
        linh_kien: {
          ma_thiet_bi: string;
          ten_thiet_bi: string | null;
          ma_serial: string | null;
        } | null;
      }>) {
        byKhe.set(g.khe_id, {
          linh_kien_id: g.linh_kien_id,
          ma_thiet_bi: g.linh_kien?.ma_thiet_bi ?? "",
          ten_thiet_bi: g.linh_kien?.ten_thiet_bi ?? null,
          ma_serial: g.linh_kien?.ma_serial ?? null,
        });
      }
      return ((kheRes.data ?? []) as KheLinhKien[]).map((k) => ({
        ...k,
        linhKien: byKhe.get(k.id) ?? null,
      }));
    },
  });
}

/** Linh kiện ĐỦ ĐIỀU KIỆN gán: la_linh_kien = true, đang RẢNH, chưa thanh lý. */
export function useLinhKienRanh() {
  return useQuery({
    queryKey: KEY.ranh,
    queryFn: async (): Promise<LinhKienRanh[]> => {
      const [busyRes, tbRes] = await Promise.all([
        supabase.from("gan_linh_kien").select("linh_kien_id").is("den_ngay", null),
        supabase
          .from("thiet_bi")
          .select(
            "id, ma_thiet_bi, ten_thiet_bi, ma_serial, loai_thiet_bi_id, don_vi_quan_ly_id, dm_trang_thai_thiet_bi:trang_thai_id(ma, ten)",
          )
          .eq("la_linh_kien", true)
          .order("ma_thiet_bi"),
      ]);
      if (busyRes.error) throw busyRes.error;
      if (tbRes.error) throw tbRes.error;
      const busy = new Set((busyRes.data ?? []).map((r) => r.linh_kien_id));
      return (
        (tbRes.data ?? []) as unknown as Array<{
          id: string;
          ma_thiet_bi: string;
          ten_thiet_bi: string | null;
          ma_serial: string | null;
          loai_thiet_bi_id: string | null;
          don_vi_quan_ly_id: string | null;
          dm_trang_thai_thiet_bi: { ma: string; ten: string } | null;
        }>
      )
        .filter((r) => !busy.has(r.id) && r.dm_trang_thai_thiet_bi?.ma !== "THANH_LY")
        .map((r) => ({
          id: r.id,
          ma_thiet_bi: r.ma_thiet_bi,
          ten_thiet_bi: r.ten_thiet_bi,
          ma_serial: r.ma_serial,
          loai_thiet_bi_id: r.loai_thiet_bi_id,
          don_vi_quan_ly_id: r.don_vi_quan_ly_id,
          trang_thai_ma: r.dm_trang_thai_thiet_bi?.ma ?? null,
          trang_thai_ten: r.dm_trang_thai_thiet_bi?.ten ?? null,
        }));
    },
  });
}

/** Làm mới toàn bộ dữ liệu liên quan sau một thao tác. */
function useInvalidate(thietBiId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY.khe(thietBiId) });
    qc.invalidateQueries({ queryKey: KEY.ranh });
    qc.invalidateQueries({ queryKey: KEY.dangLap(thietBiId) });
    qc.invalidateQueries({ queryKey: ["thiet-bi-chon"] });
    qc.invalidateQueries({ queryKey: ["thiet-bi-picker"] });
    qc.invalidateQueries({ queryKey: ["ly-lich-khe-linh-kien"] });
    qc.invalidateQueries({ queryKey: ["ly-lich-thiet-bi"] });
    qc.invalidateQueries({ queryKey: ["vai-tro-thiet-bi"] });
    qc.invalidateQueries({ queryKey: ["net-inline-inner"] });
    qc.invalidateQueries({ queryKey: ["operations_data"] });
  };
}

// ---- NHỊP I: CRUD khe linh kiện -------------------------------------------
export function useLuuKhe(thietBiId: string) {
  const invalidate = useInvalidate(thietBiId);
  return useMutation({
    mutationFn: async (
      input: Partial<KheLinhKien> & { thiet_bi_id: string; ma_khe: string; ten: string },
    ) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from("thiet_bi_khe_linh_kien").update(rest).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from("thiet_bi_khe_linh_kien")
        .insert(input)
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: invalidate,
  });
}

export function useNgungKhe(thietBiId: string) {
  const invalidate = useInvalidate(thietBiId);
  return useMutation({
    mutationFn: async (kheId: string) => {
      const { error } = await supabase
        .from("thiet_bi_khe_linh_kien")
        .update({ trang_thai: "ngung" })
        .eq("id", kheId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

// ---- NHỊP II: RPC nghiệp vụ (atomic) --------------------------------------
export function useLapLinhKien(thietBiId: string) {
  const invalidate = useInvalidate(thietBiId);
  return useMutation({
    mutationFn: async (p: { kheId: string; linhKienId: string; ghiChu?: string }) => {
      const { error } = await supabase.rpc("lap_linh_kien", {
        p_khe_id: p.kheId,
        p_linh_kien_id: p.linhKienId,
        p_ghi_chu: p.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useThaoLinhKien(thietBiId: string) {
  const invalidate = useInvalidate(thietBiId);
  return useMutation({
    mutationFn: async (p: { kheId: string; lyDo?: string; ghiChu?: string }) => {
      const { error } = await supabase.rpc("thao_linh_kien", {
        p_khe_id: p.kheId,
        p_ly_do: p.lyDo ?? "tháo",
        p_ghi_chu: p.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useThayTheLinhKien(thietBiId: string) {
  const invalidate = useInvalidate(thietBiId);
  return useMutation({
    mutationFn: async (p: {
      kheId: string;
      linhKienMoiId: string;
      hongHocId?: string | null;
      ghiChu?: string;
    }) => {
      const { error } = await supabase.rpc("thay_the_linh_kien", {
        p_khe_id: p.kheId,
        p_linh_kien_moi_id: p.linhKienMoiId,
        p_hong_hoc_id: p.hongHocId ?? undefined,
        p_ghi_chu: p.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDieuChuyenLinhKien(thietBiId: string) {
  const invalidate = useInvalidate(thietBiId);
  return useMutation({
    mutationFn: async (p: { linhKienId: string; kheMoiId: string; ghiChu?: string }) => {
      const { error } = await supabase.rpc("dieu_chuyen_linh_kien", {
        p_linh_kien_id: p.linhKienId,
        p_khe_moi_id: p.kheMoiId,
        p_ghi_chu: p.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

// ---- Lý lịch một khe linh kiện --------------------------------------------
export interface LyLichKheRow {
  gan_id: string;
  linh_kien_id: string;
  ma_thiet_bi: string;
  ten_linh_kien: string | null;
  ma_serial: string | null;
  tu_ngay: string;
  den_ngay: string | null;
  ly_do: string;
  hong_hoc_id: string | null;
}

export function useLyLichKhe(kheId: string | null) {
  return useQuery({
    queryKey: ["ly-lich-khe-linh-kien", kheId],
    enabled: Boolean(kheId),
    queryFn: async (): Promise<LyLichKheRow[]> => {
      const { data, error } = await supabase
        .from("v_ly_lich_khe_linh_kien")
        .select(
          "gan_id, linh_kien_id, ma_thiet_bi, ten_linh_kien, ma_serial, tu_ngay, den_ngay, ly_do, hong_hoc_id",
        )
        .eq("khe_id", kheId!)
        .order("tu_ngay", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LyLichKheRow[];
    },
  });
}
