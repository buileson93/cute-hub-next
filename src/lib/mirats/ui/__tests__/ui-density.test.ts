import { describe, it, expect } from "vitest";
import { UI_DENSITY } from "../ui-density";

describe("UI_DENSITY", () => {
  it("có đủ khoá chuẩn", () => {
    expect(Object.keys(UI_DENSITY)).toContain("PAGE_PADDING");
    expect(Object.keys(UI_DENSITY)).toContain("SECTION_GAP");
    expect(Object.keys(UI_DENSITY)).toContain("HEADER_GAP");
    expect(Object.keys(UI_DENSITY)).toContain("CARD_PADDING");
    expect(Object.keys(UI_DENSITY)).toContain("CARD_HEADER");
    expect(Object.keys(UI_DENSITY)).toContain("TABLE_ROW_H");
    expect(Object.keys(UI_DENSITY)).toContain("CONTROL_H");
  });

  it("các token chứa giá trị đáp ứng cả comfortable và compact", () => {
    // We check for "comfortable" density support as defined in ui-density.ts
    expect(UI_DENSITY.PAGE_PADDING).toContain("data-[density=comfortable]");
    expect(UI_DENSITY.SECTION_GAP).toContain("data-[density=comfortable]");
    expect(UI_DENSITY.CONTROL_H).toContain("data-[density=comfortable]");
  });

  it("giá trị gốc (comfortable) vẫn tồn tại trong chuỗi token", () => {
    // MIRATS uses compact-first or specific breakpoints; we check if the standard comfortable tokens exist
    expect(UI_DENSITY.PAGE_PADDING).toContain("data-[density=comfortable]:p-4");
    expect(UI_DENSITY.SECTION_GAP).toContain("md:data-[density=comfortable]:gap-4");
    expect(UI_DENSITY.CARD_PADDING).toContain("data-[density=comfortable]:p-5");
  });

  it("đảm bảo đích chạm mobile tối thiểu 44px (h-11) cho các control", () => {
    // h-11 = 2.75rem = 44px
    expect(UI_DENSITY.CONTROL_H).toContain("h-11");
    expect(UI_DENSITY.TABLE_ROW_H).toContain("min-h-11");
  });

  it("đảm bảo khoảng cách mobile tối thiểu 8px (gap-2)", () => {
    // gap-2 = 0.5rem = 8px
    expect(UI_DENSITY.HEADER_GAP).toMatch(/^gap-[2-9]/);
    expect(UI_DENSITY.SECTION_GAP).toMatch(/^gap-[2-9]/);
  });
});
