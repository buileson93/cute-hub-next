import { describe, it, expect } from "vitest";
import { canWrite, isReadOnly } from "@/lib/mirats/quyen";

describe("quyen: ma trận canWrite khớp vai trò", () => {
  it("admin ghi được mọi miền", () => {
    for (const d of ["thiet_bi", "su_co", "van_de", "bao_tri", "kho", "giay_phep"] as const) {
      expect(canWrite(d, ["admin"])).toBe(true);
    }
  });

  it("phong_kt ghi được nghiệp vụ chính", () => {
    expect(canWrite("thiet_bi", ["phong_kt"])).toBe(true);
    expect(canWrite("su_co", ["phong_kt"])).toBe(true);
    expect(canWrite("van_de", ["phong_kt"])).toBe(true);
    expect(canWrite("don_vi", ["phong_kt"])).toBe(false); // chỉ admin
  });

  it("ktv chỉ ghi được các miền vận hành, không quản trị hệ thống", () => {
    expect(canWrite("su_co", ["ktv"])).toBe(true);
    expect(canWrite("hong_hoc", ["ktv"])).toBe(true);
    expect(canWrite("bao_tri", ["ktv"])).toBe(true);
    expect(canWrite("thiet_bi", ["ktv"])).toBe(false);
    expect(canWrite("van_de", ["ktv"])).toBe(false);
    expect(canWrite("giay_phep", ["ktv"])).toBe(false);
  });

  it("readonly / rỗng / null không ghi được gì", () => {
    expect(canWrite("su_co", ["readonly"])).toBe(false);
    expect(canWrite("su_co", [])).toBe(false);
    expect(canWrite("su_co", null)).toBe(false);
    expect(canWrite("su_co", undefined)).toBe(false);
  });

  it("isReadOnly = true khi không ghi được ở bất kỳ miền nào trong tập", () => {
    expect(isReadOnly(["su_co", "van_de"], ["readonly"])).toBe(true);
    expect(isReadOnly(["su_co", "van_de"], ["ktv"])).toBe(false);
    expect(isReadOnly(["thiet_bi"], ["ktv"])).toBe(true);
  });
});
