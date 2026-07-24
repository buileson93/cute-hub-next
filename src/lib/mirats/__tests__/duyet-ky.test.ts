import { describe, it, expect } from "vitest";
import {
  attemptAction,
  canEdit,
  isLocked,
  labelDuyetKy,
  signHash,
  DUYET_KY_STATES,
} from "@/lib/mirats/duyet-ky";

describe("duyet-ky — hằng số & nhãn", () => {
  it("có đủ 4 trạng thái", () => {
    expect(DUYET_KY_STATES).toEqual(["nhap", "cho_duyet", "da_duyet", "tu_choi"]);
  });
  it("labelDuyetKy đúng", () => {
    expect(labelDuyetKy("nhap")).toBe("Nháp");
    expect(labelDuyetKy("da_duyet")).toBe("Đã duyệt");
    expect(labelDuyetKy("cho_duyet")).toBe("Chờ duyệt");
    expect(labelDuyetKy("tu_choi")).toBe("Bị từ chối");
  });
  it("isLocked chỉ true khi da_duyet", () => {
    expect(isLocked("da_duyet")).toBe(true);
    expect(isLocked("nhap")).toBe(false);
    expect(isLocked("cho_duyet")).toBe(false);
  });
});

describe("attemptAction — luồng chính", () => {
  it("owner submit nhap → cho_duyet", () => {
    const r = attemptAction(
      { currentState: "nhap", roles: ["ktv"], userId: "u1", ownerId: "u1" },
      "submit",
    );
    expect(r.ok).toBe(true);
    expect(r.nextState).toBe("cho_duyet");
  });

  it("phong_kt duyệt cho_duyet → da_duyet", () => {
    const r = attemptAction(
      { currentState: "cho_duyet", roles: ["phong_kt"], userId: "u2", ownerId: "u1" },
      "duyet",
    );
    expect(r.ok).toBe(true);
    expect(r.nextState).toBe("da_duyet");
  });

  it("tu_choi cho_duyet → tu_choi", () => {
    const r = attemptAction(
      { currentState: "cho_duyet", roles: ["to_truong"], userId: "u2", ownerId: "u1" },
      "tu_choi",
    );
    expect(r.ok).toBe(true);
    expect(r.nextState).toBe("tu_choi");
  });

  it("tu_choi → resubmit → cho_duyet", () => {
    const r = attemptAction(
      { currentState: "tu_choi", roles: ["ktv"], userId: "u1", ownerId: "u1" },
      "submit",
    );
    expect(r.ok).toBe(true);
    expect(r.nextState).toBe("cho_duyet");
  });
});

describe("attemptAction — quyền hạn", () => {
  it("người ngoài không được submit", () => {
    const r = attemptAction(
      { currentState: "nhap", roles: ["ktv"], userId: "uX", ownerId: "u1" },
      "submit",
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/tạo|quản trị/i);
  });

  it("ktv không có quyền duyệt", () => {
    const r = attemptAction(
      { currentState: "cho_duyet", roles: ["ktv"], userId: "u2", ownerId: "u1" },
      "duyet",
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/quyền duyệt/i);
  });

  it("readonly không có quyền duyệt", () => {
    const r = attemptAction(
      { currentState: "cho_duyet", roles: ["readonly"], userId: "u2", ownerId: "u1" },
      "duyet",
    );
    expect(r.ok).toBe(false);
  });

  it("không tự duyệt biên bản của chính mình (trừ admin)", () => {
    const r = attemptAction(
      { currentState: "cho_duyet", roles: ["phong_kt"], userId: "u1", ownerId: "u1" },
      "duyet",
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/chính mình/i);
  });

  it("admin được phép tự duyệt (bypass four-eye)", () => {
    const r = attemptAction(
      { currentState: "cho_duyet", roles: ["admin"], userId: "u1", ownerId: "u1" },
      "duyet",
    );
    expect(r.ok).toBe(true);
  });

  it("chỉ admin được thu_hoi từ da_duyet", () => {
    const bad = attemptAction(
      { currentState: "da_duyet", roles: ["phong_kt"], userId: "u2" },
      "thu_hoi",
    );
    expect(bad.ok).toBe(false);
    const ok = attemptAction(
      { currentState: "da_duyet", roles: ["admin"], userId: "u2" },
      "thu_hoi",
    );
    expect(ok.ok).toBe(true);
    expect(ok.nextState).toBe("nhap");
  });
});

describe("attemptAction — chuyển đổi không hợp lệ", () => {
  it("không duyệt từ nhap", () => {
    const r = attemptAction(
      { currentState: "nhap", roles: ["phong_kt"], userId: "u2", ownerId: "u1" },
      "duyet",
    );
    expect(r.ok).toBe(false);
  });
  it("không submit từ da_duyet", () => {
    const r = attemptAction(
      { currentState: "da_duyet", roles: ["ktv"], userId: "u1", ownerId: "u1" },
      "submit",
    );
    expect(r.ok).toBe(false);
  });
});

describe("canEdit — khoá sau khi duyệt", () => {
  it("da_duyet khoá toàn bộ", () => {
    expect(
      canEdit({ currentState: "da_duyet", roles: ["admin"], userId: "u1", ownerId: "u1" }),
    ).toBe(false);
  });
  it("nhap: owner được sửa", () => {
    expect(
      canEdit({ currentState: "nhap", roles: ["ktv"], userId: "u1", ownerId: "u1" }),
    ).toBe(true);
  });
  it("nhap: người khác (ktv) không được sửa", () => {
    expect(
      canEdit({ currentState: "nhap", roles: ["ktv"], userId: "uX", ownerId: "u1" }),
    ).toBe(false);
  });
  it("cho_duyet: chỉ vai trò duyệt được sửa", () => {
    expect(
      canEdit({ currentState: "cho_duyet", roles: ["ktv"], userId: "u1", ownerId: "u1" }),
    ).toBe(false);
    expect(
      canEdit({ currentState: "cho_duyet", roles: ["phong_kt"], userId: "u2", ownerId: "u1" }),
    ).toBe(true);
  });
  it("tu_choi: owner sửa lại được", () => {
    expect(
      canEdit({ currentState: "tu_choi", roles: ["ktv"], userId: "u1", ownerId: "u1" }),
    ).toBe(true);
  });
});

describe("signHash — chữ ký điện tử", () => {
  it("cùng payload → cùng hash", async () => {
    const p = { userId: "u1", entityId: "BB_1", state: "da_duyet" as const, timestamp: "2026-01-01T00:00:00Z" };
    const h1 = await signHash(p);
    const h2 = await signHash(p);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // SHA-256 hex
  });
  it("khác payload → khác hash", async () => {
    const h1 = await signHash({ userId: "u1", entityId: "BB_1", state: "da_duyet", timestamp: "2026-01-01T00:00:00Z" });
    const h2 = await signHash({ userId: "u2", entityId: "BB_1", state: "da_duyet", timestamp: "2026-01-01T00:00:00Z" });
    expect(h1).not.toBe(h2);
  });
});
