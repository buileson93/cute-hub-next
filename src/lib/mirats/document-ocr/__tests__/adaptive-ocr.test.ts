import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdaptiveOcrSelector } from "../adaptive-selector";
import { deviceProfiler } from "../device-profiler";
import { ocrConfig } from "../config";

describe("AdaptiveOcrSelector", () => {
  let selector: AdaptiveOcrSelector;

  beforeEach(async () => {
    selector = new AdaptiveOcrSelector();
    deviceProfiler.setTierOverride(null);
    // Ensure rollout stage allows Tesseract for tests
    vi.spyOn(ocrConfig, 'rolloutStage', 'get').mockReturnValue(3);
    
    // Explicitly mock isSupported for providers to avoid environment-specific failures in tests
    const registryModule = await import('../provider-registry');
    const providers = registryModule.ocrProviderRegistry.getAllProviders();
    providers.forEach(p => {
      vi.spyOn(p, 'isSupported').mockResolvedValue(true);
    });
  });

  it("should recommend quality profile based on device tier", async () => {
    deviceProfiler.setTierOverride("high");
    expect(await selector.getRecommendedQuality()).toBe("quality");

    deviceProfiler.setTierOverride("medium");
    expect(await selector.getRecommendedQuality()).toBe("balanced");

    deviceProfiler.setTierOverride("low");
    expect(await selector.getRecommendedQuality()).toBe("eco");
  });

  it("should prioritize PDF text layer when available", async () => {
    const provider = await selector.selectBestProvider({ isPdf: true });
    expect(provider.id).toBe("pdf-text-layer");
  });

  it("should fallback to Tesseract for non-PDF or image-only", async () => {
    const provider = await selector.selectBestProvider({ isPdf: false });
    expect(provider.id).toBe("tesseract-wasm");
  });
});
