import { describe, it, expect } from "vitest";
import { BANG_MAU, mauTheoToken, mauMacDinhTheoNhom } from "../mau-sac";

describe("mau-sac", () => {
  it("BANG_MAU đủ ~12 màu và token không trùng", () => {
    expect(BANG_MAU.length).toBeGreaterThanOrEqual(12);
    const tokens = BANG_MAU.map((m) => m.token);
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("mỗi preset có ten và lop khác rỗng", () => {
    for (const m of BANG_MAU) {
      expect(m.ten.trim()).not.toBe("");
      expect(m.lop.trim()).not.toBe("");
    }
  });

  it("mauTheoToken(null|undefined|token lạ) → màu xám fallback", () => {
    expect(mauTheoToken(null).token).toBe("xam");
    expect(mauTheoToken(undefined).token).toBe("xam");
    expect(mauTheoToken("khong-ton-tai").token).toBe("xam");
  });

  it("mauTheoToken trả đúng preset khi token hợp lệ", () => {
    const m = mauTheoToken("lam");
    expect(m.token).toBe("lam");
    expect(m.lop).toContain("blue");
  });

  it("mauMacDinhTheoNhom trả token thuộc BANG_MAU", () => {
    const tokens = new Set(BANG_MAU.map((m) => m.token));
    for (const nhom of ["chuc_nang", "bang_tan", "khac"] as const) {
      expect(tokens.has(mauMacDinhTheoNhom(nhom))).toBe(true);
    }
  });
});
