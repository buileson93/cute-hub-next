// ============================================================================
// TRẠNG THÁI & LUẬT HOÀN THÀNH cho HỎNG HÓC (hong_hoc). Module thuần (pure) —
// không phụ thuộc React/Supabase, dùng chung cho danh sách, form và RPC guard.
//
// Đồng bộ với DB: cột `trang_thai` hiện lưu nhãn VN ("Mới", "Đang xử lý",
// "Hoàn thành"). Module dùng `normalizeLegacy` để so sánh không phân biệt
// biến thể; giao diện tiếp tục ghi/hiển thị nhãn VN. "huy" là trạng thái
// khai báo mới trong Task 5 để cho phép huỷ phiếu ngoài luồng hoàn thành.
// ============================================================================

import type { AppRole } from "@/hooks/use-session";
import { normalizeLegacy } from "@/lib/mirats/trang-thai";

export const HONG_HOC_STATES = ["moi", "dang_xu_ly", "hoan_thanh", "huy"] as const;
export type HongHocState = (typeof HONG_HOC_STATES)[number];

const CLOSED = new Set<string>(["hoan_thanh", "huy"]);

export function isHongHocClosed(trangThai: string | null | undefined): boolean {
  const t = normalizeLegacy("hong_hoc", (trangThai ?? "").trim());
  if (t === "huy") return true;
  return CLOSED.has(t);
}
export function isHongHocOpen(trangThai: string | null | undefined): boolean {
  const raw = (trangThai ?? "").trim();
  if (!raw) return false;
  return !isHongHocClosed(raw);
}

/** Vai trò được tạo/sửa/hoàn thành phiếu hỏng hóc. */
export function canManageHongHoc(roles: readonly AppRole[] | null | undefined): boolean {
  if (!roles) return false;
  return roles.includes("admin") || roles.includes("phong_kt") || roles.includes("ktv");
}

/** Chuẩn hoá phương án về snake_case ổn định: sua_chua | thay_the | thanh_ly. */
export function normalizePhuongAn(pa: string | null | undefined): string {
  const raw = (pa ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "thay_the" || raw === "thay thế" || raw === "thay the") return "thay_the";
  if (raw === "sua_chua" || raw === "sửa chữa" || raw === "sua chua") return "sua_chua";
  if (raw === "thanh_ly" || raw === "thanh lý" || raw === "thanh ly") return "thanh_ly";
  return raw;
}

/**
 * Chỉ cho phép "Hoàn thành" khi:
 *   - có phương án hợp lệ, VÀ
 *   - nếu phương án = thay_the thì phải có thiet_bi_thay_the_id.
 * Mirror ràng buộc của RPC hoan_thanh_hong_hoc để UI không hiện nút sai.
 */
export function canCompleteHongHoc(row: {
  phuong_an: string | null | undefined;
  thiet_bi_thay_the_id: string | null | undefined;
}): boolean {
  const pa = normalizePhuongAn(row.phuong_an);
  if (!pa) return false;
  if (pa === "thay_the") return !!row.thiet_bi_thay_the_id;
  return pa === "sua_chua" || pa === "thanh_ly";
}
