import { OcrProvider, OcrProviderOptions } from "../provider";
import { OcrPageResult } from "../types";
import { DeviceCapabilities } from "../capabilities";

/**
 * TesseractProvider: Lazy-loaded WASM OCR Provider.
 */
export class TesseractProvider implements OcrProvider {
  readonly id = "tesseract-wasm";
  readonly label = "Tesseract (WASM)";
  private worker: any | null = null;
  private currentLang: string = "";

  async isSupported(capabilities: DeviceCapabilities): Promise<boolean> {
    // Tesseract.js works almost everywhere with WASM
    return typeof window !== 'undefined';
  }

  async warmup(options?: OcrProviderOptions): Promise<void> {
    const lang = options?.language || "vie+eng";
    if (this.worker && this.currentLang === lang) return;

    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    
    // Dynamic import to keep initial bundle light
    const { createWorker } = await import("tesseract.js");
    
    this.worker = await createWorker(lang, 1, {
      logger: (m: any) => {
        if (m.status === "recognizing" && options?.onProgress) {
          options.onProgress(m.progress);
        }
      },
      // CDN for worker and core to avoid local asset issues in some environments
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-wasm.js',
    });
    this.currentLang = lang;
  }

  async recognize(input: Blob | HTMLCanvasElement, options?: OcrProviderOptions): Promise<OcrPageResult> {
    await this.warmup(options);
    if (!this.worker) throw new Error("Tesseract worker failed to initialize");

    const { data: { text, confidence } } = await this.worker.recognize(input);

    return {
      page: 1, // Passed externally in pipeline
      method: "ocr",
      rawText: text,
      normalizedText: text.trim(),
      confidence: confidence / 100,
      providerId: this.id,
    };
  }

  async dispose(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (e) {
        console.warn("Error terminating Tesseract worker:", e);
      } finally {
        this.worker = null;
      }
    }
  }
}
