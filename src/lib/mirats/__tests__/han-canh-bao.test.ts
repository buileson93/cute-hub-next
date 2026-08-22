import { describe, it, expect } from "vitest";
import { NGUONG_CANH_BAO, DEFAULT_NGAY_SAP_HET_HAN, nguongCho } from "../han-canh-bao";

describe("han-canh-bao", () => {
  it("hằng số ngưỡng theo thứ tự tăng dần 30/60/90", () => {
    expect(NGUONG_CANH_BAO).toEqual([30, 60, 90]);
  });

  it("DEFAULT_NGAY_SAP_HET_HAN = 90 (khớp ngưỡng lớn nhất)", () => {
    expect(DEFAULT_NGAY_SAP_HET_HAN).toBe(90);
    expect(NGUONG_CANH_BAO).toContain(DEFAULT_NGAY_SAP_HET_HAN);
  });

  it("nguongCho: chọn ngưỡng nhỏ nhất ≥ số ngày còn lại", () => {
    expect(nguongCho(0)).toBe(30);
    expect(nguongCho(30)).toBe(30);
    expect(nguongCho(31)).toBe(60);
    expect(nguongCho(60)).toBe(60);
    expect(nguongCho(61)).toBe(90);
    expect(nguongCho(90)).toBe(90);
  });

  it("nguongCho: quá hạn (<0) hoặc ngoài 90 ngày → null", () => {
    expect(nguongCho(-1)).toBeNull();
    expect(nguongCho(91)).toBeNull();
    expect(nguongCho(365)).toBeNull();
  });

  it("nguongCho: giá trị không hợp lệ → null", () => {
    expect(nguongCho(Number.NaN)).toBeNull();
    expect(nguongCho(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
