// ============================================================================
// T12 — Chính sách bảo dưỡng (PM Policy) → Phiếu công việc (Work Order) → KPI.
//  - Bảng cong_viec_bao_tri: phiếu công việc bảo dưỡng sinh từ chính sách.
//  - RPC tao_cong_viec_bao_tri_dinh_ky: sinh phiếu cho tài sản đến hạn.
//  - RPC hoan_thanh_cong_viec_bao_tri: đóng phiếu + cập nhật chu kỳ tài sản.
//  - View v_kpi_bao_tri: KPI theo đơn vị (đúng hạn, quá hạn...).
// ============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

export type CongViecTrangThai = "MO" | "DANG_LAM" | "HOAN_THANH" | "HUY";
export type CongViecUuTien = "THAP" | "TRUNG_BINH" | "CAO" | "KHAN";

export interface CongViecBaoTri {
  id: string;
  ma_cong_viec: string | null;
  thiet_bi_id: string | null;
  he_thong_id: string | null;
  chinh_sach_id: string | null;
  loai: string;
  uu_tien: string;
  trang_thai: string;
  ngay_den_han: string | null;
  ky_han: string | null;
  ngay_bat_dau: string | null;
  ngay_hoan_thanh: string | null;
  nguoi_phu_trach: string | null;
  bao_tri_id: string | null;
  template_version_id: string | null;
  mo_ta: string | null;
  ghi_chu: string | null;
  don_vi_id_snapshot: string | null;
  created_at: string;
}

export interface CongViecRow extends CongViecBaoTri {
  thiet_bi?: { ma_thiet_bi: string; ten_thiet_bi: string } | null;
}

/** Trạng thái hiệu lực của phiếu (tính cả quá hạn theo ngày). */
export function hieuLucPhieu(cv: Pick<CongViecBaoTri, "trang_thai" | "ngay_den_han">): {
  label: string;
  cls: string;
  quaHan: boolean;
} {
  if (cv.trang_thai === "HOAN_THANH") return { label: "Hoàn thành", cls: "bg-emerald-100 text-emerald-700", quaHan: false };
  if (cv.trang_thai === "HUY") return { label: "Đã huỷ", cls: "bg-slate-100 text-slate-500", quaHan: false };
  const today = new Date().toISOString().slice(0, 10);
  if (cv.ngay_den_han && cv.ngay_den_han < today) {
    const days = Math.round((Date.now() - new Date(cv.ngay_den_han).getTime()) / 86400000);
    return { label: `Quá hạn ${days} ngày`, cls: "bg-red-100 text-red-700", quaHan: true };
  }
  if (cv.trang_thai === "DANG_LAM") return { label: "Đang làm", cls: "bg-amber-100 text-amber-700", quaHan: false };
  return { label: "Đang mở", cls: "bg-sky-100 text-sky-700", quaHan: false };
}

export const UU_TIEN_META: Record<string, { label: string; cls: string }> = {
  KHAN: { label: "Khẩn", cls: "bg-red-100 text-red-700" },
  CAO: { label: "Cao", cls: "bg-orange-100 text-orange-700" },
  TRUNG_BINH: { label: "Trung bình", cls: "bg-sky-100 text-sky-700" },
  THAP: { label: "Thấp", cls: "bg-slate-100 text-slate-600" },
};

/** Danh sách phiếu công việc bảo dưỡng (RLS lọc theo quyền/đơn vị). */
export function useCongViecBaoTri() {
  return useQuery({
    queryKey: ["cong_viec_bao_tri"],
    staleTime: 15_000,
    queryFn: async (): Promise<CongViecRow[]> => {
      const { data, error } = await supabase
        .from("cong_viec_bao_tri")
        .select("*, thiet_bi:thiet_bi_id(ma_thiet_bi,ten_thiet_bi)")
        .order("ngay_den_han", { ascending: true, nullsFirst: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as CongViecRow[];
    },
  });
}

export interface KpiBaoTri {
  don_vi_id: string | null;
  don_vi_ten: string | null;
  tong_cong_viec: number;
  da_hoan_thanh: number;
  dang_mo: number;
  qua_han: number;
  hoan_thanh_dung_han: number;
  ty_le_dung_han: number | null;
}

/** KPI bảo dưỡng theo đơn vị. */
export function useKpiBaoTri() {
  return useQuery({
    queryKey: ["v_kpi_bao_tri"],
    staleTime: 15_000,
    queryFn: async (): Promise<KpiBaoTri[]> => {
      const { data, error } = await supabase.from("v_kpi_bao_tri").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as KpiBaoTri[];
    },
  });
}

/** Sinh phiếu công việc định kỳ từ chính sách bảo dưỡng. */
export function useSinhPhieuDinhKy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("tao_cong_viec_bao_tri_dinh_ky");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row?.so_phieu_tao as number) ?? 0;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cong_viec_bao_tri"] });
      qc.invalidateQueries({ queryKey: ["v_kpi_bao_tri"] });
    },
  });
}

/** Cập nhật trạng thái một phiếu công việc. */
export function useCapNhatPhieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; trang_thai?: CongViecTrangThai; uu_tien?: CongViecUuTien; ngay_bat_dau?: string | null }) => {
      const patch: {
        trang_thai?: CongViecTrangThai;
        uu_tien?: CongViecUuTien;
        ngay_bat_dau?: string | null;
      } = {};
      if (input.trang_thai) patch.trang_thai = input.trang_thai;
      if (input.uu_tien) patch.uu_tien = input.uu_tien;
      if (input.ngay_bat_dau !== undefined) patch.ngay_bat_dau = input.ngay_bat_dau;
      const { error } = await supabase.from("cong_viec_bao_tri").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cong_viec_bao_tri"] });
      qc.invalidateQueries({ queryKey: ["v_kpi_bao_tri"] });
    },
  });
}

/** Hoàn thành phiếu công việc → liên kết biên bản + cập nhật chu kỳ bảo dưỡng của tài sản (một giao dịch). */
export function useHoanThanhPhieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; baoTriId?: string | null; formSubmissionId?: string | null }) => {
      const { error } = await supabase.rpc("hoan_thanh_cong_viec_bao_tri", {
        _id: input.id,
        _bao_tri_id: input.baoTriId ?? undefined,
        _form_submission_id: input.formSubmissionId ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cong_viec_bao_tri"] });
      qc.invalidateQueries({ queryKey: ["v_kpi_bao_tri"] });
    },
  });
}
