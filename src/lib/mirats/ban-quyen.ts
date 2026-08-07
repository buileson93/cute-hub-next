// ============================================================================
// Bản quyền phần mềm — logic thuần + hook truy vấn.
// Không chứa JSX; dùng chung cho route /phan-mem-ban-quyen và các dialog.
// ============================================================================
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

export type BanQuyenStatus = "valid" | "expiring" | "expired" | "perpetual";

export const NGUONG_SAP_HET_HAN = 60;

export type BanQuyenRow = {
  id: string;
  ma_ban_quyen: string;
  ten_phan_mem: string;
  nha_phat_hanh: string | null;
  phien_ban: string | null;
  loai_ban_quyen_id: string | null;
  loaiTen: string | null;
  license_key: string | null;
  so_ghe: number | null;
  ngay_mua: string | null;
  ngay_bat_dau: string | null;
  ngay_het_han: string | null;
  gia_tri: number | null;
  so_hop_dong: string | null;
  don_vi_id: string | null;
  donViTen: string | null;
  nha_cung_cap_id: string | null;
  nccTen: string | null;
  ghi_chu: string | null;
  gheDaDung: number;
  gheConLai: number | null;
  soNgayConLai: number | null;
  status: BanQuyenStatus;
};

/** Số ngày còn lại tới hạn (âm = đã quá hạn). null khi không có hạn. */
export function soNgayConLai(ngayHetHan: string | null, today = new Date()): number | null {
  if (!ngayHetHan) return null;
  const end = new Date(`${ngayHetHan}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end.getTime() - base.getTime()) / 86_400_000);
}

export function trangThaiBanQuyen(ngayHetHan: string | null, today = new Date()): BanQuyenStatus {
  const n = soNgayConLai(ngayHetHan, today);
  if (n == null) return "perpetual";
  if (n < 0) return "expired";
  if (n <= NGUONG_SAP_HET_HAN) return "expiring";
  return "valid";
}

export const STATUS_LABEL: Record<BanQuyenStatus, string> = {
  perpetual: "Vĩnh viễn",
  valid: "Còn hiệu lực",
  expiring: `Sắp hết hạn (≤ ${NGUONG_SAP_HET_HAN} ngày)`,
  expired: "Đã hết hạn",
};

export const STATUS_CLASS: Record<BanQuyenStatus, string> = {
  perpetual: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  valid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  expiring: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

/** Số ghế còn lại; null khi bản quyền không giới hạn ghế. */
export function gheConLai(soGhe: number | null, daDung: number): number | null {
  if (soGhe == null) return null;
  return soGhe - daDung;
}

export function dinhDangTien(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}

type RawRow = {
  id: string;
  ma_ban_quyen: string;
  ten_phan_mem: string;
  nha_phat_hanh: string | null;
  phien_ban: string | null;
  loai_ban_quyen_id: string | null;
  license_key: string | null;
  so_ghe: number | null;
  ngay_mua: string | null;
  ngay_bat_dau: string | null;
  ngay_het_han: string | null;
  gia_tri: number | null;
  so_hop_dong: string | null;
  don_vi_id: string | null;
  nha_cung_cap_id: string | null;
  ghi_chu: string | null;
  dm_loai_ban_quyen: { ten: string } | null;
  dm_don_vi: { ten: string } | null;
  dm_nha_cung_cap: { ten: string } | null;
  phan_mem_ban_quyen_cap_phat: { id: string; ngay_thu_hoi: string | null }[] | null;
};

export function useBanQuyenList() {
  return useQuery({
    queryKey: ["ban_quyen", "list"],
    queryFn: async (): Promise<BanQuyenRow[]> => {
      const { data, error } = await supabase
        .from("phan_mem_ban_quyen")
        .select(
          "id, ma_ban_quyen, ten_phan_mem, nha_phat_hanh, phien_ban, loai_ban_quyen_id, license_key, so_ghe, ngay_mua, ngay_bat_dau, ngay_het_han, gia_tri, so_hop_dong, don_vi_id, nha_cung_cap_id, ghi_chu, dm_loai_ban_quyen(ten), dm_don_vi(ten), dm_nha_cung_cap(ten), phan_mem_ban_quyen_cap_phat(id, ngay_thu_hoi)",
        )
        .order("ten_phan_mem");
      if (error) throw error;
      return ((data ?? []) as unknown as RawRow[]).map((r) => {
        const daDung = (r.phan_mem_ban_quyen_cap_phat ?? []).filter((c) => !c.ngay_thu_hoi).length;
        return {
          ...r,
          loaiTen: r.dm_loai_ban_quyen?.ten ?? null,
          donViTen: r.dm_don_vi?.ten ?? null,
          nccTen: r.dm_nha_cung_cap?.ten ?? null,
          gheDaDung: daDung,
          gheConLai: gheConLai(r.so_ghe, daDung),
          soNgayConLai: soNgayConLai(r.ngay_het_han),
          status: trangThaiBanQuyen(r.ngay_het_han),
        } satisfies BanQuyenRow;
      });
    },
  });
}

export type CapPhatRow = {
  id: string;
  ban_quyen_id: string;
  thiet_bi_id: string;
  ngay_cai_dat: string;
  nguoi_cai: string | null;
  ngay_thu_hoi: string | null;
  ghi_chu: string | null;
  maThietBi: string | null;
  tenThietBi: string | null;
};

export function useCapPhatList(banQuyenId: string | null) {
  return useQuery({
    queryKey: ["ban_quyen", "cap_phat", banQuyenId],
    enabled: !!banQuyenId,
    queryFn: async (): Promise<CapPhatRow[]> => {
      const { data, error } = await supabase
        .from("phan_mem_ban_quyen_cap_phat")
        .select("id, ban_quyen_id, thiet_bi_id, ngay_cai_dat, nguoi_cai, ngay_thu_hoi, ghi_chu, thiet_bi(ma_thiet_bi, ten_thiet_bi)")
        .eq("ban_quyen_id", banQuyenId!)
        .order("ngay_cai_dat", { ascending: false });
      if (error) throw error;
      type Raw = Omit<CapPhatRow, "maThietBi" | "tenThietBi"> & {
        thiet_bi: { ma_thiet_bi: string; ten_thiet_bi: string | null } | null;
      };
      return ((data ?? []) as unknown as Raw[]).map((r) => ({
        ...r,
        maThietBi: r.thiet_bi?.ma_thiet_bi ?? null,
        tenThietBi: r.thiet_bi?.ten_thiet_bi ?? null,
      }));
    },
  });
}