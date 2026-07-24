import { describe, it, expect } from "vitest";
import {
  isFieldEditable,
  filterPhysPayload,
  THIET_BI_PHYS_GROUPS,
  type PhysCol,
} from "../editable-columns";

// ============================================================================
// P4 — Kế thừa từ dm_model là CHỈ-ĐỌC ở UI.
//
// Khi tài sản đã gắn `model_id`, các trường có cờ `inheritedFromModel`
// (loai_thiet_bi_id, nha_san_xuat_id, p_n) do trigger tự điền theo mẫu.
// UI KHÔNG được render input sửa được, và payload lưu KHÔNG được ghi đè
// những trường này. Khi chưa gắn mẫu, các trường vẫn sửa bình thường.
// ============================================================================

const allTbCols = THIET_BI_PHYS_GROUPS.flatMap((g) => g.cols);
const inheritedKeys = allTbCols.filter((c) => c.inheritedFromModel).map((c) => c.key);
const findCol = (key: string): PhysCol => {
  const c = allTbCols.find((x) => x.key === key);
  if (!c) throw new Error(`missing col ${key}`);
  return c;
};

describe("editable-columns — registry", () => {
  it("Ba trường kế thừa được đánh dấu đúng: loai_thiet_bi_id, nha_san_xuat_id, p_n", () => {
    expect(new Set(inheritedKeys)).toEqual(new Set(["loai_thiet_bi_id", "nha_san_xuat_id", "p_n"]));
  });
});

describe("isFieldEditable — cờ inheritedFromModel × model_id", () => {
  it("Tài sản CÓ model_id ⇒ các trường kế thừa KHÔNG editable (input phải không render/disabled)", () => {
    for (const key of inheritedKeys) {
      expect(isFieldEditable(findCol(key), { layer: "tb", hasModel: true })).toBe(false);
    }
  });

  it("Tài sản KHÔNG có model_id ⇒ các trường kế thừa VẪN editable (input hiển thị bình thường)", () => {
    for (const key of inheritedKeys) {
      expect(isFieldEditable(findCol(key), { layer: "tb", hasModel: false })).toBe(true);
    }
  });

  it("Trường KHÔNG có cờ inheritedFromModel luôn editable, không phụ thuộc model", () => {
    const c = findCol("ma_serial");
    expect(isFieldEditable(c, { layer: "tb", hasModel: true })).toBe(true);
    expect(isFieldEditable(c, { layer: "tb", hasModel: false })).toBe(true);
  });

  it("Ở layer khác `tb` (ví dụ `ht`), cờ inheritedFromModel không áp dụng", () => {
    const fakeInherited: PhysCol = { key: "x", label: "X", type: "text", inheritedFromModel: true };
    expect(isFieldEditable(fakeInherited, { layer: "ht", hasModel: true })).toBe(true);
  });
});

describe("filterPhysPayload — không ghi đè trường kế thừa khi đã gắn mẫu", () => {
  const raw = {
    ma_serial: "SN-001",
    loai_thiet_bi_id: "loai-x",
    nha_san_xuat_id: "nsx-y",
    p_n: "PN-Z",
    ghi_chu: "note",
  };

  it("Có model_id ⇒ payload KHÔNG chứa loai_thiet_bi_id / nha_san_xuat_id / p_n", () => {
    const out = filterPhysPayload(allTbCols, raw, { layer: "tb", hasModel: true });
    expect(out).not.toHaveProperty("loai_thiet_bi_id");
    expect(out).not.toHaveProperty("nha_san_xuat_id");
    expect(out).not.toHaveProperty("p_n");
    // Trường không kế thừa vẫn được giữ lại.
    expect(out.ma_serial).toBe("SN-001");
    expect(out.ghi_chu).toBe("note");
  });

  it("Không có model_id ⇒ payload GIỮ đủ các trường (kế cả trường kế thừa)", () => {
    const out = filterPhysPayload(allTbCols, raw, { layer: "tb", hasModel: false });
    expect(out.loai_thiet_bi_id).toBe("loai-x");
    expect(out.nha_san_xuat_id).toBe("nsx-y");
    expect(out.p_n).toBe("PN-Z");
    expect(out.ma_serial).toBe("SN-001");
  });
});
