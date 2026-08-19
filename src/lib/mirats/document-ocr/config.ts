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
   * Default language for OCR
   */
  defaultLanguage: "vie+eng",

  /**
   * Supported providers (placeholders for now)
   */
  providers: [
    { id: "tesseract-wasm", name: "Tesseract WASM (Local)", type: "client" },
    { id: "google-cloud-vision", name: "Google Cloud Vision", type: "server" },
    { id: "azure-form-recognizer", name: "Azure AI Document Intelligence", type: "server" },
  ] as const,
};
