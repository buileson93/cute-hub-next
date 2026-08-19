import { describe, it, expect, vi } from "vitest";
import { classifyPageText } from "../page-classifier";
import { normalizeViForSearch } from "../postprocess-vi";

describe("OCR Pipeline Logic", () => {
  describe("Page Classifier", () => {
    it("should flag low character count for OCR", () => {
      const result = classifyPageText("Low char");
      expect(result.needsOcr).toBe(true);
      expect(result.reason).toContain("Insufficient character count");
    });

    it("should flag low meaningful word count", () => {
      const longButMeaningless = "123 456 789 !!! ??? 000 111 222 333 444 555 666 777 888 999 000 111 222 333 444 555";
      const result = classifyPageText(longButMeaningless);
      expect(result.needsOcr).toBe(true);
      expect(result.reason).toContain("Insufficient meaningful words");
    });

    it("should accept valid Vietnamese text without OCR", () => {
      const validText = "Cộng hòa Xã hội Chủ nghĩa Việt Nam. Độc lập - Tự do - Hạnh phúc. Thiết bị đo áp suất P/N: 12345.";
      const result = classifyPageText(validText);
      expect(result.needsOcr).toBe(false);
    });
    
    it("should flag high error ratio", () => {
      const errorText = "Page content with many invalid characters \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD";
      const result = classifyPageText(errorText);
      expect(result.needsOcr).toBe(true);
      expect(result.reason).toContain("High error/placeholder ratio");
    });
  });

  describe("Vietnamese Post-processing", () => {
    it("should normalize Vietnamese for search", () => {
      const input = "Tiếng Việt có dấu và ĐÀ NẴNG";
      const expected = "tieng viet co dau va da nang";
      expect(normalizeViForSearch(input)).toBe(expected);
    });
  });
});
