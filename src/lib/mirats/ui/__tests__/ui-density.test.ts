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
    // Chỉ kiểm tra sự hiện diện của data-[density=compact]
    expect(UI_DENSITY.PAGE_PADDING).toContain("data-[density=compact]");
    expect(UI_DENSITY.SECTION_GAP).toContain("data-[density=compact]");
    expect(UI_DENSITY.CONTROL_H).toContain("data-[density=compact]");
  });

  it("giá trị gốc (comfortable) vẫn tồn tại trong chuỗi token", () => {
    expect(UI_DENSITY.PAGE_PADDING).toContain("p-4 md:p-6");
    expect(UI_DENSITY.SECTION_GAP).toContain("gap-4");
    expect(UI_DENSITY.HEADER_GAP).toContain("gap-2");
    expect(UI_DENSITY.CARD_PADDING).toContain("p-6");
  });
});
