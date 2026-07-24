import { describe, it, expect } from "vitest";
import { UI_DENSITY } from "../ui-density";

describe("UI_DENSITY", () => {
  it("có đủ khoá chuẩn", () => {
    expect(Object.keys(UI_DENSITY).sort()).toEqual(
      ["HEADER_GAP", "PAGE_PADDING", "SECTION_GAP", "TABLE_MAX_H"].sort(),
    );
  });

  it("giá trị ổn định theo hợp đồng", () => {
    expect(UI_DENSITY.PAGE_PADDING).toBe("px-4 py-4 lg:px-6");
    expect(UI_DENSITY.SECTION_GAP).toBe("space-y-4");
    expect(UI_DENSITY.TABLE_MAX_H).toBe("max-h-[calc(100vh-16rem)]");
    expect(UI_DENSITY.HEADER_GAP).toBe("gap-2");
  });

  it("mọi giá trị là chuỗi không rỗng", () => {
    for (const v of Object.values(UI_DENSITY)) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    }
  });
});
