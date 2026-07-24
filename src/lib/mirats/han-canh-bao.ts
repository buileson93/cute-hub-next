// ============================================================================
// han-canh-bao.ts — Task 13: MỘT chuẩn ngưỡng "sắp hết hạn" cho toàn hệ thống.
//
// Trước đây các nơi định nghĩa 30/60/90 rải rác (canh-bao-het-han, db-expiring
// default 60, licenseStatus 90, nhãn KPI hard-code) → cảnh báo/notification/nhãn
// lệch nhau. File này là NGUỒN DUY NHẤT; mọi module khác import từ đây.
// ============================================================================

/** Ba ngưỡng cảnh báo (ngày), tăng dần. */
export const NGUONG_CANH_BAO = [30, 60, 90] as const;
export type NguongCanhBao = (typeof NGUONG_CANH_BAO)[number];

/** Cửa sổ mặc định để coi là "sắp hết hạn" — dùng cho query/nhãn KPI/notification. */
export const DEFAULT_NGAY_SAP_HET_HAN: NguongCanhBao = 90;

/**
 * Ngưỡng nhỏ nhất ≥ số ngày còn lại. Null nếu đã quá hạn (<0) hoặc còn xa hơn
 * ngưỡng lớn nhất (>90). Dùng cho escalation notification.
 */
export function nguongCho(soNgay: number): NguongCanhBao | null {
  if (!Number.isFinite(soNgay) || soNgay < 0) return null;
  for (const n of NGUONG_CANH_BAO) if (soNgay <= n) return n;
  return null;
}
