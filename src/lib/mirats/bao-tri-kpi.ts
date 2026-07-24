// ============================================================================
// bao-tri-kpi.ts — NGUỒN DUY NHẤT (single source of truth) cho KPI bảo dưỡng
// hiển thị trên Dashboard: "PM hoàn thành đúng hạn".
//
// Nguồn dữ liệu DUY NHẤT là bảng phiếu công việc bảo dưỡng (cong_viec_bao_tri),
// vì chỉ ở đó mới có mốc "đến hạn" (ngay_den_han) thực để so với ngày hoàn thành.
//
// Quy tắc tỷ lệ đúng hạn:
//   • Mẫu = phiếu ĐÃ HOÀN THÀNH (trang_thai = HOAN_THANH) có đủ ngày đến hạn
//     và ngày hoàn thành.
//   • Đúng hạn ⇔ ngay_hoan_thanh <= ngay_den_han.
//   • Phiếu CHƯA hoàn thành KHÔNG được tính vào tỷ lệ đúng hạn.
//   • Không có mẫu nào → value = null (Chưa đủ dữ liệu), KHÔNG trả 0%.
//   • Mỗi phiếu cấu thành được giữ trong `sources` để DRILL-DOWN.
// Hàm THUẦN (pure) — không phụ thuộc React/Supabase, chỉ nhận dữ liệu qua tham số.
// ============================================================================

import { useMemo } from "react";
import type { KpiResult, KpiSourceRecord } from "./reliability";
import { useCongViecBaoTri, type CongViecRow } from "./cong-viec-bao-tri";

/** Hình dạng tối thiểu của một phiếu công việc cần cho KPI đúng hạn. */
export interface PmWorkOrder {
  id?: string | null;
  ma_cong_viec?: string | null;
  trang_thai: string;
  ngay_den_han: string | null;
  ngay_hoan_thanh: string | null;
}

/**
 * Tỷ lệ PM hoàn thành đúng hạn (%) — nguồn duy nhất.
 * Trả KpiResult (unit = "percent"). value = null ⇔ chưa đủ dữ liệu.
 */
export function pmOnTimeRate(rows: readonly PmWorkOrder[]): KpiResult {
  const sources: KpiSourceRecord[] = [];
  let onTime = 0;
  for (const r of rows) {
    // Phiếu chưa hoàn thành không tính đúng hạn.
    if (r.trang_thai !== "HOAN_THANH") continue;
    // Thiếu mốc đến hạn / hoàn thành thì không thể xét đúng hạn → loại khỏi mẫu.
    if (!r.ngay_den_han || !r.ngay_hoan_thanh) continue;
    const ok = r.ngay_hoan_thanh <= r.ngay_den_han;
    if (ok) onTime += 1;
    sources.push({
      id: r.id ?? null,
      ma: r.ma_cong_viec ?? null,
      ngay: r.ngay_den_han,
      downtimeMinutes: null,
      onTime: ok,
    });
  }
  if (sources.length === 0) {
    return {
      value: null,
      unit: "percent",
      sampleSize: 0,
      sources: [],
      insufficient: true,
      reason: "Chưa có phiếu bảo dưỡng nào hoàn thành để tính đúng hạn",
    };
  }
  // Làm tròn 1 chữ số thập phân (2/3 → 66,7%).
  const value = Math.round((1000 * onTime) / sources.length) / 10;
  return {
    value,
    unit: "percent",
    sampleSize: sources.length,
    sources,
    insufficient: false,
    reason: null,
  };
}

/**
 * Hook repository: đọc phiếu công việc bảo dưỡng (nguồn duy nhất) và tính KPI
 * đúng hạn. Dùng chung queryKey với useCongViecBaoTri để không đọc lặp.
 */
export function usePmOnTimeKpi(): { result: KpiResult; isLoading: boolean } {
  const { data, isLoading } = useCongViecBaoTri();
  const result = useMemo(() => pmOnTimeRate((data ?? []) as CongViecRow[]), [data]);
  return { result, isLoading };
}
