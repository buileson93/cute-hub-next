import { isFeatureEnabled } from "../feature-flags";

/**
 * OCR Feature Flags & Configuration
 */
export const ocrConfig = {
  /**
   * Overall OCR feature toggle
   */
  get isEnabled() {
    return isFeatureEnabled("documentOcrEnabled");
  },

  /**
   * Client-side indexing (vector search prep) toggle
   */
  get isClientIndexEnabled() {
    return isFeatureEnabled("documentClientIndexEnabled");
  },

  /**
   * Toggle for testing new/unstable OCR providers
   */
  get isExperimentalProvidersEnabled() {
    return isFeatureEnabled("documentOcrExperimentalProvidersEnabled");
  },

  /**
   * Current rollout stage (1-5)
   */
  get rolloutStage() {
    const stage = parseInt(import.meta.env.VITE_OCR_ROLLOUT_STAGE || "1");
    return stage;
  },

  /**
   * Default language for OCR
   */
  defaultLanguage: "vie+eng",

  /**
   * Supported providers
   */
  providers: [
    { id: "pdf-text-layer", name: "PDF Text Layer", type: "client" },
    { id: "tesseract-wasm", name: "Tesseract WASM (Local)", type: "client" },
    { id: "google-cloud-vision", name: "Google Cloud Vision", type: "server" },
    { id: "azure-form-recognizer", name: "Azure AI Document Intelligence", type: "server" },
  ] as const,
};
