import { describe, it, expect } from "vitest";
import { csvEscape, toCsv, csvFileName, parseNgay, trangThaiBaoHanh } from "../csv";

describe("csvEscape", () => {
  it("giữ nguyên chuỗi đơn giản và trả rỗng cho null/undefined", () => {
    expect(csvEscape("ABC")).toBe("ABC");
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
    expect(csvEscape(12)).toBe("12");
  });

  it("bọc nháy kép khi có dấu phẩy, nháy kép hoặc xuống dòng", () => {
    expect(csvEscape("A,B")).toBe('"A,B"');
    expect(csvEscape('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvEscape("dòng1\ndòng2")).toBe('"dòng1\ndòng2"');
  });
});

describe("toCsv", () => {
  it("ghép bảng đúng thứ tự cột với CRLF", () => {
    const csv = toCsv([
      ["MODEL", "SERIAL"],
      ["RX-9, v2", null],
    ]);
    expect(csv).toBe('MODEL,SERIAL\r\n"RX-9, v2",');
  });
});

describe("csvFileName", () => {
  it("gắn ngày theo định dạng YYYY-MM-DD", () => {
    expect(csvFileName("thanh-phan-tai-san", new Date(2026, 8, 1))).toBe(
      "thanh-phan-tai-san-2026-09-01.csv",
    );
  });
});

describe("parseNgay / trangThaiBaoHanh", () => {
  const now = new Date(2026, 8, 1);

  it("đọc được ISO và dd/MM/yyyy", () => {
    expect(parseNgay("2026-12-31")?.getFullYear()).toBe(2026);
    expect(parseNgay("31/12/2026")?.getMonth()).toBe(11);
    expect(parseNgay("")).toBeNull();
    expect(parseNgay(null)).toBeNull();
    expect(parseNgay("không rõ")).toBeNull();
  });

  it("phân loại đúng còn / sắp hết / hết bảo hành", () => {
    expect(trangThaiBaoHanh("2027-01-01", now)).toBe("Còn bảo hành");
    expect(trangThaiBaoHanh("2026-10-01", now)).toBe("Sắp hết bảo hành");
    expect(trangThaiBaoHanh("2026-01-01", now)).toBe("Hết bảo hành");
    expect(trangThaiBaoHanh("", now)).toBe("");
  });
});
