import { describe, it, expect, vi } from "vitest";
import { calculateCER, calculateTechnicalAccuracy } from "../utils/metrics";
import { OCR_BENCHMARK_FIXTURES } from "../fixtures/benchmark-docs";

describe("OCR Benchmark Integration", () => {
  it("should calculate metrics accurately against fixtures", () => {
    const fixture = OCR_BENCHMARK_FIXTURES.find(f => f.id === 'tech-spec-01')!;
    const extractedText = "Model: ABC-1234. S/N: 998877. Công suất: 500kW. Tần số: 50Hz.";
    
    const cer = calculateCER(fixture.groundTruth.fullText, extractedText);
    const techAcc = calculateTechnicalAccuracy(fixture.groundTruth.technicalTokens, extractedText);

    expect(cer).toBe(0);
    expect(techAcc).toBe(1);
  });

  it("should penalize errors in technical tokens", () => {
    const fixture = OCR_BENCHMARK_FIXTURES.find(f => f.id === 'tech-spec-01')!;
    const badText = "Model: ABC-1234. S/N: 9988??. Cong suat: 500kW. Tan so: 50Hz.";
    
    const techAcc = calculateTechnicalAccuracy(fixture.groundTruth.technicalTokens, badText);
    // Missing '998877' match
    expect(techAcc).toBeLessThan(1);
    expect(techAcc).toBe(0.75); // 3 out of 4 matches
  });

  it("should handle mixed language content", () => {
    const fixture = OCR_BENCHMARK_FIXTURES.find(f => f.id === 'mixed-en-vi-01')!;
    const extractedText = "Installation Guide - Huong dan lap dat may phat dien.";
    
    // Note: If we don't normalize, CER will be high due to missing accents
    const cerRaw = calculateCER(fixture.groundTruth.fullText, extractedText);
    expect(cerRaw).toBeGreaterThan(0.1);
  });
});
