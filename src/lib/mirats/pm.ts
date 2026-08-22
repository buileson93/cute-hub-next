// N4 — Preventive Maintenance queue client helpers.
// Wraps RPCs pm_sinh_cong_viec / pm_hoan_thanh_cong_viec / pm_bo_qua_cong_viec
// và SELECT `pm_cong_viec` (RLS đã lo phạm vi đơn vị / vai trò).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { thongDiepLoi, kickNeuHetPhien } from "@/lib/mirats/errors";
import { toast } from "sonner";

export type PmTrangThai =
  | "sap_den_han"
  | "den_han"
  | "qua_han"
  | "dang_thuc_hien"
  | "hoan_thanh"
  | "bo_qua";

export interface PmCongViecRow {
  id: string;
  chinh_sach_id: string;
  doi_tuong_type: "thiet_bi" | "he_thong";
  doi_tuong_id: string;
  don_vi_id: string | null;
  han: string;
  ky_hieu_han: string;
  trang_thai: PmTrangThai;
  nguoi_phu_trach_id: string | null;
  ghi_chu: string | null;
  bao_tri_id: string | null;
  hoan_thanh_at: string | null;
  bo_qua_ly_do: string | null;
  estimated: boolean;
  created_at: string;
  updated_at: string;
  chinh_sach?: {
    ten: string;
    noi_dung: string | null;
    chu_ky_loai: string;
    chu_ky_gia_tri: number | null;
  };
  don_vi?: { ten_don_vi: string } | null;
  phu_trach?: { ho_ten: string } | null;
}

export const PM_STATUS_META: Record<
  PmTrangThai,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning"
      | "error"
      | "info";
  }
> = {
  sap_den_han: { label: "Sắp đến hạn", variant: "info" },
  den_han: { label: "Đến hạn", variant: "warning" },
  qua_han: { label: "Quá hạn", variant: "error" },
  dang_thuc_hien: { label: "Đang thực hiện", variant: "info" },
  hoan_thanh: { label: "Hoàn thành", variant: "success" },
  bo_qua: { label: "Bỏ qua", variant: "secondary" },
};

const KEY = ["pm_cong_viec"] as const;

export function usePmCongViec(filter?: { trang_thai?: PmTrangThai[] }) {
  return useQuery({
    queryKey: [...KEY, filter ?? null],
    queryFn: async (): Promise<PmCongViecRow[]> => {
      let q = supabase
        .from("pm_cong_viec")
        .select(
          "id, chinh_sach_id, doi_tuong_type, doi_tuong_id, don_vi_id, han, ky_hieu_han, trang_thai, nguoi_phu_trach_id, ghi_chu, bao_tri_id, hoan_thanh_at, bo_qua_ly_do, estimated, created_at, updated_at, chinh_sach:bao_tri_chinh_sach!chinh_sach_id(ten, noi_dung, chu_ky_loai, chu_ky_gia_tri), don_vi:dm_don_vi!don_vi_id(ten_don_vi), phu_trach:nhan_vien!nguoi_phu_trach_id(ho_ten)",
        )
        .order("han", { ascending: true })
        .limit(1000);
      if (filter?.trang_thai?.length) q = q.in("trang_thai", filter.trang_thai);
      const { data, error } = await q;
      if (error) {
        await kickNeuHetPhien(error);
        throw error;
      }
      return (data ?? []) as unknown as PmCongViecRow[];
    },
    staleTime: 30_000,
  });
}

export function useSinhPmCongViec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("pm_sinh_cong_viec", {});
      if (error) {
        await kickNeuHetPhien(error);
        throw error;
      }
      return data as { created: number; updated: number };
    },
    onSuccess: (r) => {
      toast.success(`Đã sinh ${r?.created ?? 0} công việc mới, cập nhật ${r?.updated ?? 0}.`);
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e) => toast.error(thongDiepLoi(e, "Sinh công việc thất bại")),
  });
}

export interface HoanThanhInput {
  taskId: string;
  thuc_hien_at: string; // yyyy-mm-dd
  nguoi_thuc_hien_id?: string | null;
  ket_qua: string;
  van_de?: string | null;
  ghi_chu?: string | null;
}

export function useHoanThanhPm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HoanThanhInput) => {
      const args: Record<string, string> = {
        _task_id: input.taskId,
        _thuc_hien_at: input.thuc_hien_at,
        _ket_qua: input.ket_qua,
      };
      if (input.nguoi_thuc_hien_id) args._nguoi_thuc_hien_id = input.nguoi_thuc_hien_id;
      if (input.van_de) args._van_de = input.van_de;
      if (input.ghi_chu) args._ghi_chu = input.ghi_chu;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.rpc("pm_hoan_thanh_cong_viec", args as any);
      if (error) {
        await kickNeuHetPhien(error);
        throw error;
      }
      return data as unknown as { bao_tri_id: string; next_pm_id: string | null };
    },
    onSuccess: () => {
      toast.success("Đã hoàn thành và ghi Sổ lý lịch.");
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["bao_tri"] });
    },
    onError: (e) => toast.error(thongDiepLoi(e, "Không hoàn thành được")),
  });
}

export function useBoQuaPm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { taskId: string; ly_do: string }) => {
      const { data, error } = await supabase.rpc("pm_bo_qua_cong_viec", {
        _task_id: p.taskId,
        _ly_do: p.ly_do,
      });
      if (error) {
        await kickNeuHetPhien(error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Đã bỏ qua công việc.");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e) => toast.error(thongDiepLoi(e, "Bỏ qua thất bại")),
  });
}
