import { describe, expect, it } from "vitest";
import {
  fmtVND,
  fmtSo,
  fmtNgay,
  fmtNgayGio,
  fmtDowntime,
  KHONG_CO,
} from "../format";

describe("format.ts", () => {
  it("null/undefined/NaN → em-dash", () => {
    expect(fmtVND(null)).toBe(KHONG_CO);
    expect(fmtVND(undefined)).toBe(KHONG_CO);
    expect(fmtVND(Number.NaN)).toBe(KHONG_CO);
    expect(fmtSo(null)).toBe(KHONG_CO);
    expect(fmtNgay(null)).toBe(KHONG_CO);
    expect(fmtNgay("")).toBe(KHONG_CO);
    expect(fmtNgayGio(null)).toBe(KHONG_CO);
    expect(fmtDowntime(null)).toBe(KHONG_CO);
  });

  it("fmtVND — nhóm nghìn / triệu / tỷ", () => {
    expect(fmtVND(1234)).toBe("1.234");
    expect(fmtVND(1234567)).toBe("1.2 triệu");
    expect(fmtVND(2500000000)).toBe("2.50 tỷ");
    expect(fmtVND(0)).toBe("0");
  });

  it("fmtSo — nhóm nghìn", () => {
    expect(fmtSo(1234567)).toBe("1.234.567");
  });

  it("fmtNgay — dd/MM/yyyy", () => {
    expect(fmtNgay("2026-07-14")).toBe("14/07/2026");
    expect(fmtNgay(new Date(2026, 0, 5))).toBe("05/01/2026");
    expect(fmtNgay("not-a-date")).toBe(KHONG_CO);
  });

  it("fmtNgayGio — dd/MM/yyyy HH:mm", () => {
    const d = new Date(2026, 6, 14, 9, 5);
    expect(fmtNgayGio(d)).toBe("14/07/2026 09:05");
  });

  it("fmtDowntime — phút → mô tả", () => {
    expect(fmtDowntime(0)).toBe("0 phút");
    expect(fmtDowntime(45)).toBe("45 phút");
    expect(fmtDowntime(60)).toBe("1 giờ");
    expect(fmtDowntime(75)).toBe("1 giờ 15 phút");
    expect(fmtDowntime(1440)).toBe("1 ngày");
    expect(fmtDowntime(1500)).toBe("1 ngày 1 giờ");
  });
});
