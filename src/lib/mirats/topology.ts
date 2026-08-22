// ============================================================================
// T15 — Topology: dịch vụ đọc/ghi KẾT NỐI giữa tài sản (nguồn chuẩn).
// Bảng `thiet_bi_ket_noi` là source-of-truth; sơ đồ chỉ là lớp trình bày.
// Mọi thao tác tôn trọng RLS theo đơn vị của người dùng.
// ============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

export type LoaiKetNoi = "CAP" | "LOGIC" | "MACH" | "KHAC";

export const LOAI_KET_NOI_LABEL: Record<LoaiKetNoi, string> = {
  CAP: "Cáp vật lý",
  LOGIC: "Kết nối logic",
  MACH: "Mạch/Circuit",
  KHAC: "Khác",
};

export interface KetNoiRow {
  id: string;
  tu_thiet_bi_id: string;
  den_thiet_bi_id: string;
  tu_cong: string | null;
  den_cong: string | null;
  loai: LoaiKetNoi;
  ten_mach: string | null;
  mo_ta: string | null;
  tu_ma: string | null;
  tu_ten: string | null;
  den_ma: string | null;
  den_ten: string | null;
  don_vi_ma: string | null;
  don_vi_ten: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceOption {
  id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string | null;
}

/** Danh sách kết nối topology (đọc từ view, RLS lọc theo đơn vị). */
export function useKetNoiData() {
  const q = useQuery({
    queryKey: ["topology_ket_noi"],
    staleTime: 20_000,
    queryFn: async (): Promise<KetNoiRow[]> => {
      // Phân trang 1000/lần — mặc định PostgREST cắt ở 1000, khi số kết nối
      // vượt ngưỡng thì sơ đồ topology sẽ thiếu dây.
      const PAGE = 1000;
      const out: KetNoiRow[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("v_thiet_bi_ket_noi")
          .select("*")
          .order("updated_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const batch = (data ?? []) as unknown as KetNoiRow[];
        out.push(...batch);
        if (batch.length < PAGE) break;
      }
      return out;
    },
  });
  return { ...q, ketNoi: q.data ?? [] };
}

/** Danh sách tài sản (uuid) cho ô chọn endpoint — RLS giới hạn theo quyền xem. */
export function useDevicePickList() {
  const q = useQuery({
    queryKey: ["topology_device_pick"],
    staleTime: 60_000,
    queryFn: async (): Promise<DeviceOption[]> => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("id, ma_thiet_bi, ten_thiet_bi")
        .order("ma_thiet_bi", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as DeviceOption[];
    },
  });
  return { ...q, devices: q.data ?? [] };
}

/** Danh sách sơ đồ để nhập topology từ bản vẽ cũ. */
export function useDiagramPickList() {
  const q = useQuery({
    queryKey: ["topology_diagram_pick"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("so_do_he_thong")
        .select("id, ten")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; ten: string }[];
    },
  });
  return { ...q, diagrams: q.data ?? [] };
}

export interface NewKetNoi {
  tu_thiet_bi_id: string;
  den_thiet_bi_id: string;
  tu_cong?: string | null;
  den_cong?: string | null;
  loai: LoaiKetNoi;
  ten_mach?: string | null;
  mo_ta?: string | null;
}

export function useAddKetNoi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewKetNoi) => {
      const { error } = await supabase.from("thiet_bi_ket_noi").insert({
        tu_thiet_bi_id: payload.tu_thiet_bi_id,
        den_thiet_bi_id: payload.den_thiet_bi_id,
        tu_cong: payload.tu_cong?.trim() || null,
        den_cong: payload.den_cong?.trim() || null,
        loai: payload.loai,
        ten_mach: payload.ten_mach?.trim() || null,
        mo_ta: payload.mo_ta?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topology_ket_noi"] }),
  });
}

export function useDeleteKetNoi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("thiet_bi_ket_noi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topology_ket_noi"] }),
  });
}

export interface ImportReport {
  mapped: number;
  unmapped: number;
  created: number;
  details: { edge: string; source: string; target: string; ly_do: string }[];
}

export function useImportTuSoDo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (soDoId: string): Promise<ImportReport> => {
      const { data, error } = await supabase.rpc("topology_import_tu_so_do", {
        p_so_do_id: soDoId,
      });
      if (error) throw error;
      return data as unknown as ImportReport;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topology_ket_noi"] }),
  });
}
