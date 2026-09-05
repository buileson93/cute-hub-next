import { describe, it, expect } from "vitest";
import { normalizeDisplayMode } from "../CayContext";

describe("normalizeDisplayMode", () => {
  it("giữ nguyên các chế độ hợp lệ của trang Cây", () => {
    expect(normalizeDisplayMode("mindmap")).toBe("mindmap");
    expect(normalizeDisplayMode("bang")).toBe("bang");
    expect(normalizeDisplayMode("health")).toBe("health");
  });

  it("đưa 'table' (Danh sách) về 'tree' vì nó nằm ở route khác", () => {
    expect(normalizeDisplayMode("table")).toBe("tree");
  });

  it("chống dữ liệu rác trong localStorage", () => {
    expect(normalizeDisplayMode("xyz")).toBe("tree");
    expect(normalizeDisplayMode(null)).toBe("tree");
  });
});
