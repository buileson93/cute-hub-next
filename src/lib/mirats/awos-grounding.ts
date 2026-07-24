// ============================================================================
// awos-grounding.ts — Logic THUẦN cho ĐO TIẾP ĐỊA (grounding) trong PL04 AWOS.
//
// Quy tắc đã duyệt (điện trở tiếp địa, đơn vị Ω):
//   • Trong nhà (indoor)      : ĐẠT khi < 4 Ω.
//   • Tại trạm / ngoài trời   : ĐẠT khi < 10 Ω.
//
// Giá trị đo LƯU dạng NUMBER (Ω), không lưu chuỗi (result_kind = "so").
// Module KHÔNG phụ thuộc DB/React → test được & dùng chung server/client.
// ============================================================================

import type { KetQua } from "./checklist";

/** Mã hạng mục đo tiếp địa (ổn định — trùng với seed PL-KT-AWOS-04). */
export const AWOS_GROUNDING_ITEM = {
  INDOOR: "AWOS04-S01-01",
  STATION: "AWOS04-S01-02",
} as const;

export type GroundingScope = "indoor" | "station";

/** Ngưỡng tối đa (Ω) theo phạm vi. */
export const GROUNDING_MAX_OHM: Record<GroundingScope, number> = {
  indoor: 4,
  station: 10,
};

/** Đơn vị & mô tả tiêu chuẩn hiển thị (khớp seed). */
export const GROUNDING_UNIT = "Ω";
export const GROUNDING_STANDARD: Record<GroundingScope, string> = {
  indoor: "< 4 Ω",
  station: "< 10 Ω",
};

/** Suy ra phạm vi đo từ item_code; null nếu không phải hạng mục tiếp địa. */
export function groundingScopeOf(itemCode: string): GroundingScope | null {
  if (itemCode === AWOS_GROUNDING_ITEM.INDOOR) return "indoor";
  if (itemCode === AWOS_GROUNDING_ITEM.STATION) return "station";
  return null;
}

export type GroundingEval = {
  scope: GroundingScope;
  max: number;
  ohm: number;
  /** true = ĐẠT (< ngưỡng). */
  dat: boolean;
  ket_qua: Extract<KetQua, "dat" | "khong_dat">;
  standard: string;
};

/**
 * Đánh giá 1 giá trị đo tiếp địa theo ngưỡng đã duyệt.
 * Trả null nếu không phải hạng mục tiếp địa hoặc giá trị không hợp lệ.
 */
export function evaluateGrounding(
  itemCode: string,
  ohm: number | null | undefined,
): GroundingEval | null {
  const scope = groundingScopeOf(itemCode);
  if (!scope) return null;
  if (ohm == null || !Number.isFinite(ohm)) return null;
  const max = GROUNDING_MAX_OHM[scope];
  const dat = ohm < max;
  return {
    scope,
    max,
    ohm,
    dat,
    ket_qua: dat ? "dat" : "khong_dat",
    standard: GROUNDING_STANDARD[scope],
  };
}

/** True nếu item_code là hạng mục đo tiếp địa. */
export function isGroundingItem(itemCode: string): boolean {
  return groundingScopeOf(itemCode) !== null;
}
