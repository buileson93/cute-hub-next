// ============================================================================
// TRẠNG THÁI & QUY TẮC ĐÓNG cho VẤN ĐỀ (van_de / RCA) — module THUẦN (pure),
// không phụ thuộc React/Supabase, dùng chung cho giao diện /van-de và phản
// chiếu đúng luật DB (RPC dong_van_de + RLS van_de_write / phe_duyet_cong_viec).
//
// Nguyên tắc:
//   • Quyền chỉnh trạng thái / phê duyệt PHẢI đồng bộ can_manage_equipment
//     (admin | phong_kt). Vai trò khác chỉ xem hoặc lập, không đóng/duyệt.
//   • KHÔNG được đóng vấn đề khi còn "hành động bắt buộc" (công việc khắc phục
//     bat_buoc = true) chưa HOÀN_THÀNH/HỦY — tránh đóng RCA khi biện pháp
//     triệt để chưa xong. Đây là mirror của kiểm tra trong RPC dong_van_de.
// ============================================================================

import type { AppRole } from "@/hooks/use-session";
import { statuses, storedValuesFor } from "@/lib/mirats/trang-thai";

/** Mã trạng thái vấn đề (khớp cột van_de.trang_thai). */
export type VanDeState =
  | "moi"
  | "dang_phan_tich"
  | "da_xac_dinh"
  | "da_khac_phuc"
  | "dong";

export const VAN_DE_STATES: VanDeState[] = statuses("van_de").map(
  (s) => s.code as VanDeState,
);

/** "dong" là trạng thái kết thúc; còn lại coi như đang mở. */
export function isVanDeClosed(trangThai: string | null | undefined): boolean {
  return (trangThai ?? "").trim() === "dong";
}
export function isVanDeOpen(trangThai: string | null | undefined): boolean {
  const t = (trangThai ?? "").trim();
  return t !== "" && t !== "dong";
}

/** Trạng thái công việc khắc phục (khớp cong_viec_bao_tri.trang_thai) — derive. */
export const ACTION_DONE_STATES: ReadonlySet<string> = new Set(
  Array.from(storedValuesFor("cong_viec", ["closed", "cancelled"])).filter((v) =>
    /^[A-Z_]+$/.test(v),
  ),
);

/** Một công việc còn "mở" khi chưa HOÀN_THÀNH và chưa HỦY. */
export function isActionOpen(trangThai: string | null | undefined): boolean {
  return !ACTION_DONE_STATES.has((trangThai ?? "").trim());
}

/** Hình dạng tối thiểu của công việc khắc phục dùng cho quy tắc đóng. */
export interface RcaAction {
  bat_buoc?: boolean | null;
  trang_thai?: string | null;
}

/**
 * Danh sách hành động BẮT BUỘC còn mở — chính là các mục chặn đóng vấn đề.
 */
export function blockingActions<T extends RcaAction>(actions: readonly T[]): T[] {
  return actions.filter((a) => !!a.bat_buoc && isActionOpen(a.trang_thai));
}

/** Đúng nếu vai trò được phép chỉnh trạng thái vấn đề (đồng bộ can_manage_equipment). */
export function canManageVanDe(roles: readonly AppRole[] | null | undefined): boolean {
  if (!roles) return false;
  return roles.includes("admin") || roles.includes("phong_kt");
}

/** Quyền phê duyệt công việc / thay đổi — cùng luật với RPC phe_duyet_cong_viec. */
export function canApproveCongViec(roles: readonly AppRole[] | null | undefined): boolean {
  return canManageVanDe(roles);
}

export interface CloseCheck {
  ok: boolean;
  /** Lý do không đóng được (nếu ok = false). */
  reason?: string;
  /** Số hành động bắt buộc còn mở. */
  blocking: number;
}

/**
 * Kiểm tra có được đóng vấn đề không. Mirror của RPC dong_van_de:
 *   1. Phải đúng vai trò quản lý.
 *   2. Không còn hành động bắt buộc đang mở.
 */
export function canCloseVanDe<T extends RcaAction>(
  roles: readonly AppRole[] | null | undefined,
  actions: readonly T[],
): CloseCheck {
  if (!canManageVanDe(roles)) {
    return { ok: false, reason: "Không có quyền đóng vấn đề", blocking: 0 };
  }
  const blocking = blockingActions(actions);
  if (blocking.length > 0) {
    return {
      ok: false,
      reason: `Còn ${blocking.length} hành động bắt buộc chưa hoàn thành`,
      blocking: blocking.length,
    };
  }
  return { ok: true, blocking: 0 };
}
