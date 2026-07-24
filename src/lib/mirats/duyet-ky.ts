// ============================================================================
// duyet-ky.ts — Máy trạng thái luồng duyệt/ký điện tử cho biên bản
// (bảo dưỡng, bàn giao, sự cố). Thuần logic, không I/O, dễ test.
//
// Trạng thái: nhap → cho_duyet → da_duyet
//                 ↘ tu_choi (quay lại nhap)
//
// Quy tắc:
// - Chỉ người tạo/soạn thảo mới submit từ nhap → cho_duyet.
// - Chỉ vai trò được cấp quyền duyệt mới có thể da_duyet / tu_choi.
// - Đã da_duyet → khoá sửa, chỉ admin mới thu hồi được (thu_hoi → nhap).
// - Ghi chữ ký: hash SHA-256(nguoi_id + entity_id + trang_thai + thoi_diem).
// ============================================================================

import type { AppRole } from "@/hooks/use-session";

export const DUYET_KY_STATES = ["nhap", "cho_duyet", "da_duyet", "tu_choi"] as const;
export type DuyetKyState = (typeof DUYET_KY_STATES)[number];

export type DuyetKyAction = "submit" | "duyet" | "tu_choi" | "thu_hoi";

/** Vai trò được phép duyệt biên bản (theo cấp CNS/MET/ATM). */
export const VAI_TRO_DUYET: AppRole[] = ["admin", "phong_kt", "phu_trach_dv", "to_truong"];

/** Vai trò được phép thu hồi biên bản đã duyệt (mở khoá). */
export const VAI_TRO_THU_HOI: AppRole[] = ["admin"];

/** Chuyển đổi trạng thái hợp lệ. */
const TRANSITIONS: Record<DuyetKyState, Partial<Record<DuyetKyAction, DuyetKyState>>> = {
  nhap: { submit: "cho_duyet" },
  cho_duyet: { duyet: "da_duyet", tu_choi: "tu_choi" },
  tu_choi: { submit: "cho_duyet" },
  da_duyet: { thu_hoi: "nhap" },
};

export interface DuyetKyContext {
  /** Trạng thái hiện tại của biên bản. */
  currentState: DuyetKyState;
  /** Vai trò của người thao tác. */
  roles: AppRole[];
  /** ID người thao tác. */
  userId: string;
  /** ID người tạo biên bản (dùng để kiểm tra submit). */
  ownerId?: string | null;
}

export interface DuyetKyResult {
  ok: boolean;
  nextState?: DuyetKyState;
  reason?: string;
}

/** Có bất kỳ vai trò nào trong danh sách? */
function hasAnyRole(roles: AppRole[], required: AppRole[]): boolean {
  return roles.some((r) => required.includes(r));
}

/** Biên bản đã ở trạng thái khoá sửa? (đã duyệt) */
export function isLocked(state: DuyetKyState | string | null | undefined): boolean {
  return state === "da_duyet";
}

/** Người dùng có được sửa nội dung biên bản không? */
export function canEdit(ctx: DuyetKyContext): boolean {
  if (isLocked(ctx.currentState)) return false;
  // Ở trạng thái cho_duyet: chỉ người duyệt được sửa (thực tế thường không sửa,
  // họ chọn tu_choi để trả về). Người tạo phải chờ.
  if (ctx.currentState === "cho_duyet") {
    return hasAnyRole(ctx.roles, VAI_TRO_DUYET);
  }
  // nhap, tu_choi: người tạo hoặc admin/phong_kt được sửa
  if (ctx.ownerId && ctx.userId === ctx.ownerId) return true;
  return hasAnyRole(ctx.roles, ["admin", "phong_kt"]);
}

/** Thử một hành động; trả về trạng thái tiếp theo hoặc lý do từ chối. */
export function attemptAction(ctx: DuyetKyContext, action: DuyetKyAction): DuyetKyResult {
  const next = TRANSITIONS[ctx.currentState]?.[action];
  if (!next) {
    return { ok: false, reason: `Không thể thực hiện '${action}' từ trạng thái '${ctx.currentState}'` };
  }
  // Kiểm tra quyền
  if (action === "submit") {
    const isOwner = !!ctx.ownerId && ctx.userId === ctx.ownerId;
    const isEditor = hasAnyRole(ctx.roles, ["admin", "phong_kt"]);
    if (!isOwner && !isEditor) {
      return { ok: false, reason: "Chỉ người tạo hoặc quản trị mới được trình duyệt" };
    }
  }
  if (action === "duyet" || action === "tu_choi") {
    if (!hasAnyRole(ctx.roles, VAI_TRO_DUYET)) {
      return { ok: false, reason: "Vai trò không có quyền duyệt biên bản" };
    }
    // Không tự duyệt biên bản mình tạo (four-eye principle)
    if (ctx.ownerId && ctx.userId === ctx.ownerId && !ctx.roles.includes("admin")) {
      return { ok: false, reason: "Không được tự duyệt biên bản do chính mình soạn" };
    }
  }
  if (action === "thu_hoi") {
    if (!hasAnyRole(ctx.roles, VAI_TRO_THU_HOI)) {
      return { ok: false, reason: "Chỉ quản trị viên được thu hồi biên bản đã duyệt" };
    }
  }
  return { ok: true, nextState: next };
}

/** Sinh hash chữ ký (SHA-256, hex) từ dữ liệu ký. Dùng Web Crypto. */
export async function signHash(payload: {
  userId: string;
  entityId: string;
  state: DuyetKyState;
  timestamp: string;
}): Promise<string> {
  const s = `${payload.userId}|${payload.entityId}|${payload.state}|${payload.timestamp}`;
  const bytes = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Nhãn tiếng Việt cho trạng thái duyệt. */
export function labelDuyetKy(state: DuyetKyState | string | null | undefined): string {
  switch (state) {
    case "nhap":
      return "Nháp";
    case "cho_duyet":
      return "Chờ duyệt";
    case "da_duyet":
      return "Đã duyệt";
    case "tu_choi":
      return "Bị từ chối";
    default:
      return String(state ?? "—");
  }
}
