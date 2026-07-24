/**
 * Task 43 — Logic quản trị người dùng/vai trò (pure, thuần logic).
 *
 * Nguyên tắc:
 *  - Chỉ admin được gán/tháo vai trò và kích hoạt/khoá user.
 *  - Không cho phép tự hạ quyền admin CUỐI CÙNG của hệ thống (chống lockout).
 *  - Không cho phép tự khoá chính mình nếu đang là admin cuối cùng.
 *  - Không cho phép admin tự tháo role "admin" của chính mình nếu là admin cuối.
 */

export type AppRole =
  | "admin"
  | "phong_kt"
  | "phu_trach_dv"
  | "ktv"
  | "quan_ly_du_an"
  | "to_truong"
  | "readonly";

export const APP_ROLES: readonly AppRole[] = [
  "admin",
  "phong_kt",
  "phu_trach_dv",
  "ktv",
  "quan_ly_du_an",
  "to_truong",
  "readonly",
] as const;

export type ActorContext = {
  /** id của người thực hiện */
  actorId: string;
  /** actor có phải admin không */
  actorIsAdmin: boolean;
};

export type UserRoleSnapshot = {
  userId: string;
  roles: AppRole[];
  active: boolean;
};

export type AssignRoleInput = {
  actor: ActorContext;
  target: UserRoleSnapshot;
  role: AppRole;
  /** danh sách toàn bộ user (để đếm admin còn lại) */
  allUsers: UserRoleSnapshot[];
};

export type RoleActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

const ERR = (code: string, message: string): RoleActionResult => ({
  ok: false,
  code,
  message,
});

function countActiveAdmins(users: UserRoleSnapshot[]): number {
  return users.filter((u) => u.active && u.roles.includes("admin")).length;
}

/** Đếm admin còn lại NẾU áp dụng thay đổi mới với `target`. */
function countActiveAdminsAfter(
  users: UserRoleSnapshot[],
  targetAfter: UserRoleSnapshot
): number {
  const merged = users.map((u) => (u.userId === targetAfter.userId ? targetAfter : u));
  // Nếu target chưa nằm trong list (user mới) thì thêm vào
  if (!merged.some((u) => u.userId === targetAfter.userId)) merged.push(targetAfter);
  return countActiveAdmins(merged);
}

export function isLastActiveAdmin(
  userId: string,
  users: UserRoleSnapshot[]
): boolean {
  const admins = users.filter((u) => u.active && u.roles.includes("admin"));
  return admins.length === 1 && admins[0]?.userId === userId;
}

/** Có được gán thêm 1 vai trò cho target không. */
export function canAssignRole(input: AssignRoleInput): RoleActionResult {
  if (!input.actor.actorIsAdmin) {
    return ERR("FORBIDDEN", "Chỉ admin được gán vai trò");
  }
  if (!APP_ROLES.includes(input.role)) {
    return ERR("INVALID_ROLE", `Vai trò không hợp lệ: ${input.role}`);
  }
  return { ok: true };
}

/** Có được tháo 1 vai trò khỏi target không. */
export function canRevokeRole(input: AssignRoleInput): RoleActionResult {
  if (!input.actor.actorIsAdmin) {
    return ERR("FORBIDDEN", "Chỉ admin được tháo vai trò");
  }
  if (input.role === "admin") {
    // Nếu target đang là admin cuối → không cho tháo
    const nextRoles = input.target.roles.filter((r) => r !== "admin");
    const remaining = countActiveAdminsAfter(input.allUsers, {
      ...input.target,
      roles: nextRoles,
    });
    if (remaining < 1) {
      return ERR(
        "LAST_ADMIN",
        "Không thể tháo vai trò admin cuối cùng của hệ thống"
      );
    }
    if (
      input.actor.actorId === input.target.userId &&
      isLastActiveAdmin(input.target.userId, input.allUsers)
    ) {
      return ERR("SELF_DEMOTE_LAST_ADMIN", "Bạn không thể tự hạ quyền admin cuối cùng");
    }
  }
  return { ok: true };
}

/** Có được đổi trạng thái active (khoá/mở khoá) của target không. */
export function canSetActive(
  actor: ActorContext,
  target: UserRoleSnapshot,
  nextActive: boolean,
  allUsers: UserRoleSnapshot[]
): RoleActionResult {
  if (!actor.actorIsAdmin) {
    return ERR("FORBIDDEN", "Chỉ admin được đổi trạng thái tài khoản");
  }
  if (nextActive === target.active) {
    return ERR("NOOP", "Trạng thái không đổi");
  }
  if (!nextActive) {
    // Khoá — kiểm tra admin cuối
    const remaining = countActiveAdminsAfter(allUsers, {
      ...target,
      active: false,
    });
    if (target.roles.includes("admin") && remaining < 1) {
      return ERR("LAST_ADMIN", "Không thể khoá admin cuối cùng của hệ thống");
    }
    if (
      actor.actorId === target.userId &&
      isLastActiveAdmin(target.userId, allUsers)
    ) {
      return ERR("SELF_LOCK_LAST_ADMIN", "Bạn không thể tự khoá admin cuối cùng");
    }
  }
  return { ok: true };
}

/** Áp dụng gán vai trò (thuần) — trả về snapshot mới. */
export function applyAssignRole(
  target: UserRoleSnapshot,
  role: AppRole
): UserRoleSnapshot {
  if (target.roles.includes(role)) return target;
  return { ...target, roles: [...target.roles, role] };
}

/** Áp dụng tháo vai trò (thuần) — trả về snapshot mới. */
export function applyRevokeRole(
  target: UserRoleSnapshot,
  role: AppRole
): UserRoleSnapshot {
  return { ...target, roles: target.roles.filter((r) => r !== role) };
}
