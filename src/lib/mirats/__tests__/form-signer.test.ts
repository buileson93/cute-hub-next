// Test THUẦN cho chữ ký nhiều vai trò: Người thực hiện & Phụ trách/Giám sát
// theo đúng QUYỀN và THỨ TỰ, kèm fallback signed_by/signed_at cũ.
import { describe, it, expect } from "vitest";
import {
  canSignAs,
  nextSignerRole,
  validateSignAttempt,
  sortSigners,
  isFullySigned,
  resolveSigners,
  SIGNER_ROLE_ORDER,
  type SignerRecord,
} from "../form-signer";
import type { AppRole } from "@/hooks/use-session";

const rec = (
  p: Partial<SignerRecord> & { signer_role: SignerRecord["signer_role"] },
): SignerRecord => ({
  signer_role: p.signer_role,
  signed_by: p.signed_by ?? "u",
  signed_at: p.signed_at ?? "2026-01-01T00:00:00Z",
  ho_ten: p.ho_ten ?? null,
});

describe("canSignAs — đúng quyền", () => {
  it("ktv ký được Người thực hiện, KHÔNG ký được Phụ trách", () => {
    expect(canSignAs("nguoi_thuc_hien", ["ktv"])).toBe(true);
    expect(canSignAs("phu_trach", ["ktv"])).toBe(false);
  });
  it("to_truong ký được cả hai vai trò", () => {
    expect(canSignAs("nguoi_thuc_hien", ["to_truong"])).toBe(true);
    expect(canSignAs("phu_trach", ["to_truong"])).toBe(true);
  });
  it("phu_trach_dv ký Phụ trách, KHÔNG ký Người thực hiện", () => {
    expect(canSignAs("phu_trach", ["phu_trach_dv"])).toBe(true);
    expect(canSignAs("nguoi_thuc_hien", ["phu_trach_dv"])).toBe(false);
  });
  it("readonly / rỗng không ký được gì", () => {
    expect(canSignAs("nguoi_thuc_hien", ["readonly"])).toBe(false);
    expect(canSignAs("phu_trach", [] as AppRole[])).toBe(false);
    expect(canSignAs("phu_trach", null)).toBe(false);
  });
});

describe("nextSignerRole — thứ tự", () => {
  it("chưa ai ký → Người thực hiện", () => {
    expect(nextSignerRole([])).toBe("nguoi_thuc_hien");
  });
  it("đã có Người thực hiện → Phụ trách", () => {
    expect(nextSignerRole([rec({ signer_role: "nguoi_thuc_hien" })])).toBe("phu_trach");
  });
  it("đủ hai vai trò → null", () => {
    expect(
      nextSignerRole([rec({ signer_role: "nguoi_thuc_hien" }), rec({ signer_role: "phu_trach" })]),
    ).toBeNull();
  });
});

describe("validateSignAttempt", () => {
  it("Phụ trách KHÔNG được ký trước Người thực hiện", () => {
    const err = validateSignAttempt({
      signerRole: "phu_trach",
      userId: "boss",
      appRoles: ["to_truong"],
      existing: [],
    });
    expect(err).toMatch(/ký trước/);
  });

  it("Người thực hiện ký hợp lệ khi chưa ai ký", () => {
    expect(
      validateSignAttempt({
        signerRole: "nguoi_thuc_hien",
        userId: "tech",
        appRoles: ["ktv"],
        existing: [],
      }),
    ).toBeNull();
  });

  it("Phụ trách ký hợp lệ SAU Người thực hiện (người khác)", () => {
    expect(
      validateSignAttempt({
        signerRole: "phu_trach",
        userId: "boss",
        appRoles: ["phu_trach_dv"],
        existing: [rec({ signer_role: "nguoi_thuc_hien", signed_by: "tech" })],
      }),
    ).toBeNull();
  });

  it("một người KHÔNG ký cả hai vai trò (tách vai)", () => {
    const err = validateSignAttempt({
      signerRole: "phu_trach",
      userId: "tech",
      appRoles: ["to_truong"],
      existing: [rec({ signer_role: "nguoi_thuc_hien", signed_by: "tech" })],
    });
    expect(err).toMatch(/nhiều vai trò/);
  });

  it("không ký trùng vai trò", () => {
    const err = validateSignAttempt({
      signerRole: "nguoi_thuc_hien",
      userId: "tech2",
      appRoles: ["ktv"],
      existing: [rec({ signer_role: "nguoi_thuc_hien", signed_by: "tech" })],
    });
    expect(err).toMatch(/đã được ký/);
  });

  it("thiếu quyền → lỗi quyền", () => {
    const err = validateSignAttempt({
      signerRole: "phu_trach",
      userId: "x",
      appRoles: ["ktv"],
      existing: [rec({ signer_role: "nguoi_thuc_hien", signed_by: "tech" })],
    });
    expect(err).toMatch(/không có quyền/i);
  });
});

describe("sortSigners & isFullySigned", () => {
  it("sắp theo thứ tự vai trò", () => {
    const out = sortSigners([
      rec({ signer_role: "phu_trach" }),
      rec({ signer_role: "nguoi_thuc_hien" }),
    ]);
    expect(out.map((s) => s.signer_role)).toEqual(["nguoi_thuc_hien", "phu_trach"]);
    expect(SIGNER_ROLE_ORDER.nguoi_thuc_hien).toBeLessThan(SIGNER_ROLE_ORDER.phu_trach);
  });
  it("đủ chữ ký khi có cả hai", () => {
    expect(
      isFullySigned([rec({ signer_role: "nguoi_thuc_hien" }), rec({ signer_role: "phu_trach" })]),
    ).toBe(true);
    expect(isFullySigned([rec({ signer_role: "nguoi_thuc_hien" })])).toBe(false);
  });
});

describe("resolveSigners — fallback signed_by/signed_at", () => {
  it("dùng bản ghi signer khi có (bỏ qua legacy)", () => {
    const out = resolveSigners([rec({ signer_role: "nguoi_thuc_hien", signed_by: "tech" })], {
      signed_by: "old",
      signed_at: "2020-01-01T00:00:00Z",
    });
    expect(out).toHaveLength(1);
    expect(out[0].signed_by).toBe("tech");
  });
  it("fallback legacy thành Phụ trách khi chưa có signer", () => {
    const out = resolveSigners([], { signed_by: "old", signed_at: "2020-01-01T00:00:00Z" });
    expect(out).toHaveLength(1);
    expect(out[0].signer_role).toBe("phu_trach");
    expect(out[0].signed_by).toBe("old");
  });
  it("không có gì → rỗng", () => {
    expect(resolveSigners([], { signed_by: null, signed_at: null })).toEqual([]);
    expect(resolveSigners(null, null)).toEqual([]);
  });
});
