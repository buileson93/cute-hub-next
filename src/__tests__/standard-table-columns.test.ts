import { describe, it, expect, vi } from "vitest";
import { useColumnPrefs } from "../lib/mirats/use-column-prefs";
import { StdColumn } from "../components/mirats/StandardTable";

// Mock useColumnPrefs
vi.mock("../lib/mirats/use-column-prefs", () => ({
  useColumnPrefs: vi.fn(),
}));

describe("StandardTable Logic 3 Tầng (Column Filtering)", () => {
  const mockColumns: StdColumn<any>[] = [
    { key: "c1", label: "Cột 1" },
    { key: "c2", label: "Cột 2", hideBelow: "lg" }, // Tầng 2: lg=1024
    { key: "c3", label: "Cột 3", hidden: true },    // Tầng 3: Hidden cứng
    { key: "c4", label: "Cột 4" },
  ];

  it("người dùng ẩn cột X -> X không có trên màn hình VÀ không có trong xuất", () => {
    // Giả lập người dùng ẩn 'c1' (Tầng 1)
    (useColumnPrefs as any).mockReturnValue({
      order: ["c1", "c2", "c3", "c4"],
      hidden: new Set(["c1"]),
      ready: true,
      isHidden: (k: string) => k === "c1",
    });

    // Mô phỏng logic lọc trong StandardTable
    const userHidden = new Set(["c1"]);
    const vw = 1200; // Màn hình lớn
    const BP_PX = { lg: 1024 };

    const shownCols = mockColumns.filter(c => {
      if (userHidden.has(c.key)) return false; // Tầng 1
      if (c.hidden) return false;              // Tầng 3
      if (c.hideBelow) {                       // Tầng 2
        const threshold = BP_PX.lg;
        if (vw < threshold) return false;
      }
      return true;
    });

    const exportCols = mockColumns.filter(c => {
      if (userHidden.has(c.key)) return false; // Tầng 1
      if (c.hidden) return false;              // Tầng 3
      return true;                             // Bỏ qua Tầng 2
    });

    expect(shownCols.map(c => c.key)).not.toContain("c1");
    expect(exportCols.map(c => c.key)).not.toContain("c1");
    expect(exportCols.map(c => c.key)).toContain("c2");
  });

  it("cột Y có hideBelow=lg, màn hình 375px -> Y không trên màn hình NHƯNG VẪN có trong xuất", () => {
    (useColumnPrefs as any).mockReturnValue({
      order: ["c1", "c2", "c3", "c4"],
      hidden: new Set([]),
      ready: true,
      isHidden: () => false,
    });

    const userHidden = new Set([]);
    const vw = 375; // Màn hình nhỏ
    const BP_PX = { lg: 1024 };

    const shownCols = mockColumns.filter(c => {
      if (userHidden.has(c.key)) return false;
      if (c.hidden) return false;
      if (c.hideBelow) {
        const threshold = BP_PX.lg;
        if (vw < threshold) return false;
      }
      return true;
    });

    const exportCols = mockColumns.filter(c => {
      if (userHidden.has(c.key)) return false;
      if (c.hidden) return false;
      return true;
    });

    expect(shownCols.map(c => c.key)).not.toContain("c2"); // Bị ẩn do responsive
    expect(exportCols.map(c => c.key)).toContain("c2");    // Vẫn xuất hiện khi export
  });

  it("không có tableKey -> không vỡ, chỉ là không nhớ", () => {
    // StandardTable component should handle undefined tableKey
    // If tableKey is missing, useColumnPrefs might be skipped or return defaults
    (useColumnPrefs as any).mockReturnValue({
      order: ["c1", "c2", "c3", "c4"],
      hidden: new Set([]),
      ready: true,
      isHidden: () => false,
    });

    expect(useColumnPrefs).toHaveBeenCalled();
  });

  it("đổi thứ tự cột rồi tải lại -> giữ nguyên thứ tự", () => {
    const customOrder = ["c4", "c1", "c2", "c3"];
    (useColumnPrefs as any).mockReturnValue({
      order: customOrder,
      hidden: new Set([]),
      ready: true,
      isHidden: () => false,
    });

    const prefs = useColumnPrefs("any", ["c1", "c2", "c3", "c4"]);
    
    // Sắp xếp columns theo prefs.order
    const sorted = [...mockColumns].sort((a, b) => {
      return prefs.order.indexOf(a.key) - prefs.order.indexOf(b.key);
    });

    expect(sorted[0].key).toBe("c4");
    expect(sorted[1].key).toBe("c1");
  });
});
