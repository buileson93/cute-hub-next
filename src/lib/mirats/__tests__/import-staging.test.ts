import { describe, it, expect } from "vitest";
import { layersToStagedItems } from "@/lib/mirats/import-staging";
import type { ParsedLayer } from "@/lib/mirats/allinone-template";

function layer(sheet: string, entity: string, rows: Record<string, string>[]): ParsedLayer {
  return { layer: { sheet, entity }, rows, unmapped: [], headers: [], meta: [] } as unknown as ParsedLayer;
}

describe("layersToStagedItems", () => {
  it("chỉ chuyển lớp có dữ liệu và đánh số dòng từ 1", () => {
    const items = layersToStagedItems([
      layer("Tài sản", "thiet_bi", [{ ma: "A1" }, { ma: "A2" }]),
      layer("Hệ thống", "he_thong", []),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ sheet: "Tài sản", entity: "thiet_bi", rowIndex: 1, status: "staged" });
    expect(items[1].rowIndex).toBe(2);
    expect(items.every((i) => i.entity !== "he_thong")).toBe(true);
  });
});
