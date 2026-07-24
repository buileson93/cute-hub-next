// ============================================================================
// Lớp truy cập dữ liệu cho mô hình "quản lý tài sản thông minh":
//  - Đo đạc / telemetry (thiet_bi_do_dac)
//  - Nhật ký vòng đời (thiet_bi_vong_doi)
//  - Chính sách bảo dưỡng theo model (bao_tri_chinh_sach)
// Đọc/ghi trực tiếp qua Supabase; RLS đảm bảo quyền truy cập.
// ============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { CHU_KY_BUCKET, dataUrlToBlob, buildChuKyPath, isValidSignatureDataUrl } from "@/lib/mirats/chu-ky";

// ---------- Đo đạc / telemetry ----------
export interface DoDacRow {
  id: string;
  thiet_bi_id: string;
  thoi_diem: string;
  chi_so: string;
  gia_tri: number | null;
  don_vi_do: string | null;
  nguon: string | null;
  ghi_chu: string | null;
}

export function useTelemetry(thietBiId: string | undefined) {
  return useQuery({
    queryKey: ["telemetry", thietBiId],
    enabled: !!thietBiId,
    staleTime: 15_000,
    queryFn: async (): Promise<DoDacRow[]> => {
      const { data, error } = await supabase
        .from("thiet_bi_do_dac")
        .select("id,thiet_bi_id,thoi_diem,chi_so,gia_tri,don_vi_do,nguon,ghi_chu")
        .eq("thiet_bi_id", thietBiId!)
        .order("thoi_diem", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as DoDacRow[];
    },
  });
}

export function useAddTelemetry(thietBiId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      chi_so: string;
      gia_tri: number | null;
      don_vi_do?: string | null;
      thoi_diem?: string | null;
      ghi_chu?: string | null;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("thiet_bi_do_dac").insert({
        thiet_bi_id: thietBiId!,
        chi_so: input.chi_so,
        gia_tri: input.gia_tri,
        don_vi_do: input.don_vi_do ?? null,
        thoi_diem: input.thoi_diem || new Date().toISOString(),
        nguon: "thu_cong",
        ghi_chu: input.ghi_chu ?? null,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["telemetry", thietBiId] }),
  });
}

// ---------- Nhật ký vòng đời ----------
export interface VongDoiRow {
  id: string;
  thiet_bi_id: string;
  thoi_diem: string;
  ly_do: string | null;
  tu_trang_thai_id: string | null;
  den_trang_thai_id: string | null;
}

export function useLifecycle(thietBiId: string | undefined) {
  return useQuery({
    queryKey: ["lifecycle", thietBiId],
    enabled: !!thietBiId,
    staleTime: 15_000,
    queryFn: async (): Promise<VongDoiRow[]> => {
      const { data, error } = await supabase
        .from("thiet_bi_vong_doi")
        .select("id,thiet_bi_id,thoi_diem,ly_do,tu_trang_thai_id,den_trang_thai_id")
        .eq("thiet_bi_id", thietBiId!)
        .order("thoi_diem", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as VongDoiRow[];
    },
  });
}

/** Bản đồ id trạng thái -> tên, để hiển thị nhật ký vòng đời. */
export function useTrangThaiMap() {
  return useQuery({
    queryKey: ["trang_thai_map"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Map<string, string>> => {
      const { data, error } = await supabase.from("dm_trang_thai_thiet_bi").select("id,ten");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.id as string, r.ten as string]));
    },
  });
}

// ---------- Chính sách bảo dưỡng theo model ----------
export interface ChinhSachRow {
  id: string;
  loai_thiet_bi_id: string | null;
  ten: string;
  mo_ta: string | null;
  chu_ky_ngay: number | null;
  chu_ky_gio_chay: number | null;
  canh_bao_truoc_ngay: number;
  active: boolean;
}

export function useMaintenancePolicies() {
  return useQuery({
    queryKey: ["bao_tri_chinh_sach"],
    staleTime: 30_000,
    queryFn: async (): Promise<ChinhSachRow[]> => {
      const { data, error } = await supabase
        .from("bao_tri_chinh_sach")
        .select("id,loai_thiet_bi_id,ten,mo_ta,chu_ky_ngay,chu_ky_gio_chay,canh_bao_truoc_ngay,active")
        .order("ten", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChinhSachRow[];
    },
  });
}

export function useSaveMaintenancePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ChinhSachRow> & { ten: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        loai_thiet_bi_id: input.loai_thiet_bi_id ?? null,
        ten: input.ten,
        mo_ta: input.mo_ta ?? null,
        chu_ky_ngay: input.chu_ky_ngay ?? null,
        chu_ky_gio_chay: input.chu_ky_gio_chay ?? null,
        canh_bao_truoc_ngay: input.canh_bao_truoc_ngay ?? 7,
        active: input.active ?? true,
      };
      if (input.id) {
        const { error } = await supabase.from("bao_tri_chinh_sach").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bao_tri_chinh_sach")
          .insert({ ...payload, created_by: u.user?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bao_tri_chinh_sach"] }),
  });
}

export function useDeleteMaintenancePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bao_tri_chinh_sach").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bao_tri_chinh_sach"] }),
  });
}

