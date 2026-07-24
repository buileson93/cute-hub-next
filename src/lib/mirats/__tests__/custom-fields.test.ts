import { describe, it, expect } from "vitest";
import {
  validateAttrs,
  renderAttrs,
  locTheoEntity,
  type DinhNghiaTruong,
} from "../custom-fields/registry";

const defs: DinhNghiaTruong[] = [
  { key: "so_seri_phu", nhan: "Số seri phụ", loai: "text", apDungCho: "thiet_bi" },
  { key: "cong_suat", nhan: "Công suất (W)", loai: "so", batBuoc: true, min: 0, max: 10000, apDungCho: "thiet_bi" },
  { key: "ngay_kich_hoat", nhan: "Ngày kích hoạt", loai: "ngay", apDungCho: "thiet_bi" },
  { key: "chuan", nhan: "Chuẩn", loai: "chon", luaChon: ["ICAO", "ITU", "IEC"], apDungCho: "thiet_bi" },
  { key: "co_pin_du_phong", nhan: "Có pin dự phòng", loai: "checkbox", apDungCho: "thiet_bi" },
  { key: "so_giay_phep", nhan: "Số GP", loai: "text", apDungCho: "he_thong" },
];

describe("validateAttrs", () => {
  it("thiếu trường bắt buộc → lỗi", () => {
    const r = validateAttrs(defs, {});
    expect(r.hopLe).toBe(false);
    expect(r.loi.some((m) => m.includes("Công suất"))).toBe(true);
  });

  it("đủ trường bắt buộc, các trường khác trống → hợp lệ", () => {
    const r = validateAttrs(defs, { cong_suat: 500 });
    expect(r.hopLe).toBe(true);
    expect(r.loi).toEqual([]);
  });

  it("sai kiểu số → lỗi", () => {
    const r = validateAttrs(defs, { cong_suat: "500" });
    expect(r.hopLe).toBe(false);
    expect(r.loi.some((m) => m.includes("phải là số"))).toBe(true);
  });

  it("số ngoài min/max → lỗi", () => {
    const r1 = validateAttrs(defs, { cong_suat: -1 });
    expect(r1.hopLe).toBe(false);
    const r2 = validateAttrs(defs, { cong_suat: 99999 });
    expect(r2.hopLe).toBe(false);
  });

  it("ngày sai định dạng → lỗi", () => {
    const r = validateAttrs(defs, { cong_suat: 1, ngay_kich_hoat: "01/02/2025" });
    expect(r.hopLe).toBe(false);
    expect(r.loi.some((m) => m.includes("Ngày kích hoạt"))).toBe(true);
  });

  it("checkbox sai kiểu → lỗi", () => {
    const r = validateAttrs(defs, { cong_suat: 1, co_pin_du_phong: "yes" });
    expect(r.hopLe).toBe(false);
  });

  it("chon ngoài luaChon → lỗi", () => {
    const r = validateAttrs(defs, { cong_suat: 1, chuan: "XYZ" });
    expect(r.hopLe).toBe(false);
    expect(r.loi.some((m) => m.includes("không nằm trong"))).toBe(true);
  });

  it("chon trong luaChon → OK", () => {
    const r = validateAttrs(defs, { cong_suat: 1, chuan: "ICAO" });
    expect(r.hopLe).toBe(true);
  });

  it("trường lạ ngoài định nghĩa → lỗi", () => {
    const r = validateAttrs(defs, { cong_suat: 1, khoa_la: "x" });
    expect(r.hopLe).toBe(false);
    expect(r.loi.some((m) => m.includes("Trường lạ"))).toBe(true);
  });

  it("giá trị empty string được coi như thiếu (không lỗi kiểu)", () => {
    const r = validateAttrs(defs, { cong_suat: 1, so_seri_phu: "" });
    expect(r.hopLe).toBe(true);
  });
});

describe("renderAttrs", () => {
  it("format giá trị hiển thị theo loại", () => {
    const rows = renderAttrs(defs, { cong_suat: 500, co_pin_du_phong: true });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.giaTri]));
    expect(byKey.cong_suat).toBe("500");
    expect(byKey.co_pin_du_phong).toBe("Có");
    expect(byKey.so_seri_phu).toBe("—");
  });
});

describe("locTheoEntity", () => {
  it("chỉ trả về trường của entity yêu cầu", () => {
    const ht = locTheoEntity(defs, "he_thong");
    expect(ht.map((d) => d.key)).toEqual(["so_giay_phep"]);
  });
});
