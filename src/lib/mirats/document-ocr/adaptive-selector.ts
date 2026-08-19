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

    // 1. If it's a PDF, prioritize text layer (it's faster and more accurate for digital text)
    if (inputContext.isPdf && textLayerProvider) {
      return textLayerProvider;
    }

    // 2. If it's not a PDF (e.g., image) or Stage 2+ allows it, use Tesseract
    if (ocrConfig.rolloutStage >= 2 && tesseractProvider) {
      return tesseractProvider;
    }

    // Fallback if Tesseract isn't available or rollout stage is low
    if (textLayerProvider) return textLayerProvider;

    throw new Error("No suitable OCR provider found for this device");
  }
}

export const adaptiveOcrSelector = new AdaptiveOcrSelector();
