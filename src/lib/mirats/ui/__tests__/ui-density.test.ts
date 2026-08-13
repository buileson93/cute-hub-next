import { describe, it, expect } from "vitest";
import { UI_DENSITY } from "../ui-density";

describe("UI_DENSITY", () => {
  it("có đủ khoá chuẩn", () => {
    expect(Object.keys(UI_DENSITY)).toContain("PAGE_PADDING");
    expect(Object.keys(UI_DENSITY)).toContain("SECTION_GAP");
    expect(Object.keys(UI_DENSITY)).toContain("HEADER_GAP");
    expect(Object.keys(UI_DENSITY)).toContain("CARD_PADDING");
    expect(Object.keys(UI_DENSITY)).toContain("COMPACT");
  });

  it("giá trị mặc định ổn định", () => {
    expect(UI_DENSITY.PAGE_PADDING).toBe("p-4 md:p-6");
    expect(UI_DENSITY.SECTION_GAP).toBe("gap-4");
    expect(UI_DENSITY.HEADER_GAP).toBe("gap-2");
    expect(UI_DENSITY.CARD_PADDING).toBe("p-6");
  });

  it("giá trị compact ổn định", () => {
    expect(UI_DENSITY.COMPACT.PAGE_PADDING).toBe("p-3 md:p-4");
    expect(UI_DENSITY.COMPACT.SECTION_GAP).toBe("gap-3");
    expect(UI_DENSITY.COMPACT.HEADER_GAP).toBe("gap-1.5");
    expect(UI_DENSITY.COMPACT.CARD_PADDING).toBe("p-4");
  });
});
