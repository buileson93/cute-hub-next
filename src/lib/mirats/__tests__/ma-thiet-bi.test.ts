import { describe, it, expect } from "vitest";
import { genMaThietBi, nhanDienLoiTrungThietBi } from "../ma-thiet-bi";

describe("genMaThietBi", () => {
  it("theo đúng định dạng TB_XXXXXXXX (Crockford base32, không I/O/U/L)", () => {
    for (let i = 0; i < 200; i++) {
      const ma = genMaThietBi();
      expect(ma).toMatch(/^TB_[0-9A-HJKMNP-TV-Z]{8}$/);
      expect(ma).not.toMatch(/[IOUL]/);
    }
  });

  it("cho phép đổi prefix và độ dài", () => {
    expect(genMaThietBi("LK", 6)).toMatch(/^LK_[0-9A-HJKMNP-TV-Z]{6}$/);
  });

  it("gần như không trùng trong lô lớn", () => {
    const set = new Set<string>();
    for (let i = 0; i < 5000; i++) set.add(genMaThietBi());
    expect(set.size).toBeGreaterThan(4990); // cho phép rất ít va chạm ngẫu nhiên
  });
});

describe("nhanDienLoiTrungThietBi", () => {
  it("nhận diện trùng serial qua tên index uq_thiet_bi_serial", () => {
    const r = nhanDienLoiTrungThietBi({
      code: "23505",
      message: 'duplicate key value violates unique constraint "uq_thiet_bi_serial"',
    });
    expect(r?.truong).toBe("ma_serial");
  });

  it("nhận diện trùng mã tài sản", () => {
    const r = nhanDienLoiTrungThietBi({
      code: "23505",
      message: 'duplicate key value violates unique constraint "thiet_bi_ma_thiet_bi_key"',
    });
    expect(r?.truong).toBe("ma_thiet_bi");
  });

  it("không phải 23505 → null", () => {
    expect(nhanDienLoiTrungThietBi({ code: "23503", message: "fk" })).toBeNull();
    expect(nhanDienLoiTrungThietBi(null)).toBeNull();
    expect(nhanDienLoiTrungThietBi(new Error("boom"))).toBeNull();
  });

  it("23505 nhưng không rõ cột → truong=khac", () => {
    const r = nhanDienLoiTrungThietBi({ code: "23505", message: "duplicate key" });
    expect(r?.truong).toBe("khac");
  });
});
