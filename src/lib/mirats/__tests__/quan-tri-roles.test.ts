import { describe, it, expect } from "vitest";
import {
  APP_ROLES,
  applyAssignRole,
  applyRevokeRole,
  canAssignRole,
  canRevokeRole,
  canSetActive,
  isLastActiveAdmin,
  type UserRoleSnapshot,
} from "@/lib/mirats/quan-tri/roles";

const admin: UserRoleSnapshot = { userId: "u-admin", roles: ["admin"], active: true };
const admin2: UserRoleSnapshot = { userId: "u-admin2", roles: ["admin"], active: true };
const ktv: UserRoleSnapshot = { userId: "u-ktv", roles: ["ktv"], active: true };

describe("quan-tri/roles — hằng số", () => {
  it("có đủ 7 vai trò", () => {
    expect(APP_ROLES).toHaveLength(7);
    expect(APP_ROLES).toContain("admin");
    expect(APP_ROLES).toContain("readonly");
  });
});

describe("canAssignRole", () => {
  it("chặn khi actor không phải admin", () => {
    const r = canAssignRole({
      actor: { actorId: "x", actorIsAdmin: false },
      target: ktv,
      role: "admin",
      allUsers: [admin, ktv],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("FORBIDDEN");
  });
  it("chặn vai trò không hợp lệ", () => {
    const r = canAssignRole({
      actor: { actorId: admin.userId, actorIsAdmin: true },
      target: ktv,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: "khong_ton_tai" as any,
      allUsers: [admin, ktv],
    });
    expect(r.ok).toBe(false);
  });
  it("cho phép admin gán vai trò hợp lệ", () => {
    const r = canAssignRole({
      actor: { actorId: admin.userId, actorIsAdmin: true },
      target: ktv,
      role: "phong_kt",
      allUsers: [admin, ktv],
    });
    expect(r.ok).toBe(true);
  });
});

describe("canRevokeRole — bảo vệ admin cuối", () => {
  it("chặn tháo admin của admin cuối cùng", () => {
    const r = canRevokeRole({
      actor: { actorId: admin.userId, actorIsAdmin: true },
      target: admin,
      role: "admin",
      allUsers: [admin, ktv],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toMatch(/LAST_ADMIN|SELF_DEMOTE/);
  });
  it("cho phép tháo admin khi còn admin khác", () => {
    const r = canRevokeRole({
      actor: { actorId: admin2.userId, actorIsAdmin: true },
      target: admin,
      role: "admin",
      allUsers: [admin, admin2, ktv],
    });
    expect(r.ok).toBe(true);
  });
  it("chặn tự-hạ-quyền của admin cuối", () => {
    const r = canRevokeRole({
      actor: { actorId: admin.userId, actorIsAdmin: true },
      target: admin,
      role: "admin",
      allUsers: [admin],
    });
    expect(r.ok).toBe(false);
  });
});

describe("canSetActive — chống khoá admin cuối", () => {
  it("chặn khoá admin cuối", () => {
    const r = canSetActive({ actorId: admin2.userId, actorIsAdmin: true }, admin, false, [
      admin,
      ktv,
    ]);
    expect(r.ok).toBe(false);
  });
  it("cho phép khoá admin khi còn admin khác active", () => {
    const r = canSetActive({ actorId: admin2.userId, actorIsAdmin: true }, admin, false, [
      admin,
      admin2,
    ]);
    expect(r.ok).toBe(true);
  });
  it("chặn tự khoá bản thân nếu là admin cuối", () => {
    const r = canSetActive({ actorId: admin.userId, actorIsAdmin: true }, admin, false, [admin]);
    expect(r.ok).toBe(false);
  });
  it("chặn khi actor không phải admin", () => {
    const r = canSetActive({ actorId: "x", actorIsAdmin: false }, ktv, false, [admin, ktv]);
    expect(r.ok).toBe(false);
  });
  it("noop khi trạng thái không đổi", () => {
    const r = canSetActive({ actorId: admin.userId, actorIsAdmin: true }, ktv, true, [admin, ktv]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("NOOP");
  });
});

describe("isLastActiveAdmin & apply helpers", () => {
  it("phát hiện admin cuối", () => {
    expect(isLastActiveAdmin(admin.userId, [admin, ktv])).toBe(true);
    expect(isLastActiveAdmin(admin.userId, [admin, admin2])).toBe(false);
  });
  it("applyAssignRole cộng dồn không trùng", () => {
    const r1 = applyAssignRole(ktv, "phong_kt");
    expect(r1.roles).toEqual(["ktv", "phong_kt"]);
    const r2 = applyAssignRole(r1, "phong_kt");
    expect(r2.roles).toEqual(["ktv", "phong_kt"]);
  });
  it("applyRevokeRole loại phần tử", () => {
    const r = applyRevokeRole({ ...admin, roles: ["admin", "ktv"] }, "admin");
    expect(r.roles).toEqual(["ktv"]);
  });
});
