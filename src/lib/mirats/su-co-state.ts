// ============================================================================
// TRẠNG THÁI & CHUYỂN TRẠNG THÁI cho SỰ CỐ (su_co) — module THUẦN (pure),
// không phụ thuộc React/Supabase, dùng chung cho danh sách, badge, Dashboard
// và trang chi tiết để mọi nơi hiểu "đang mở" / "đã đóng" giống nhau.
//
// Quyền chỉnh trạng thái (đóng / mở lại) PHẢI đồng bộ với RLS `su_co_write`:
//   chỉ tài khoản quản lý tài sản (admin / phong_kt = can_manage_equipment)
//   mới được UPDATE su_co. Người dùng đơn vị chỉ được LẬP sự cố (insert), không
//   tự đóng / mở lại. Helper `canManageSuCoState` phản chiếu đúng luật này để
//   giao diện không hiển thị hành động sẽ bị CSDL từ chối.
// ============================================================================

import type { AppRole } from "@/hooks/use-session";
import type { SuCo } from "@/lib/mirats/types";
import { statuses, storedValuesFor } from "@/lib/mirats/trang-thai";

export type SuCoState = "Mới" | "Đang xử lý" | "Đã khắc phục" | "Đóng";

/** Thứ tự vòng đời sự cố — derive từ trang-thai.ts (nhãn VN theo thứ tự khai báo). */
export const SU_CO_STATES: SuCoState[] = statuses("su_co").map(
  (s) => s.label as SuCoState,
);

/** Trạng thái "đang mở" — cần theo dõi / xử lý (dùng cho badge & Dashboard). */
export const OPEN_STATES: ReadonlySet<string> = storedValuesFor("su_co", [
  "open",
  "in_progress",
]);

/** Trạng thái coi như đã kết thúc (không còn mở). */
export const CLOSED_STATES: ReadonlySet<string> = storedValuesFor("su_co", [
  "closed",
  "cancelled",
]);

export function isOpenState(trangThai: string | null | undefined): boolean {
  return OPEN_STATES.has((trangThai ?? "").trim());
}

export function isClosedState(trangThai: string | null | undefined): boolean {
  return CLOSED_STATES.has((trangThai ?? "").trim());
}

/**
 * Bản đồ chuyển trạng thái hợp lệ.
 *   Mới        → Đang xử lý · Đã khắc phục · Đóng
 *   Đang xử lý → Đã khắc phục · Đóng · Mới (trả về)
 *   Đã khắc phục → Đóng · Đang xử lý (mở lại)
 *   Đóng       → Đang xử lý (mở lại)
 */
export const ALLOWED_TRANSITIONS: Record<SuCoState, SuCoState[]> = {
  "Mới": ["Đang xử lý", "Đã khắc phục", "Đóng"],
  "Đang xử lý": ["Đã khắc phục", "Đóng", "Mới"],
  "Đã khắc phục": ["Đóng", "Đang xử lý"],
  "Đóng": ["Đang xử lý"],
};

function isSuCoState(v: string | null | undefined): v is SuCoState {
  return !!v && (SU_CO_STATES as string[]).includes(v);
}

/** Có được phép chuyển từ trạng thái `from` sang `to` không (theo vòng đời). */
export function canTransition(from: string | null | undefined, to: string | null | undefined): boolean {
  if (!isSuCoState(from) || !isSuCoState(to)) return false;
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Đúng nếu vai trò được phép chỉnh trạng thái sự cố (đồng bộ can_manage_equipment). */
export function canManageSuCoState(roles: readonly AppRole[] | null | undefined): boolean {
  if (!roles) return false;
  return roles.includes("admin") || roles.includes("phong_kt");
}

/** "Đóng" = chuyển sang trạng thái đã kết thúc; chỉ người quản lý & khi đang mở. */
export function canCloseFrom(
  roles: readonly AppRole[] | null | undefined,
  from: string | null | undefined,
): boolean {
  return canManageSuCoState(roles) && isOpenState(from);
}

/** "Mở lại" = từ trạng thái đã kết thúc quay lại "Đang xử lý"; chỉ người quản lý. */
export function canReopen(
  roles: readonly AppRole[] | null | undefined,
  from: string | null | undefined,
): boolean {
  return canManageSuCoState(roles) && isClosedState(from) && canTransition(from, "Đang xử lý");
}

/**
 * Ràng buộc dữ liệu: một sự cố chỉ có thể ở trạng thái "Đã khắc phục"
 * khi đã có `thoi_diem_khac_phuc`. Hàm này trả về `true` nếu row có đủ
 * điều kiện để được đánh dấu "Đã khắc phục" (đã có mốc khắc phục).
 */
export function canClose(
  row: { thoi_diem_khac_phuc?: string | null } | null | undefined,
): boolean {
  if (!row) return false;
  const v = row.thoi_diem_khac_phuc;
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * "Đóng hồ sơ" — chuyển "Đã khắc phục" → "Đóng" (kết thúc chính thức).
 * Chỉ đúng khi row đang ở "Đã khắc phục" và người dùng có quyền quản lý.
 */
export function canFinalize(
  row: { trang_thai?: string | null } | null | undefined,
  roles: readonly AppRole[] | null | undefined,
): boolean {
  if (!row) return false;
  return (row.trang_thai ?? "").trim() === "Đã khắc phục" && canManageSuCoState(roles);
}


/** Đếm số sự cố đang mở — nguồn dùng chung cho badge & Dashboard. */
export function countOpenIncidents(list: readonly SuCo[]): number {
  let n = 0;
  for (const s of list) if (isOpenState(s.trang_thai)) n++;
  return n;
}

/** Danh sách sự cố đang mở. */
export function openIncidents(list: readonly SuCo[]): SuCo[] {
  return list.filter((s) => isOpenState(s.trang_thai));
}
