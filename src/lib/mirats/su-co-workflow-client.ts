// ============================================================================
// N6 — Client hooks/RPC wrappers cho máy trạng thái sự cố / hỏng hóc.
// ============================================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import type { LichSuBuoc, SuCoTrangThai } from "@/lib/mirats/su-co-workflow";

export type DoiTuongBang = "su_co" | "hong_hoc";

export interface SuCoLichSuRow {
  id: string;
  doi_tuong_bang: DoiTuongBang;
  doi_tuong_id: string;
  buoc: number;
  tu_trang_thai: string | null;
  den_trang_thai: string;
  nguoi: string | null;
  at: string;
  ghi_chu: string | null;
  meta: Record<string, unknown>;
}

/** Đọc lịch sử vòng đời của một bản ghi (su_co hoặc hong_hoc). */
export function useSuCoLichSu(bang: DoiTuongBang, id: string | null | undefined) {
  return useQuery<SuCoLichSuRow[]>({
    queryKey: ["su_co_lich_su", bang, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co_lich_su")
        .select("*")
        .eq("doi_tuong_bang", bang)
        .eq("doi_tuong_id", id!)
        .order("buoc", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SuCoLichSuRow[];
    },
    staleTime: 15_000,
  });
}

/** Chuyển thành mảng `LichSuBuoc` dùng cho `computeMetrics`. */
export function toLichSuBuoc(rows: readonly SuCoLichSuRow[]): LichSuBuoc[] {
  return rows.map((r) => ({
    tu: (r.tu_trang_thai ?? null) as LichSuBuoc["tu"],
    den: r.den_trang_thai as LichSuBuoc["den"],
    at: r.at,
  }));
}

export interface TransitionInput {
  bang: DoiTuongBang;
  id: string;
  den: SuCoTrangThai;
  ghi_chu?: string;
  meta?: Record<string, unknown>;
}

/** Gọi RPC `su_co_transition` để chuyển trạng thái. */
export function useSuCoTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransitionInput) => {
      const { data, error } = await supabase.rpc("su_co_transition", {
        _bang: input.bang,
        _id: input.id,
        _den: input.den,
        _ghi_chu: input.ghi_chu ?? undefined,
        _meta: (input.meta ?? {}) as never,
      });
      if (error) throw error;
      return data as unknown as SuCoLichSuRow;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["su_co_lich_su", input.bang, input.id] });
      qc.invalidateQueries({ queryKey: ["su_co"] });
      qc.invalidateQueries({ queryKey: ["hong_hoc"] });
      qc.invalidateQueries({ queryKey: ["scope"] });
    },
  });
}
