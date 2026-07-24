import { describe, it, expect } from "vitest";
import {
  buildInitialValues,
  validateFieldValue,
  validateFields,
  serializeThuocTinh,
} from "../field-form";
import type { FieldSpec } from "../registry";

function spec(p: Partial<FieldSpec> & { field_key: string }): FieldSpec {
  return {
    field_key: p.field_key,
    nhan: p.nhan ?? p.field_key,
    kieu: p.kieu ?? "text",
    tuy_chon: p.tuy_chon ?? [],
    thu_tu: p.thu_tu ?? 0,
    bat_buoc: p.bat_buoc ?? false,
    rang_buoc: p.rang_buoc ?? {},
    mac_dinh: p.mac_dinh ?? null,
    help_text: p.help_text ?? null,
    nhom_field: p.nhom_field ?? null,
  };
}

describe("field-form — buildInitialValues (prefill mac_dinh)", () => {
  it("dùng giá trị hiện có trước, rồi tới mac_dinh", () => {
    const specs = [
      spec({ field_key: "a", mac_dinh: "def-a" }),
      spec({ field_key: "b", kieu: "number", mac_dinh: 5 }),
      spec({ field_key: "c" }),
    ];
    // Form là controlled → giá trị luôn ở dạng chuỗi.
    const v = buildInitialValues(specs, { a: "cu-a" });
    expect(v.a).toBe("cu-a");
    expect(v.b).toBe("5");
    expect(v.c).toBe("");
  });

  it("mac_dinh null → chuỗi rỗng", () => {
    const v = buildInitialValues([spec({ field_key: "x" })]);
    expect(v.x).toBe("");
  });
});

describe("field-form — validateFieldValue (bat_buoc + rang_buoc)", () => {
  it("bắt buộc mà rỗng → lỗi", () => {
    expect(validateFieldValue(spec({ field_key: "a", bat_buoc: true }), "")).toBeTruthy();
    expect(validateFieldValue(spec({ field_key: "a", bat_buoc: true }), null)).toBeTruthy();
    expect(validateFieldValue(spec({ field_key: "a", bat_buoc: true }), "x")).toBeNull();
  });

  it("không bắt buộc + rỗng → bỏ qua ràng buộc", () => {
    const s = spec({ field_key: "a", kieu: "number", rang_buoc: { min: 10 } });
    expect(validateFieldValue(s, "")).toBeNull();
  });

  it("số: kiểm min/max", () => {
    const s = spec({ field_key: "a", kieu: "number", rang_buoc: { min: 100, max: 200 } });
    expect(validateFieldValue(s, "50")).toBeTruthy();
    expect(validateFieldValue(s, "250")).toBeTruthy();
    expect(validateFieldValue(s, "150")).toBeNull();
    expect(validateFieldValue(s, "abc")).toBeTruthy();
  });

  it("chuỗi: kiểm regex", () => {
    const s = spec({ field_key: "a", kieu: "text", rang_buoc: { regex: "^[A-Z]{3}$" } });
    expect(validateFieldValue(s, "AB")).toBeTruthy();
    expect(validateFieldValue(s, "ABC")).toBeNull();
  });

  it("select: giá trị phải nằm trong tuy_chon", () => {
    const s = spec({ field_key: "a", kieu: "select", tuy_chon: ["Tốt", "Kém"] });
    expect(validateFieldValue(s, "Trung bình")).toBeTruthy();
    expect(validateFieldValue(s, "Tốt")).toBeNull();
  });
});

describe("field-form — validateFields", () => {
  it("trả về map lỗi theo field_key", () => {
    const specs = [
      spec({ field_key: "a", bat_buoc: true }),
      spec({ field_key: "b", kieu: "number", rang_buoc: { max: 10 } }),
    ];
    const errs = validateFields(specs, { a: "", b: "20" });
    expect(Object.keys(errs).sort()).toEqual(["a", "b"]);
  });

  it("không lỗi → object rỗng", () => {
    const specs = [spec({ field_key: "a", bat_buoc: true })];
    expect(validateFields(specs, { a: "ok" })).toEqual({});
  });
});

describe("field-form — serializeThuocTinh (đúng key & kiểu)", () => {
  it("số lưu dưới dạng number, chuỗi giữ nguyên", () => {
    const specs = [
      spec({ field_key: "cong_suat", kieu: "number" }),
      spec({ field_key: "ghi_chu", kieu: "text" }),
    ];
    const out = serializeThuocTinh(specs, { cong_suat: "150", ghi_chu: "hello" });
    expect(out.cong_suat).toBe(150);
    expect(out.ghi_chu).toBe("hello");
  });

  it("bỏ qua giá trị rỗng không bắt buộc (không ghi key)", () => {
    const specs = [spec({ field_key: "a" }), spec({ field_key: "b" })];
    const out = serializeThuocTinh(specs, { a: "x", b: "" });
    expect(out).toEqual({ a: "x" });
    expect("b" in out).toBe(false);
  });

  it("chỉ giữ key thuộc specs", () => {
    const specs = [spec({ field_key: "a" })];
    const out = serializeThuocTinh(specs, { a: "x", ngoai_le: "y" });
    expect(out).toEqual({ a: "x" });
  });
});
