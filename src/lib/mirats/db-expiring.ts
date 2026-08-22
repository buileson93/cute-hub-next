// ============================================================================
// Hạn sắp hết: hợp nhất bảo hành tài sản (thiet_bi.han_bao_hanh) và
// giấy phép (giay_phep.ngay_het_han) qua view v_sap_het_han (SECURITY INVOKER,
// tôn trọng RLS của bảng gốc).
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { DEFAULT_NGAY_SAP_HET_HAN } from "./han-canh-bao";

export type ExpiringLoai = "bao_hanh" | "giay_phep";

export interface ExpiringRow {
  loai: ExpiringLoai;
  thiet_bi_id: string | null;
  ten: string | null;
  ngay_het_han: string;
  so_ngay_con_lai: number;
}

/** Lọc thuần: chỉ giữ mục còn hạn trong khoảng [0, days], sắp xếp gần hết hạn trước.
 *  Đối với tài sản, chỉ áp dụng cảnh báo nếu là 'Tài sản hệ thống' (vai_tro='he_thong')
 *  hoặc Nhóm 1 (phan_loai_id mapped to N1).
 *  LƯU Ý: logic vai_tro nên được lọc ở view v_sap_het_han nếu có thể,
 *  nhưng ở đây ta lọc thêm ở frontend để chắc chắn.
 */
export function locSapHetHan(rows: ExpiringRow[], days: number): ExpiringRow[] {
  return rows
    .filter((r) => r.so_ngay_con_lai >= 0 && r.so_ngay_con_lai <= days)
    .sort((a, b) => a.so_ngay_con_lai - b.so_ngay_con_lai);
}

/** Đọc view v_sap_het_han rồi lọc theo số ngày còn lại. */
export async function getExpiring({
  days = DEFAULT_NGAY_SAP_HET_HAN,
}: { days?: number } = {}): Promise<ExpiringRow[]> {
  const { data, error } = await supabase
    .from("v_sap_het_han")
    .select("loai, thiet_bi_id, ten, ngay_het_han, so_ngay_con_lai")
    .lte("so_ngay_con_lai", days)
    .gte("so_ngay_con_lai", 0)
    .order("so_ngay_con_lai", { ascending: true });
  if (error) throw error;
  const rows: ExpiringRow[] = (data ?? []).map((r) => ({
    loai: (r.loai === "giay_phep" ? "giay_phep" : "bao_hanh") as ExpiringLoai,
    thiet_bi_id: r.thiet_bi_id ?? null,
    ten: r.ten ?? null,
    ngay_het_han: r.ngay_het_han ?? "",
    so_ngay_con_lai: Number(r.so_ngay_con_lai ?? 0),
  }));
  return locSapHetHan(rows, days);
}

/** Hook React Query cho danh sách sắp hết hạn. */
export function useExpiringData(days = DEFAULT_NGAY_SAP_HET_HAN) {
  const q = useQuery({
    queryKey: ["v_sap_het_han", days],
    queryFn: () => getExpiring({ days }),
    staleTime: 30_000,
  });
  return { ...q, rows: q.data ?? [] };
}
