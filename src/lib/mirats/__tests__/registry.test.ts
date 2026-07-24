import { describe, it, expect } from "vitest";
import {
  parseFieldSpec,
  parseFieldSpecs,
  describeDynamicFields,
  isValidFieldKind,
  FIELD_KINDS,
  type FieldSpec,
} from "../registry";

describe("registry — parse FieldSpec (mở rộng thuộc tính mới)", () => {
  it("giữ nguyên FieldKind hiện có", () => {
    for (const k of ["text", "number", "date", "select", "textarea"]) {
      expect(isValidFieldKind(k)).toBe(true);
      expect(FIELD_KINDS).toContain(k);
    }
    expect(isValidFieldKind("khong_ton_tai")).toBe(false);
  });

  it("parse các trường cơ bản của he_thong_truong", () => {
    const spec = parseFieldSpec({
      field_key: "cong_suat",
      nhan: "Công suất phát",
      kieu: "number",
      thu_tu: 2,
      tuy_chon: ["A", "B"],
    });
    expect(spec.field_key).toBe("cong_suat");
    expect(spec.nhan).toBe("Công suất phát");
    expect(spec.kieu).toBe("number");
    expect(spec.thu_tu).toBe(2);
    expect(spec.tuy_chon).toEqual(["A", "B"]);
  });

  it("parse bat_buoc (boolean, mặc định false)", () => {
    expect(parseFieldSpec({ field_key: "a", nhan: "A", bat_buoc: true }).bat_buoc).toBe(true);
    expect(parseFieldSpec({ field_key: "a", nhan: "A" }).bat_buoc).toBe(false);
    expect(parseFieldSpec({ field_key: "a", nhan: "A", bat_buoc: null }).bat_buoc).toBe(false);
  });

  it("parse rang_buoc (regex/min/max) từ jsonb", () => {
    const spec = parseFieldSpec({
      field_key: "tan_so",
      nhan: "Tần số",
      kieu: "number",
      rang_buoc: { min: 100, max: 200, regex: "^[0-9]+$" },
    });
    expect(spec.rang_buoc.min).toBe(100);
    expect(spec.rang_buoc.max).toBe(200);
    expect(spec.rang_buoc.regex).toBe("^[0-9]+$");
  });

  it("rang_buoc rỗng/không hợp lệ → object rỗng", () => {
    expect(parseFieldSpec({ field_key: "a", nhan: "A" }).rang_buoc).toEqual({});
    expect(parseFieldSpec({ field_key: "a", nhan: "A", rang_buoc: null }).rang_buoc).toEqual({});
    expect(parseFieldSpec({ field_key: "a", nhan: "A", rang_buoc: "xx" }).rang_buoc).toEqual({});
  });

  it("parse mac_dinh (jsonb, giữ nguyên giá trị)", () => {
    expect(parseFieldSpec({ field_key: "a", nhan: "A", mac_dinh: "N/A" }).mac_dinh).toBe("N/A");
    expect(parseFieldSpec({ field_key: "a", nhan: "A", mac_dinh: 42 }).mac_dinh).toBe(42);
    expect(parseFieldSpec({ field_key: "a", nhan: "A" }).mac_dinh).toBeNull();
  });

  it("parse help_text và nhom_field", () => {
    const spec = parseFieldSpec({
      field_key: "a",
      nhan: "A",
      help_text: "Nhập giá trị đo được",
      nhom_field: "Thông số kỹ thuật",
    });
    expect(spec.help_text).toBe("Nhập giá trị đo được");
    expect(spec.nhom_field).toBe("Thông số kỹ thuật");
  });

  it("kiểu không hợp lệ → mặc định 'text'", () => {
    expect(parseFieldSpec({ field_key: "a", nhan: "A", kieu: "bogus" }).kieu).toBe("text");
  });

  it("parseFieldSpecs xử lý mảng và bỏ dòng thiếu field_key", () => {
    const specs: FieldSpec[] = parseFieldSpecs([
      { field_key: "a", nhan: "A" },
      { nhan: "Không có key" },
      { field_key: "b", nhan: "B", bat_buoc: true },
    ]);
    expect(specs.map((s) => s.field_key)).toEqual(["a", "b"]);
  });
});

describe("registry — describeDynamicFields (mô tả field động cho AI)", () => {
  const rows = [
    { field_key: "cong_suat", nhan: "Công suất phát", kieu: "number", bat_buoc: true, thu_tu: 1 },
    { field_key: "tan_so", nhan: "Tần số", kieu: "text", bat_buoc: false, thu_tu: 2 },
  ];

  it("liệt kê field động (nhãn VN, kieu, bat_buoc) của hệ thống mẫu", () => {
    const d = describeDynamicFields(rows);
    expect(d.so_luong).toBe(2);
    const f = d.fields.find((x) => x.field_key === "cong_suat");
    expect(f).toBeDefined();
    expect(f!.nhan).toBe("Công suất phát");
    expect(f!.kieu).toBe("number");
    expect(f!.bat_buoc).toBe(true);
  });

  it("nêu rõ giá trị nằm trong cột jsonb thuoc_tinh và cách truy vấn", () => {
    const d = describeDynamicFields(rows);
    expect(d.cot_jsonb).toBe("thuoc_tinh");
    expect(d.bang).toBe("thiet_bi");
    // mỗi field kèm biểu thức truy vấn thuoc_tinh->>'key'
    const f = d.fields.find((x) => x.field_key === "tan_so");
    expect(f!.truy_van).toBe("thuoc_tinh->>'tan_so'");
    expect(d.mau_truy_van).toContain("thuoc_tinh->>");
  });

  it("mảng rỗng/không hợp lệ → so_luong 0 nhưng vẫn có ghi chú truy vấn", () => {
    const d = describeDynamicFields(null);
    expect(d.so_luong).toBe(0);
    expect(d.fields).toEqual([]);
    expect(d.cot_jsonb).toBe("thuoc_tinh");
  });
});
