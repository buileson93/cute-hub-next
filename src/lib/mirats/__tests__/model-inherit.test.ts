// P10.3 — Kế thừa Model: khi sửa dm_model, tài sản gắn model cập nhật đúng
// các trường chung. Trigger CSDL `dm_model_propagate_to_thiet_bi` (migration
// P10) chạy AFTER UPDATE trên dm_model. Ở tầng JS ta test hàm thuần
// `computeInheritedThietBiPatch` — mirror logic trigger để UI có thể tính
// optimistic patch / kiểm chứng invariants.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  computeInheritedThietBiPatch,
  MODEL_INHERITED_COLS,
  type ModelSnapshot,
} from "../rename-entity";

describe("computeInheritedThietBiPatch", () => {
  const base: ModelSnapshot = {
    loai_thiet_bi_id: "L1",
    nha_san_xuat_id: "N1",
    field_set_id: "F1",
    p_n: "PN-1",
  };

  it("không đổi ⇒ patch rỗng", () => {
    expect(computeInheritedThietBiPatch(base, base)).toEqual({});
  });

  it("đổi chủng loại ⇒ patch chỉ chứa loai_thiet_bi_id", () => {
    const patch = computeInheritedThietBiPatch(base, { ...base, loai_thiet_bi_id: "L2" });
    expect(patch).toEqual({ loai_thiet_bi_id: "L2" });
  });

  it("đổi NSX + field_set ⇒ patch gồm cả hai", () => {
    const patch = computeInheritedThietBiPatch(base, {
      ...base,
      nha_san_xuat_id: "N2",
      field_set_id: "F2",
    });
    expect(patch).toEqual({ nha_san_xuat_id: "N2", field_set_id: "F2" });
  });

  it("giá trị mới null ⇒ KHÔNG ghi đè (mirror trigger)", () => {
    const patch = computeInheritedThietBiPatch(base, {
      ...base,
      loai_thiet_bi_id: null,
      nha_san_xuat_id: null,
    });
    expect(patch).toEqual({});
  });

  it("p_n rỗng ⇒ KHÔNG ghi đè", () => {
    const patch = computeInheritedThietBiPatch(base, { ...base, p_n: "" });
    expect(patch).toEqual({});
  });

  it("p_n từ null → giá trị mới ⇒ ghi đè", () => {
    const patch = computeInheritedThietBiPatch(
      { ...base, p_n: null },
      { ...base, p_n: "PN-NEW" },
    );
    expect(patch).toEqual({ p_n: "PN-NEW" });
  });

  it("MODEL_INHERITED_COLS đúng bộ 4 trường trigger giữ", () => {
    expect([...MODEL_INHERITED_COLS].sort()).toEqual(
      ["field_set_id", "loai_thiet_bi_id", "nha_san_xuat_id", "p_n"].sort(),
    );
  });
});

// -- Bảo đảm migration trigger tồn tại: mọi cột được liệt kê trong
// -- MODEL_INHERITED_COLS phải xuất hiện trong SQL propagate. Nếu tương lai ai
// -- đó thêm cột kế thừa ở JS mà quên đồng bộ SQL — test này bắt được ngay.
describe("migration `dm_model_propagate_to_thiet_bi`", () => {
  const dirs = [
    path.resolve(__dirname, "../../../../supabase/migrations"),
    path.resolve(__dirname, "../../../../supabase/dump"),
  ];
  const sql = dirs
    .flatMap((d) =>
      fs.existsSync(d)
        ? fs.readdirSync(d).filter((f) => f.endsWith(".sql")).map((f) => path.join(d, f))
        : [],
    )
    .map((p) => fs.readFileSync(p, "utf8"))
    .join("\n");

  it("có trigger AFTER UPDATE trên dm_model gọi hàm propagate", () => {
    expect(sql).toMatch(/AFTER UPDATE ON public\.dm_model/);
    expect(sql).toMatch(/dm_model_propagate_to_thiet_bi/);
  });

  it("SQL propagate cập nhật đủ 4 trường kế thừa", () => {
    for (const col of MODEL_INHERITED_COLS) {
      expect(sql).toMatch(new RegExp(`SET\\s+${col}\\s*=\\s*NEW\\.${col}`));
    }
  });
});
