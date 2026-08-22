// ============================================================================
// Logic thuần (không phụ thuộc DB/React) cho phiếu công việc bảo dưỡng.
// Phản chiếu đúng quy tắc của RPC hoan_thanh_cong_viec_bao_tri và view
// v_kpi_bao_tri để có thể kiểm thử độc lập:
//   • Chuyển trạng thái hợp lệ (chỉ MO/DANG_LAM -> HOAN_THANH).
//   • Ngày hoàn thành = hôm nay.
//   • Liên kết biên bản (bao_tri) phải khớp tài sản của phiếu.
//   • Kỳ bảo dưỡng kế tiếp theo chu kỳ chính sách.
//   • KPI đúng hạn / quá hạn theo đơn vị.
//   • Quyền thao tác theo vai trò.
// ============================================================================

import type { AppRole } from "@/hooks/use-session";

import { storedValuesFor } from "@/lib/mirats/trang-thai";

export type CongViecTrangThai = "MO" | "DANG_LAM" | "HOAN_THANH" | "HUY";

/** Trạng thái còn mở (được phép hoàn thành) — derive từ trang-thai.ts. */
export const OPEN_STATES: ReadonlySet<CongViecTrangThai> = new Set(
  Array.from(storedValuesFor("cong_viec", ["open", "in_progress"])).filter(
    (v): v is CongViecTrangThai => v === "MO" || v === "DANG_LAM",
  ),
);
/** Trạng thái đã kết thúc (không thể hoàn thành lại) — derive từ trang-thai.ts. */
export const CLOSED_STATES: ReadonlySet<CongViecTrangThai> = new Set(
  Array.from(storedValuesFor("cong_viec", ["closed", "cancelled"])).filter(
    (v): v is CongViecTrangThai => v === "HOAN_THANH" || v === "HUY",
  ),
);

/** Bảng chuyển trạng thái hợp lệ. */
export const ALLOWED_TRANSITIONS: Record<CongViecTrangThai, ReadonlySet<CongViecTrangThai>> = {
  MO: new Set(["DANG_LAM", "HOAN_THANH", "HUY"]),
  DANG_LAM: new Set(["HOAN_THANH", "HUY"]),
  HOAN_THANH: new Set([]),
  HUY: new Set([]),
};

export function isOpenState(tt: string): boolean {
  return OPEN_STATES.has(tt as CongViecTrangThai);
}

export function canTransition(from: string, to: CongViecTrangThai): boolean {
  const set = ALLOWED_TRANSITIONS[from as CongViecTrangThai];
  return set ? set.has(to) : false;
}

/** Chỉ phiếu đang MO/DANG_LAM mới được hoàn thành (chặn hoàn thành lại). */
export function canComplete(cv: { trang_thai: string }): boolean {
  return isOpenState(cv.trang_thai);
}

/** Vai trò được quản lý phiếu bảo dưỡng (khớp can_manage_equipment). */
export function canManageCongViec(roles: AppRole[] | AppRole | null | undefined): boolean {
  if (!roles) return false;
  const list = Array.isArray(roles) ? roles : [roles];
  return list.includes("admin") || list.includes("phong_kt");
}

/**
 * Biên bản (bao_tri) chỉ được liên kết khi thuộc đúng tài sản của phiếu.
 * Trả về true nếu hợp lệ để gắn vào phiếu.
 */
export function bienBanMatchesDevice(
  baoTri: { thiet_bi_id: string | null } | null | undefined,
  cvThietBiId: string | null,
): boolean {
  if (!baoTri) return false;
  // Nếu một trong hai thiếu tài sản -> không mâu thuẫn, cho phép liên kết.
  if (!cvThietBiId || !baoTri.thiet_bi_id) return true;
  return baoTri.thiet_bi_id === cvThietBiId;
}

/**
 * Kỳ bảo dưỡng kế tiếp: fromDate + chu_ky_ngay.
 * Nếu chu kỳ không hợp lệ (null/<=0) trả về giá trị cũ (giữ nguyên).
 */
export function nextDueDate(
  fromISO: string,
  chuKyNgay: number | null | undefined,
  current: string | null,
): string | null {
  if (chuKyNgay == null || chuKyNgay <= 0) return current;
  const d = new Date(fromISO + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + chuKyNgay);
  return d.toISOString().slice(0, 10);
}

export interface CongViecKpiRow {
  don_vi_id_snapshot: string | null;
  trang_thai: string;
  ngay_den_han: string | null;
  ngay_hoan_thanh: string | null;
}

export interface KpiBaoTriAgg {
  don_vi_id: string | null;
  tong_cong_viec: number;
  da_hoan_thanh: number;
  dang_mo: number;
  qua_han: number;
  hoan_thanh_dung_han: number;
  ty_le_dung_han: number | null;
}

/**
 * Tổng hợp KPI theo đơn vị — phản chiếu view v_kpi_bao_tri.
 * `today` mặc định là hôm nay (ISO date), cho phép truyền vào để test.
 */
export function computeKpiBaoTri(
  rows: CongViecKpiRow[],
  today = new Date().toISOString().slice(0, 10),
): KpiBaoTriAgg[] {
  const groups = new Map<string, KpiBaoTriAgg>();
  for (const r of rows) {
    const key = r.don_vi_id_snapshot ?? "__NULL__";
    let g = groups.get(key);
    if (!g) {
      g = {
        don_vi_id: r.don_vi_id_snapshot,
        tong_cong_viec: 0,
        da_hoan_thanh: 0,
        dang_mo: 0,
        qua_han: 0,
        hoan_thanh_dung_han: 0,
        ty_le_dung_han: null,
      };
      groups.set(key, g);
    }
    g.tong_cong_viec += 1;
    const done = r.trang_thai === "HOAN_THANH";
    const open = r.trang_thai === "MO" || r.trang_thai === "DANG_LAM";
    if (done) g.da_hoan_thanh += 1;
    if (open) g.dang_mo += 1;
    if (open && r.ngay_den_han != null && r.ngay_den_han < today) g.qua_han += 1;
    if (
      done &&
      r.ngay_den_han != null &&
      r.ngay_hoan_thanh != null &&
      r.ngay_hoan_thanh <= r.ngay_den_han
    ) {
      g.hoan_thanh_dung_han += 1;
    }
  }
  for (const g of groups.values()) {
    g.ty_le_dung_han =
      g.da_hoan_thanh > 0
        ? Math.round((1000 * g.hoan_thanh_dung_han) / g.da_hoan_thanh) / 10
        : null;
  }
  return [...groups.values()];
}
