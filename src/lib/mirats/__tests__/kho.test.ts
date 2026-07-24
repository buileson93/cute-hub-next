import { describe, it, expect } from "vitest";
import {
  hieuUngGiaoDich,
  tinhTonKho,
  validateSoLuong,
  validateXuat,
  type LoaiGiaoDich,
} from "../kho";

// Bút toán tối giản để tính tồn (mô phỏng cột hieu_ung sinh ở CSDL).
function gd(loai: LoaiGiaoDich, soLuong: number) {
  return { loai, so_luong: soLuong };
}

describe("kho — hieuUngGiaoDich (dấu hiệu ứng theo loại)", () => {
  it("NHAP/CHUYEN_NHAP/DIEU_CHINH_TANG là cộng", () => {
    expect(hieuUngGiaoDich("NHAP", 10)).toBe(10);
    expect(hieuUngGiaoDich("CHUYEN_NHAP", 4)).toBe(4);
    expect(hieuUngGiaoDich("DIEU_CHINH_TANG", 2)).toBe(2);
  });
  it("XUAT/CHUYEN_XUAT/DIEU_CHINH_GIAM là trừ", () => {
    expect(hieuUngGiaoDich("XUAT", 3)).toBe(-3);
    expect(hieuUngGiaoDich("CHUYEN_XUAT", 5)).toBe(-5);
    expect(hieuUngGiaoDich("DIEU_CHINH_GIAM", 1)).toBe(-1);
  });
});

describe("kho — tinhTonKho (tồn = tổng hiệu ứng sổ cái)", () => {
  it("nhập 10, xuất 3 → còn 7", () => {
    expect(tinhTonKho([gd("NHAP", 10), gd("XUAT", 3)])).toBe(7);
  });
  it("sổ cái rỗng → 0", () => {
    expect(tinhTonKho([])).toBe(0);
  });
  it("chuyển kho: hai bút toán triệt tiêu tại tổng kho", () => {
    expect(tinhTonKho([gd("NHAP", 10), gd("CHUYEN_XUAT", 4), gd("CHUYEN_NHAP", 4)])).toBe(10);
  });
});

describe("kho — validateSoLuong (chặn số âm/0)", () => {
  it("số > 0 hợp lệ", () => {
    expect(validateSoLuong(1)).toBeNull();
  });
  it("0 bị từ chối", () => {
    expect(validateSoLuong(0)).toBeTruthy();
  });
  it("số âm bị từ chối", () => {
    expect(validateSoLuong(-2)).toBeTruthy();
  });
  it("NaN bị từ chối", () => {
    expect(validateSoLuong(Number.NaN)).toBeTruthy();
  });
});

describe("kho — validateXuat (chặn vượt tồn khi không cho phép âm)", () => {
  it("xuất trong mức tồn → hợp lệ", () => {
    expect(validateXuat(7, 3, false)).toBeNull();
  });
  it("vượt tồn và không cho phép âm → từ chối", () => {
    expect(validateXuat(2, 3, false)).toBeTruthy();
  });
  it("vượt tồn nhưng cho phép âm → hợp lệ", () => {
    expect(validateXuat(2, 3, true)).toBeNull();
  });
  it("số lượng <= 0 → từ chối luôn dù cho phép âm", () => {
    expect(validateXuat(100, 0, true)).toBeTruthy();
  });
});
