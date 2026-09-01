import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Hợp đồng chuẩn hoá cho khu vực Danh mục:
//  - Bảng danh mục dùng chung StandardTable ("Thành phần & Tài sản" là chuẩn).
//  - Cây danh mục dùng chung primitive phân cấp ("Cây phân cấp" là chuẩn).
//  - Trạng thái lỗi phải có hành động thử lại, không phải một dòng chữ chết.
//  - Cây phải phòng thủ trước dữ liệu phân cấp vòng lặp / quá sâu.
const src = readFileSync(
  resolve(process.cwd(), "src/components/mirats/CatalogTable.tsx"),
  "utf8",
);

describe("Danh mục — hợp đồng chuẩn bảng & cây", () => {
  it("bảng danh mục dùng StandardTable dùng chung", () => {
    expect(src).toContain('from "@/components/mirats/StandardTable"');
    expect(src).toContain("<StandardTable<Row>");
  });

  it("cây danh mục dùng primitive phân cấp dùng chung", () => {
    expect(src).toContain('from "@/components/mirats/hierarchy/HierarchyNode"');
    expect(src).toContain("<HierarchyRow");
    expect(src).toContain("<HierarchyChildren");
    expect(src).toContain("<HierarchySkeleton");
  });

  it("không còn node cây tự chế bằng chevron rời", () => {
    expect(src).not.toContain('style={{ marginLeft: depth * 20 }}');
  });

  it("trạng thái lỗi có nút thử lại", () => {
    expect(src).toContain("Thử lại");
    expect(src).toContain("void refetch()");
  });

  it("chống phân cấp vòng lặp và cây quá sâu", () => {
    expect(src).toContain("MAX_TREE_DEPTH");
    expect(src).toContain("ancestors.has(row.id)");
  });
});
