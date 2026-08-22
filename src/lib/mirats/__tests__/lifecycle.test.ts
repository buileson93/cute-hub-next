import { describe, it, expect } from "vitest";
import {
  healthScore,
  tuoiThoConLai,
  namThayThe,
  phanTramTuoiTho,
  tuoiThietBiNam,
} from "../lifecycle";

const TODAY = new Date("2026-07-14T00:00:00Z");

describe("lifecycle — tuổi & tỷ lệ", () => {
  it("tuoiThietBiNam ưu tiên nam_khai_thac; null nếu thiếu", () => {
    expect(tuoiThietBiNam(2010, 2020, TODAY)).toBe(6);
    expect(tuoiThietBiNam(2010, null, TODAY)).toBe(16);
    expect(tuoiThietBiNam(null, null, TODAY)).toBeNull();
    expect(tuoiThietBiNam(null, 2030, TODAY)).toBe(0); // future → clamp
  });

  it("phanTramTuoiTho trả null khi thiếu tuoiThoThietKe hoặc năm gốc", () => {
    expect(
      phanTramTuoiTho({ namSanXuat: 2020, namKhaiThac: 2020, tuoiThoThietKe: null }, TODAY),
    ).toBeNull();
    expect(
      phanTramTuoiTho({ namSanXuat: null, namKhaiThac: null, tuoiThoThietKe: 10 }, TODAY),
    ).toBeNull();
    expect(
      phanTramTuoiTho({ namSanXuat: 2020, namKhaiThac: 2020, tuoiThoThietKe: 10 }, TODAY),
    ).toBe(60);
    expect(
      phanTramTuoiTho({ namSanXuat: 2000, namKhaiThac: 2000, tuoiThoThietKe: 10 }, TODAY),
    ).toBe(100);
  });
});

describe("lifecycle — tuoiThoConLai / namThayThe", () => {
  it("null khi thiếu dữ liệu, không phải 0", () => {
    expect(tuoiThoConLai(null, 10, TODAY)).toBeNull();
    expect(tuoiThoConLai(2020, null, TODAY)).toBeNull();
    expect(namThayThe(null, 10)).toBeNull();
    expect(namThayThe(2020, null)).toBeNull();
  });
  it("tính đúng số năm còn lại và năm thay thế", () => {
    expect(tuoiThoConLai(2020, 10, TODAY)).toBe(4);
    expect(tuoiThoConLai(2010, 10, TODAY)).toBe(0); // hết
    expect(namThayThe(2020, 10)).toBe(2030);
  });
});

describe("lifecycle — healthScore", () => {
  it("tài sản mới, không sự cố → A", () => {
    const r = healthScore(
      { namSanXuat: 2025, namKhaiThac: 2025, soSuCo: 0, tuoiThoThietKe: 10 },
      TODAY,
    );
    expect(r.loai).toBe("A");
    expect(r.score).toBeGreaterThanOrEqual(80);
  });
  it("tài sản cũ hết vòng đời → D", () => {
    const r = healthScore(
      { namSanXuat: 2000, namKhaiThac: 2000, soSuCo: 5, tuoiThoThietKe: 10 },
      TODAY,
    );
    expect(r.loai).toBe("D");
  });
  it("thiếu tuoiThoThietKe không làm điểm về 0", () => {
    const r = healthScore(
      { namSanXuat: null, namKhaiThac: null, soSuCo: 0, tuoiThoThietKe: null },
      TODAY,
    );
    expect(r.score).toBeGreaterThan(0);
  });
});
