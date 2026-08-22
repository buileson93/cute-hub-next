import { describe, it, expect, beforeEach, vi } from "vitest";
import { runtimeMetricsManager } from "../runtime-metrics";
import { artifactRepository } from "../artifact-repository";
import { deviceProfiler } from "../device-profiler";

describe("RuntimeMetricsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(artifactRepository, "reportMetric").mockResolvedValue(undefined);
  });

  it("should bucket hardware capabilities correctly and report metrics", async () => {
    vi.spyOn(deviceProfiler, "getProfile").mockResolvedValue({
      tier: "high",
      capabilities: {
        hardwareConcurrency: 8,
        deviceMemory: 16,
        hasWebGPU: true,
        hasWasmSimd: true,
        hasWasmThreads: true,
      },
    } as any);

    const mockResult = {
      page: 1,
      providerId: "tesseract-wasm",
      durationMs: 500,
      confidence: 0.95,
      method: "ocr" as const,
      rawText: "test",
    };

    await runtimeMetricsManager.capturePageMetric(mockResult, "quality");

    expect(artifactRepository.reportMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_bucket: expect.stringContaining("cpu:5-8"),
        duration_ms: 500,
        confidence: 0.95,
      }),
    );

    const lastCall = vi.mocked(artifactRepository.reportMetric).mock.calls[0][0];
    expect(lastCall.profile_bucket).toContain("mem:9+");
    expect(lastCall.profile_bucket).toContain("gpu:y");
  });

  it("should handle low-end devices correctly", async () => {
    vi.spyOn(deviceProfiler, "getProfile").mockResolvedValue({
      tier: "low",
      capabilities: {
        hardwareConcurrency: 2,
        deviceMemory: 2,
        hasWebGPU: false,
        hasWasmSimd: false,
        hasWasmThreads: false,
      },
    } as any);

    const mockResult = {
      page: 1,
      providerId: "tesseract-wasm",
      durationMs: 2000,
      confidence: 0.8,
      method: "ocr" as const,
      rawText: "test",
    };

    await runtimeMetricsManager.capturePageMetric(mockResult, "eco");

    expect(artifactRepository.reportMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_bucket: expect.stringContaining("cpu:1-2"),
        duration_ms: 2000,
      }),
    );

    const lastCall = vi.mocked(artifactRepository.reportMetric).mock.calls[0][0];
    expect(lastCall.profile_bucket).toContain("mem:<=2");
    expect(lastCall.profile_bucket).toContain("gpu:n");
  });
});
