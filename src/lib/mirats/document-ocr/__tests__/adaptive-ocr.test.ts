import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectCapabilities } from "../capabilities";
import { deviceProfiler } from "../device-profiler";
import { adaptiveOcrSelector } from "../adaptive-selector";

describe("Adaptive OCR Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect basic browser capabilities", async () => {
    const caps = await detectCapabilities();
    expect(caps).toBeDefined();
    expect(typeof caps.hasWebGPU).toBe("boolean");
  });

  it("should recommend correct quality based on tier", async () => {
    // Mock high tier
    vi.spyOn(deviceProfiler, "getProfile").mockResolvedValue({
      capabilities: {
        hasWebGPU: true,
        hasWasmSimd: true,
        hasWasmThreads: true,
        isCrossOriginIsolated: true,
        hasOffscreenCanvas: true,
        hasCreateImageBitmap: true,
        isMobile: false,
      },
      tier: "high",
      timestamp: Date.now(),
      appVersion: "1.0.0"
    });

    const quality = await adaptiveOcrSelector.getRecommendedQuality();
    expect(quality).toBe("quality");
  });

  it("should recommend eco quality for low tier/mobile", async () => {
    vi.spyOn(deviceProfiler, "getProfile").mockResolvedValue({
      capabilities: {
        hasWebGPU: false,
        hasWasmSimd: false,
        hasWasmThreads: false,
        isCrossOriginIsolated: false,
        hasOffscreenCanvas: false,
        hasCreateImageBitmap: false,
        isMobile: true,
      },
      tier: "low",
      timestamp: Date.now(),
      appVersion: "1.0.0"
    });

    const quality = await adaptiveOcrSelector.getRecommendedQuality();
    expect(quality).toBe("eco");
  });
});
