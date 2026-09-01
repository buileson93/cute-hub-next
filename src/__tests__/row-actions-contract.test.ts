import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Cụm nút thao tác trong bảng khu vực Danh mục phải dùng chung một hệ phong cách
// (RowActionBar / RowActionButton / RowActionMenu) thay vì mỗi trang tự chế.
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const CATALOG_TABLES = [
  "src/components/mirats/CatalogTable.tsx",
  "src/routes/_app.danh-muc.thiet-bi.tsx",
  "src/routes/_app.danh-muc.model.tsx",
  "src/routes/_app.danh-muc.dac-tinh.tsx",
  "src/routes/_app.danh-muc.he-thong.tsx",
];

describe("Danh mục — hợp đồng nút thao tác dòng", () => {
  it.each(CATALOG_TABLES)("%s dùng RowActionBar/RowActionButton dùng chung", (p) => {
    const src = read(p);
    expect(src).toContain('from "@/components/mirats/table/RowActions"');
    expect(src).toContain("<RowActionBar>");
    expect(src).toContain("<RowActionButton");
  });

  it.each(CATALOG_TABLES)("%s không còn nút icon h-7 w-7 tự chế trong cột thao tác", (p) => {
    expect(read(p)).not.toContain('className="h-7 w-7 text-destructive"');
  });

  it("RowActionButton luôn có aria-label và tooltip", () => {
    const src = read("src/components/mirats/table/RowActions.tsx");
    expect(src).toContain("aria-label={label}");
    expect(src).toContain("const noiDung = tooltip ?? label");
    // Tooltip vẫn hiện được khi nút bị disabled (Radix không nhận sự kiện từ nút disabled).
    expect(src).toContain('<span className="inline-flex">{btn}</span>');
  });

  it("kích thước nút đủ vùng chạm trên mobile và thu gọn trên desktop", () => {
    const src = read("src/components/mirats/table/RowActions.tsx");
    expect(src).toContain("h-9 w-9 rounded-md sm:h-7 sm:w-7");
    expect(src).toContain("h-4 w-4 sm:h-3.5 sm:w-3.5");
  });

  it("hành động phá huỷ giữ tông cảnh báo", () => {
    const src = read("src/components/mirats/table/RowActions.tsx");
    expect(src).toContain("destructive: \"text-destructive");
  });
});
