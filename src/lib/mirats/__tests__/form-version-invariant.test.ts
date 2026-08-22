import { describe, it, expect } from "vitest";
import {
  compileSchema,
  parseCompiledSchema,
  resolveSubmissionFields,
  type CompiledField,
} from "../form-schema";

// Bất biến version hóa: SỬA MẪU KHÔNG ĐỔI PHIẾU CŨ.
// Phiếu cũ ghim snapshot cấu trúc tại thời điểm lập; khi render/xuất phải đọc
// snapshot chứ không đọc form_field hiện tại.
describe("Bất biến: sửa mẫu không thay đổi submission cũ", () => {
  // Mẫu tại thời điểm lập phiếu (v1): 2 field.
  const schemaV1 = compileSchema(
    {
      id: "t1",
      code: "PL01",
      ten: "Bảo dưỡng",
      version: 1,
      require_signature: true,
      thiet_bi_mode: "single",
    },
    [
      { key: "dien_ap", label: "Điện áp", kind: "number", required: true, position: 1 },
      { key: "ghi_chu", label: "Ghi chú", kind: "text", position: 2 },
    ],
  );
  // Snapshot đã lưu trong form_submission.template_snapshot (jsonb).
  const snapshotJson = JSON.parse(JSON.stringify(schemaV1)) as unknown;

  // Sau đó mẫu bị SỬA: thêm field, đổi nhãn, bỏ field cũ (v2 hiện tại).
  const currentFields: CompiledField[] = compileSchema(
    {
      id: "t1",
      code: "PL01",
      ten: "Bảo dưỡng",
      version: 2,
      require_signature: true,
      thiet_bi_mode: "single",
    },
    [
      {
        key: "dien_ap",
        label: "Điện áp (V) — ĐÃ ĐỔI",
        kind: "number",
        required: true,
        position: 1,
      },
      { key: "nhiet_do", label: "Nhiệt độ", kind: "number", required: true, position: 2 },
    ],
  ).fields;

  it("phiếu cũ đọc từ snapshot, không bị ảnh hưởng bởi mẫu đã sửa", () => {
    const snap = parseCompiledSchema(snapshotJson);
    const res = resolveSubmissionFields({ snapshot: snap, currentFields });
    expect(res.source).toBe("snapshot");
    expect(res.fields.map((f) => f.key)).toEqual(["dien_ap", "ghi_chu"]);
    expect(res.fields[0].label).toBe("Điện áp"); // nhãn cũ, KHÔNG phải nhãn đã đổi
    expect(res.fields.some((f) => f.key === "nhiet_do")).toBe(false); // field mới không lọt vào phiếu cũ
  });

  it("phiếu mới (chưa có snapshot) mới dùng cấu trúc hiện tại", () => {
    const res = resolveSubmissionFields({ snapshot: null, currentFields });
    expect(res.source).toBe("current");
    expect(res.fields.map((f) => f.key)).toEqual(["dien_ap", "nhiet_do"]);
  });

  it("ưu tiên snapshot > version > current", () => {
    const version = compileSchema(
      {
        id: "t1",
        code: "PL01",
        ten: "Bảo dưỡng",
        version: 1,
        require_signature: false,
        thiet_bi_mode: "single",
      },
      [{ key: "chi_version", label: "V", position: 1 }],
    );
    const res = resolveSubmissionFields({
      snapshot: null,
      versionSchema: version,
      currentFields,
    });
    expect(res.source).toBe("version");
    expect(res.fields.map((f) => f.key)).toEqual(["chi_version"]);
  });
});
