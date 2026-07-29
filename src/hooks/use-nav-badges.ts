// ============================================================================
// Task 28 — Hook đếm số liệu cho badge Sidebar.
// Trả về số lượng theo `NavBadgeKey`; 0 nghĩa là ẩn badge.
// ============================================================================
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { DEFAULT_NGAY_SAP_HET_HAN } from "@/lib/mirats/han-canh-bao";
import type { NavBadgeKey } from "@/lib/mirats/nav/nav-config";

const OPEN_SU_CO = ["Mới", "Đang xử lý"];
const OPEN_HONG_HOC = ["Mới", "Đang xử lý"];

async function demSuCoMo(): Promise<number> {
  const { count } = await supabase
    .from("su_co")
    .select("id", { count: "exact", head: true })
    .in("trang_thai", OPEN_SU_CO);
  return count ?? 0;
}

async function demHongHocMo(): Promise<number> {
  const { count } = await supabase
    .from("hong_hoc")
    .select("id", { count: "exact", head: true })
    .in("trang_thai", OPEN_HONG_HOC);
  return count ?? 0;
}

async function demSapHetHan(): Promise<number> {
  const { count } = await supabase
    .from("v_sap_het_han")
    .select("thiet_bi_id", { count: "exact", head: true })
    .gte("so_ngay_con_lai", 0)
    .lte("so_ngay_con_lai", DEFAULT_NGAY_SAP_HET_HAN);
  return count ?? 0;
}

async function demKdHcSapHetHan(): Promise<number> {
  // Task 48 — số chứng chỉ KĐ/HC sắp hết hạn (≤ ngưỡng mặc định) hoặc đã quá hạn.
  const { count } = await supabase
    .from("v_sap_het_han")
    .select("thiet_bi_id", { count: "exact", head: true })
    .eq("loai", "chung_chi")
    .lte("so_ngay_con_lai", DEFAULT_NGAY_SAP_HET_HAN);
  return count ?? 0;
}

export function useNavBadges(): Record<NavBadgeKey, number> {
  const suCo = useQuery({
    queryKey: ["nav-badge", "su_co_mo"],
    queryFn: demSuCoMo,
    staleTime: 60_000,
  });
  const hongHoc = useQuery({
    queryKey: ["nav-badge", "hong_hoc_mo"],
    queryFn: demHongHocMo,
    staleTime: 60_000,
  });
  const sapHet = useQuery({
    queryKey: ["nav-badge", "sap_het_han"],
    queryFn: demSapHetHan,
    staleTime: 5 * 60_000,
  });
  const kdHc = useQuery({
    queryKey: ["nav-badge", "kd_hc_sap_het_han"],
    queryFn: demKdHcSapHetHan,
    staleTime: 5 * 60_000,
  });
  return {
    su_co_mo: suCo.data ?? 0,
    hong_hoc_mo: hongHoc.data ?? 0,
    sap_het_han: sapHet.data ?? 0,
    kd_hc_sap_het_han: kdHc.data ?? 0,
  };
}
