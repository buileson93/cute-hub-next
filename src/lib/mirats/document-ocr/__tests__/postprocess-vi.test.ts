import { describe, it, expect } from "vitest";
import { normalizeViForSearch, isTechnicalSegment } from "../postprocess-vi";

describe("Vietnamese Post-processing", () => {
  it("should normalize Vietnamese for search (remove accents)", () => {
    expect(normalizeViForSearch("Hệ thống")).toBe("he thong");
    expect(normalizeViForSearch("Điều hòa")).toBe("dieu hoa");
    expect(normalizeViForSearch("MÁY PHÁT ĐIỆN")).toBe("may phat dien");
  });

  it("should correctly identify technical segments", () => {
    expect(isTechnicalSegment("S/N: 12345")).toBe(true);
    expect(isTechnicalSegment("P/N: ABC-XYZ")).toBe(true);
    expect(isTechnicalSegment("100kW")).toBe(true);
    expect(isTechnicalSegment("50Hz")).toBe(true);
    expect(isTechnicalSegment("220V")).toBe(true);
    expect(isTechnicalSegment("Chạy thử nghiệm")).toBe(false);
  });

  it("should preserve technical patterns during search normalization", () => {
    // Search normalization usually removes special chars, but we should verify it doesn't mangle technical tokens too much
    const raw = "P/N: 123.ABC-X";
    const normalized = normalizeViForSearch(raw);
    // Standard normalization will lower case and remove accents, but slashes/dots stay unless we replace them
    // Current implementation only does accents + lowercase
    expect(normalized).toBe("p/n: 123.abc-x");
  });
});
