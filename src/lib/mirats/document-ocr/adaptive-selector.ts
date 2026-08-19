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
    
    const textLayerProvider = providers.find(p => p.id === "pdf-text-layer");
    const tesseractProvider = providers.find(p => p.id === "tesseract-wasm");

    // Stage 1: Text-layer extraction only
    if (ocrConfig.rolloutStage <= 1) {
      if (textLayerProvider) return textLayerProvider;
    }

    // 1. Always check PDF text layer first if it's a PDF
    if (inputContext.isPdf && textLayerProvider) {
      return textLayerProvider;
    }

    // Stage 2+: Enable Tesseract for test group / specific devices
    // Stage 3+: Full adaptive selection
    if (ocrConfig.rolloutStage >= 2 && tesseractProvider) {
      return tesseractProvider;
    }

    if (textLayerProvider) return textLayerProvider;

    throw new Error("No suitable OCR provider found for this device");
  }
}

export const adaptiveOcrSelector = new AdaptiveOcrSelector();
