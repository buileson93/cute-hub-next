import { describe, it, expect } from "vitest";
import {
  compileField,
  compileSchema,
  parseCompiledSchema,
  resolveSubmissionFields,
  type CompiledField,
  type CompiledSchema,
} from "../form-schema";

const cf = (over: Partial<CompiledField>): CompiledField => ({
  key: "k",
  label: "L",
  kind: "text",
  required: false,
  options: null,
  help_text: null,
  placeholder: null,
  position: 0,
  unit: null,
  tieu_chuan: null,
  min_value: null,
  max_value: null,
  col_span: 3,
  visible_if: null,
  columns: null,
  ratings: null,
  formula: null,
  nhom: null,
  required_if: null,
  constraint_formula: null,
  constraint_message: null,
  ...over,
});

describe("compileField", () => {
  it("chuẩn hoá dòng form_field với default", () => {
    const c = compileField({ key: "ghi_chu", label: "Ghi chú" }, 3);
    expect(c).toEqual(cf({ key: "ghi_chu", label: "Ghi chú", position: 3 }));
  });

  it("giữ options mảng và position rõ ràng", () => {
    const c = compileField({
      key: "tt",
      label: "Trạng thái",
      kind: "select",
      options: ["A", "B"],
      required: true,
      position: 1,
    });
    expect(c.options).toEqual(["A", "B"]);
    expect(c.required).toBe(true);
    expect(c.position).toBe(1);
  });
});

describe("compileSchema", () => {
  it("dựng snapshot đầy đủ và sắp theo position", () => {
    const schema = compileSchema(
      {
        id: "t1",
        code: "PL01",
        ten: "Bảo dưỡng UHF",
        version: 2,
        require_signature: true,
        thiet_bi_mode: "single",
      },
      [
        { key: "b", label: "B", position: 2 },
        { key: "a", label: "A", position: 1 },
      ],
    );
    expect(schema.template.version).toBe(2);
    expect(schema.template.require_signature).toBe(true);
    expect(schema.fields.map((f) => f.key)).toEqual(["a", "b"]);
  });
});

describe("parseCompiledSchema", () => {
  it("parse jsonb hợp lệ", () => {
    const raw = {
      template: { id: "t", code: "C", ten: "N", version: 3 },
      fields: [{ key: "x", label: "X" }],
    };
    const s = parseCompiledSchema(raw);
    expect(s?.template.version).toBe(3);
    expect(s?.fields[0].key).toBe("x");
  });
  it("trả null cho dữ liệu không hợp lệ", () => {
    expect(parseCompiledSchema(null)).toBeNull();
    expect(parseCompiledSchema({})).toBeNull();
    expect(parseCompiledSchema({ fields: "no" })).toBeNull();
  });
});

describe("resolveSubmissionFields — bảo vệ lịch sử phiếu cũ", () => {
  // Phiếu cũ đã lập với 2 field. Sau đó admin sửa mẫu.
  const snapshot: CompiledSchema = {
    template: {
      id: "t1",
      code: "PL01",
      ten: "Cũ",
      version: 1,
      require_signature: false,
      thiet_bi_mode: "none",
    },
    fields: [
      cf({ key: "tinh_trang", label: "Tình trạng cũ", position: 0 }),
      cf({ key: "ghi_chu", label: "Ghi chú", position: 1 }),
    ],
  };
  // form_field HIỆN TẠI đã bị đổi: đổi nhãn + thêm field mới, xoá ghi_chu.
  const currentFields: CompiledField[] = [
    cf({ key: "tinh_trang", label: "Tình trạng MỚI", position: 0 }),
    cf({ key: "field_moi", label: "Field mới", position: 1 }),
  ];

  it("dùng SNAPSHOT của phiếu, KHÔNG dùng form_field hiện tại", () => {
    const r = resolveSubmissionFields({ snapshot, currentFields });
    expect(r.source).toBe("snapshot");
    expect(r.fields.map((f) => f.key)).toEqual(["tinh_trang", "ghi_chu"]);
    // Nhãn phải là nhãn TẠI LÚC LẬP PHIẾU, không phải nhãn mới
    expect(r.fields[0].label).toBe("Tình trạng cũ");
  });

  it("fallback sang compiled_schema của version khi phiếu không có snapshot riêng", () => {
    const versionSchema: CompiledSchema = {
      template: snapshot.template,
      fields: [cf({ key: "v_field", label: "V", position: 0 })],
    };
    const r = resolveSubmissionFields({ snapshot: null, versionSchema, currentFields });
    expect(r.source).toBe("version");
    expect(r.fields.map((f) => f.key)).toEqual(["v_field"]);
  });

  it("fallback cuối cùng sang form_field hiện tại cho phiếu cũ (không snapshot, không version)", () => {
    const r = resolveSubmissionFields({ snapshot: null, versionSchema: null, currentFields });
    expect(r.source).toBe("current");
    expect(r.fields.map((f) => f.key)).toEqual(["tinh_trang", "field_moi"]);
  });
});
