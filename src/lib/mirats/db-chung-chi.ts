// ============================================================================
// Task 48 — Truy vấn chứng chỉ KĐ/HC + tài sản thuộc diện KĐ/HC.
// Chỉ đọc dữ liệu Task 47 (thiet_bi.che_do_kd_hc + chung_chi_thiet_bi +
// v_sap_het_han loai='chung_chi'); không thêm nguồn dữ liệu.
// ============================================================================
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { fetchAllRows } from "./paginate";
import type { CheDoKdHc, LoaiChungNhan } from "@/lib/mirats/kiem-dinh";
import { chungChiMoiNhat, trangThaiHetHan } from "@/lib/mirats/kiem-dinh";

export interface ChungChiRow {
  id: string;
  thiet_bi_id: string;
  loai: LoaiChungNhan;
  so_giay_chung_nhan: string;
  ngay_bat_dau: string | null;
  ngay_het_han: string | null;
  ghi_chu: string | null;
}

export interface KdHcRow {
  thiet_bi_id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  model: string | null;
  don_vi_id: string | null;
  he_thong_id: string | null;
  che_do: CheDoKdHc; // != 'KHONG'
  cc: ChungChiRow | null; // chứng chỉ mới nhất
  soNgay: number | null;
  daHetHan: boolean;
}

async function loadKdHc(): Promise<KdHcRow[]> {
  const tbs = await fetchAllRows<{
    id: string;
    ma_thiet_bi: string;
    ten_thiet_bi: string | null;
    model: string | null;
    don_vi_id: string | null;
    he_thong_id: string | null;
    che_do_kd_hc: string;
  }>((from, to) =>
    supabase
      .from("thiet_bi")
      .select("id, ma_thiet_bi, ten_thiet_bi, model, don_vi_id, he_thong_id, che_do_kd_hc")
      .neq("che_do_kd_hc", "KHONG")
      .range(from, to),
  );
  const ids = tbs.map((r) => r.id);
  const ccByDev = new Map<string, ChungChiRow[]>();
  if (ids.length > 0) {
    const { data: ccs, error: e2 } = await supabase
      .from("chung_chi_thiet_bi")
      .select("id, thiet_bi_id, loai, so_giay_chung_nhan, ngay_bat_dau, ngay_het_han, ghi_chu")
      .in("thiet_bi_id", ids);
    if (e2) throw e2;
    for (const c of ccs ?? []) {
      const arr = ccByDev.get(c.thiet_bi_id) ?? [];
      arr.push(c as ChungChiRow);
      ccByDev.set(c.thiet_bi_id, arr);
    }
  }
  return tbs.map((r) => {
    const list = ccByDev.get(r.id) ?? [];
    const cc = chungChiMoiNhat(
      list.map((c) => ({
        thiet_bi_id: c.thiet_bi_id,
        loai: c.loai,
        so_giay_chung_nhan: c.so_giay_chung_nhan,
        ngay_bat_dau: c.ngay_bat_dau,
        ngay_het_han: c.ngay_het_han,
      })),
    );
    const found = cc
      ? (list.find((x) => x.so_giay_chung_nhan === cc.so_giay_chung_nhan) ?? null)
      : null;
    const tt = trangThaiHetHan(found?.ngay_het_han ?? null);
    return {
      thiet_bi_id: r.id,
      ma_thiet_bi: r.ma_thiet_bi ?? "",
      ten_thiet_bi: r.ten_thiet_bi ?? "",
      model: r.model ?? null,
      don_vi_id: r.don_vi_id ?? null,
      he_thong_id: r.he_thong_id ?? null,
      che_do: r.che_do_kd_hc as CheDoKdHc,
      cc: found,
      soNgay: tt.soNgay,
      daHetHan: tt.daHetHan,
    };
  });
}

export function useKdHcList() {
  return useQuery({ queryKey: ["kd_hc_list"], queryFn: loadKdHc, staleTime: 60_000 });
}

export function useChungChiByDevice(thietBiId: string | null | undefined) {
  return useQuery({
    queryKey: ["chung_chi_thiet_bi", thietBiId],
    enabled: !!thietBiId,
    queryFn: async (): Promise<ChungChiRow[]> => {
      const { data, error } = await supabase
        .from("chung_chi_thiet_bi")
        .select("id, thiet_bi_id, loai, so_giay_chung_nhan, ngay_bat_dau, ngay_het_han, ghi_chu")
        .eq("thiet_bi_id", thietBiId as string)
        .order("ngay_het_han", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChungChiRow[];
    },
    staleTime: 60_000,
  });
}

export function useInvalidateChungChi() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["chung_chi_thiet_bi"] });
    qc.invalidateQueries({ queryKey: ["kd_hc_list"] });
    qc.invalidateQueries({ queryKey: ["nav-badge", "kd_hc_sap_het_han"] });
  };
}
