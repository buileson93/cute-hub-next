// ============================================================================
// Kiểm thử THỨ TỰ SHEET & ÁNH XẠ của mẫu All-in-one (allinone-template).
// Bảo đảm bất biến quan trọng: cha luôn đứng TRƯỚC con (đúng thứ tự phụ thuộc
// khi ghi), mỗi lớp map 1-1 tới một entity/bảng, tên sheet hợp lệ Excel (≤31).
// Không đụng CSDL: chỉ đọc cấu hình lớp + entity.
// ============================================================================

import { describe, it, expect } from "vitest";
import { ALLINONE_LAYERS, layerTable } from "@/lib/mirats/allinone-template";
import { findEntity } from "@/lib/mirats/import-config";

describe("All-in-one — cấu trúc lớp", () => {
  it("mỗi lớp giải được entity qua findEntity", () => {
    for (const l of ALLINONE_LAYERS) {
      expect(findEntity(l.entity, l.catTable), `lớp ${l.sheet}`).toBeTruthy();
    }
  });

  it("tên sheet duy nhất và ≤ 31 ký tự (giới hạn Excel)", () => {
    const names = ALLINONE_LAYERS.map((l) => l.sheet);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n.length).toBeLessThanOrEqual(31);
  });

  it("layerTable map 1-1 (không hai lớp trỏ cùng bảng)", () => {
    const tables = ALLINONE_LAYERS.map(layerTable);
    expect(new Set(tables).size).toBe(tables.length);
  });

  it("CHA đứng TRƯỚC CON: mọi bảng ref cũng là một lớp phải xuất hiện sớm hơn", () => {
    const orderIndex = new Map<string, number>();
    ALLINONE_LAYERS.forEach((l, i) => orderIndex.set(layerTable(l), i));

    ALLINONE_LAYERS.forEach((l, i) => {
      const ent = findEntity(l.entity, l.catTable)!;
      for (const f of ent.fields) {
        if (f.kind !== "ref" || !f.ref) continue;
        const depTable = f.ref.table;
        // Bỏ qua ref tự-tham-chiếu (cấp cha trong cùng bảng) và ref không phải là lớp.
        if (depTable === ent.table) continue;
        if (!orderIndex.has(depTable)) continue;
        expect(
          orderIndex.get(depTable)!,
          `Sheet "${l.sheet}" phụ thuộc "${depTable}" nhưng bảng đó nằm SAU`,
        ).toBeLessThan(i);
      }
    });
  });

  it("thứ tự chuẩn: Tài sản trước các lớp vận hành, danh mục gốc ở ĐẦU", () => {
    const tables = ALLINONE_LAYERS.map(layerTable);
    const idxTB = tables.indexOf("thiet_bi");
    expect(idxTB).toBeGreaterThan(-1);
    // Các bảng vận hành (nếu có mặt) phải nằm SAU Tài sản.
    for (const t of ["bao_tri", "chung_chi_thiet_bi", "vat_tu", "nhan_vien"]) {
      const i = tables.indexOf(t);
      if (i >= 0) expect(i).toBeGreaterThan(idxTB);
    }
    // Hệ thống phải trước Tài sản; Mẫu trước Tài sản.
    expect(tables.indexOf("dm_he_thong")).toBeLessThan(tables.indexOf("thiet_bi"));
    expect(tables.indexOf("dm_model")).toBeLessThan(tables.indexOf("thiet_bi"));
    // Phân loại trước Nhóm hệ thống trước Hệ thống.
    expect(tables.indexOf("dm_phan_loai")).toBeLessThan(tables.indexOf("dm_nhom_he_thong"));
    expect(tables.indexOf("dm_nhom_he_thong")).toBeLessThan(tables.indexOf("dm_he_thong"));
  });
});