/** Danh mục chủng loại (model) để gán chính sách. */
export function useLoaiThietBi() {
  return useQuery({
    queryKey: ["dm_loai_thiet_bi"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Array<{ id: string; ten: string }>> => {
      const { data, error } = await supabase.from("dm_loai_thiet_bi").select("id,ten").order("ten");
      if (error) throw error;
      return (data ?? []).map((r) => ({ id: r.id as string, ten: r.ten as string }));
    },
  });
}

// ---------- Cấp phát / thu hồi (T2.1) ----------
export const CAP_PHAT_LABEL: Record<string, string> = {
  san_sang: "Sẵn sàng",
  da_cap_phat: "Đã cấp phát",
};

export interface CapPhatRow {
  id: string;
  thiet_bi_id: string;
  hanh_dong: "cap_phat" | "thu_hoi";
  nguoi_giu: string | null;
  don_vi_giu_id: string | null;
  ghi_chu: string | null;
  thoi_diem: string;
  thuc_hien_boi: string | null;
}

/** Lịch sử cấp phát / thu hồi của một tài sản. */
export function useAllocationHistory(thietBiId: string | undefined) {
  return useQuery({
    queryKey: ["cap_phat", thietBiId],
    enabled: !!thietBiId,
    staleTime: 15_000,
    queryFn: async (): Promise<CapPhatRow[]> => {
      const { data, error } = await supabase
        .from("thiet_bi_cap_phat")
        .select("id,thiet_bi_id,hanh_dong,nguoi_giu,don_vi_giu_id,ghi_chu,thoi_diem,thuc_hien_boi")
        .eq("thiet_bi_id", thietBiId!)
        .order("thoi_diem", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as CapPhatRow[];
    },
  });
}

export interface CapPhatInput {
  thietBiId: string;
  hanhDong: "cap_phat" | "thu_hoi";
  nguoiGiu?: string | null;
  donViGiuId?: string | null;
  ghiChu?: string | null;
}

/** Gọi RPC cap_phat_thiet_bi để cấp phát hoặc thu hồi tài sản. */
export function useCapPhatThietBi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CapPhatInput) => {
      const { error } = await supabase.rpc("cap_phat_thiet_bi", {
        _thiet_bi_id: input.thietBiId,
        _hanh_dong: input.hanhDong,
        _nguoi_giu: input.nguoiGiu ?? undefined,
        _don_vi_giu_id: input.donViGiuId ?? undefined,
        _ghi_chu: input.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["cap_phat", input.thietBiId] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
    },
  });
}

// ---------- Chữ ký biên bản bàn giao (T2.x) ----------
export interface HandoverSignature {
  id: string;
  chu_ky_url: string | null;
  da_chap_nhan: boolean;
  thoi_diem_chap_nhan: string | null;
  ngay_nhan: string | null;
}

/** Biên bản bàn giao gần nhất của tài sản (để hiển thị trạng thái đã ký / chưa ký). */
export function useLatestHandover(thietBiId: string | undefined) {
  return useQuery({
    queryKey: ["ban_giao_latest", thietBiId],
    enabled: !!thietBiId,
    staleTime: 15_000,
    queryFn: async (): Promise<HandoverSignature | null> => {
      const { data, error } = await supabase
        .from("ban_giao")
        .select("id,chu_ky_url,da_chap_nhan,thoi_diem_chap_nhan,ngay_nhan")
        .eq("thiet_bi_id", thietBiId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as HandoverSignature | null) ?? null;
    },
  });
}

export interface CapPhatKyInput extends CapPhatInput {
  /** dataURL ảnh chữ ký (canvas). Null nếu người nhận không ký. */
  chuKyDataUrl?: string | null;
  /** Mã tài sản (text) để lưu vào ban_giao.thiet_bi. */
  maThietBi?: string | null;
  /** Người thực hiện cấp phát (để ghi vào biên bản). */
  nguoiGiao?: string | null;
}

/**
 * Cấp phát / thu hồi tài sản; nếu có chữ ký người nhận thì upload ảnh chữ ký
 * và tạo biên bản bàn giao (ban_giao) đánh dấu đã ký.
 */
export function useCapPhatVoiChuKy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CapPhatKyInput) => {
      const { error } = await supabase.rpc("cap_phat_thiet_bi", {
        _thiet_bi_id: input.thietBiId,
        _hanh_dong: input.hanhDong,
        _nguoi_giu: input.nguoiGiu ?? undefined,
        _don_vi_giu_id: input.donViGiuId ?? undefined,
        _ghi_chu: input.ghiChu ?? undefined,
      });
      if (error) throw error;

      // Chỉ tạo biên bản có chữ ký khi cấp phát và có nét ký hợp lệ.
      if (input.hanhDong === "cap_phat" && isValidSignatureDataUrl(input.chuKyDataUrl)) {
        const path = buildChuKyPath(input.thietBiId);
        const blob = dataUrlToBlob(input.chuKyDataUrl!);
        const up = await storage.from(CHU_KY_BUCKET).upload(path, blob, {
          contentType: blob.type || "image/png",
          upsert: false,
        });
        if (up.error) throw up.error;

        const today = new Date().toISOString().slice(0, 10);
        const ins = await supabase.from("ban_giao").insert({
          ma_ban_giao: `BG_${Date.now().toString(36).toUpperCase()}`,
          thiet_bi_id: input.thietBiId,
          thiet_bi: input.maThietBi ?? "",
          loai_ban_giao: "Cấp phát",
          nguoi_giao: input.nguoiGiao ?? null,
          nguoi_nhan: input.nguoiGiu ?? null,
          ngay_nhan: today,
          trang_thai: "Hoàn tất",
          ghi_chu: input.ghiChu ?? null,
          chu_ky_url: path,
          da_chap_nhan: true,
          thoi_diem_chap_nhan: new Date().toISOString(),
        });
        if (ins.error) throw ins.error;
      }
    },
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ["cap_phat", input.thietBiId] });
      qc.invalidateQueries({ queryKey: ["ban_giao_latest", input.thietBiId] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      qc.invalidateQueries({ queryKey: ["operations"] });
    },
  });
}


