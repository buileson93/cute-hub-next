import { describe, it, expect } from "vitest";
import { chuanHoaTruyVan, chuanHoaTho, boDauTiengViet } from "@/lib/mirats/search/chuan-hoa";

describe("chuanHoaTruyVan (Task 46)", () => {
  it("bỏ dấu tiếng Việt", () => {
    expect(boDauTiengViet("sự cố")).toBe("su co");
    expect(boDauTiengViet("Đường bay")).toBe("Duong bay");
    expect(chuanHoaTho("Sự Cố")).toBe("su co");
  });

  it("'su co' khớp 'sự cố' qua prefix tsquery", () => {
    // Cả hai truy vấn đều chuẩn hoá về cùng một dạng prefix
    expect(chuanHoaTruyVan("su co")).toBe("su:* & co:*");
    expect(chuanHoaTruyVan("sự cố")).toBe("su:* & co:*");
  });

  it("hỗ trợ prefix cho token đơn", () => {
    expect(chuanHoaTruyVan("thie")).toBe("thie:*");
    expect(chuanHoaTruyVan("THIẾT")).toBe("thiet:*");
  });

  it("bỏ ký tự nguy hiểm (SQL/tsquery injection)", () => {
    expect(chuanHoaTruyVan("'; DROP TABLE users --")).toBe("drop:* & table:* & users:*");
    expect(chuanHoaTruyVan("a & b | c ! d")).toBe("a:* & b:* & c:* & d:*");
    expect(chuanHoaTruyVan("<script>alert(1)</script>")).toBe("script:* & alert:* & 1:* & script:*");
  });

  it("truy vấn rỗng hoặc chỉ ký tự lạ → chuỗi rỗng", () => {
    expect(chuanHoaTruyVan("")).toBe("");
    expect(chuanHoaTruyVan("   ")).toBe("");
    expect(chuanHoaTruyVan("!@#$%^&*()")).toBe("");
  });

  it("giữ số và mã (ma_thiet_bi)", () => {
    expect(chuanHoaTruyVan("TB_1A2B3C4D")).toBe("tb:* & 1a2b3c4d:*");
    expect(chuanHoaTruyVan("PL01")).toBe("pl01:*");
  });
});
