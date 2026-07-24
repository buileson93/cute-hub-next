import { describe, it, expect } from "vitest";
import { buildXuatArgs } from "../kho-tieu-hao";

describe("buildXuatArgs", () => {
  const dong = { vat_tu_id: "v1", kho_id: "k1", so_luong: 3 };

  it("gắn đúng _vat_tu_id/_kho_id/_so_luong", () => {
    const a = buildXuatArgs(dong, { congViecId: "cv1" });
    expect(a).toMatchObject({ _vat_tu_id: "v1", _kho_id: "k1", _so_luong: 3, _cong_viec_id: "cv1" });
  });

  it("gắn đúng khoá liên kết sự cố", () => {
    const a = buildXuatArgs(dong, { suCoId: "sc1" });
    expect(a._su_co_id).toBe("sc1");
    expect(a._cong_viec_id).toBeUndefined();
    expect(a._hong_hoc_id).toBeUndefined();
  });

  it("gắn đúng khoá liên kết hỏng hóc", () => {
    const a = buildXuatArgs(dong, { hongHocId: "hh1" });
    expect(a._hong_hoc_id).toBe("hh1");
    expect(a._cong_viec_id).toBeUndefined();
    expect(a._su_co_id).toBeUndefined();
  });

  it("bỏ qua khoá không có giá trị và ghi_chu rỗng", () => {
    const a = buildXuatArgs({ ...dong, ghi_chu: "   " }, {});
    expect(a._cong_viec_id).toBeUndefined();
    expect(a._su_co_id).toBeUndefined();
    expect(a._hong_hoc_id).toBeUndefined();
    expect(a._ghi_chu).toBeUndefined();
  });

  it("giữ don_gia và ghi_chu khi hợp lệ", () => {
    const a = buildXuatArgs({ ...dong, don_gia: 12000, ghi_chu: " thay lọc " }, { congViecId: "cv1" });
    expect(a._don_gia).toBe(12000);
    expect(a._ghi_chu).toBe("thay lọc");
  });

  it("báo lỗi khi thiếu vat_tu_id / kho_id / so_luong <= 0", () => {
    expect(() => buildXuatArgs({ vat_tu_id: "", kho_id: "k1", so_luong: 1 }, {})).toThrow();
    expect(() => buildXuatArgs({ vat_tu_id: "v1", kho_id: "", so_luong: 1 }, {})).toThrow();
    expect(() => buildXuatArgs({ vat_tu_id: "v1", kho_id: "k1", so_luong: 0 }, {})).toThrow();
  });

  it("cho phép gắn cùng lúc nhiều nhánh (đa liên kết)", () => {
    const a = buildXuatArgs(dong, { congViecId: "cv1", hongHocId: "hh1" });
    expect(a._cong_viec_id).toBe("cv1");
    expect(a._hong_hoc_id).toBe("hh1");
  });
});
