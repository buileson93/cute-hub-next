import { describe, it, expect } from "vitest";
import { TYPO } from "../typography";

describe("MIRATS Typography Scale Integrity", () => {
  it("should have exactly 7 levels", () => {
    const keys = Object.keys(TYPO);
    expect(keys.length).toBe(7);
    expect(keys).toContain("DISPLAY");
    expect(keys).toContain("H1");
    expect(keys).toContain("H2");
    expect(keys).toContain("H3");
    expect(keys).toContain("BODY");
    expect(keys).toContain("LABEL");
    expect(keys).toContain("MONO");
  });

  it("should not contain any font size smaller than 11px", () => {
    Object.entries(TYPO).forEach(([level, classes]) => {
      const pxMatches = classes.match(/text-\[(\d+)px\]/g);
      if (pxMatches) {
        pxMatches.forEach(match => {
          const size = parseInt(match.match(/\d+/)[0]);
          expect(size, `Level ${level} has size ${size}px which is < 11px`).toBeGreaterThanOrEqual(11);
        });
      }
    });
  });

  it("should have at least one data-[density=comfortable] variant for each level", () => {
    Object.entries(TYPO).forEach(([level, classes]) => {
      // MONO might inherit and not have its own density if it's just a style modifier, 
      // but the requirement says "Each level has at least one comfortable variant".
      // Note: UI_DENSITY.TEXT_BODY and TEXT_LABEL do have density variants.
      expect(classes, `Level ${level} missing comfortable density variant`).toContain("data-[density=comfortable]");
    });
  });

  it("MONO must have font-mono and tabular-nums", () => {
    expect(TYPO.MONO).toContain("font-mono");
    expect(TYPO.MONO).toContain("tabular-nums");
  });

  it("BODY compact must not be smaller than 12px", () => {
    // Standard text-[Npx] usually defines the compact/default size
    const bodyMatch = TYPO.BODY.match(/text-\[(\d+)px\]/);
    if (bodyMatch) {
      const size = parseInt(bodyMatch[1]);
      expect(size, `BODY compact size ${size}px is < 12px`).toBeGreaterThanOrEqual(12);
    }
  });
});
