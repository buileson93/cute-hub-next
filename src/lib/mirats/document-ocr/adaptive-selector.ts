import { DeviceProfile, deviceProfiler } from "./device-profiler";
import { QualityProfile, QUALITY_PROFILES } from "./provider";
import { OcrProvider } from "./provider";
import { ocrProviderRegistry } from "./provider-registry";
import { ocrConfig } from "./config";

export class AdaptiveOcrSelector {
  async getRecommendedQuality(): Promise<QualityProfile> {
    const profile = await deviceProfiler.getProfile();
    
    if (profile.tier === "high") return "quality";
    if (profile.tier === "medium") return "balanced";
    return "eco";
  }

  async selectBestProvider(inputContext: { isPdf: boolean }): Promise<OcrProvider> {
    const profile = await deviceProfiler.getProfile();
    const providers = await ocrProviderRegistry.getSupportedProviders(profile.capabilities);

    // 1. Always check PDF text layer first if it's a PDF
    if (inputContext.isPdf) {
      const pdfProvider = providers.find(p => p.id === "pdf-text-layer");
      if (pdfProvider) return pdfProvider;
    }

    // 2. Experimental / High-end providers detection logic would go here
    // Example: if (profile.tier === 'high' && profile.capabilities.hasWebGPU) ...

    // 3. Fallback to Tesseract
    const fallback = providers.find(p => p.id === "tesseract-wasm");
    if (fallback) return fallback;

    throw new Error("No suitable OCR provider found for this device");
  }
}

export const adaptiveOcrSelector = new AdaptiveOcrSelector();
