import { OcrProvider, OcrProviderOptions } from "../provider";
import { OcrPageResult } from "../types";
import { DeviceCapabilities } from "../capabilities";
// Lazy import Tesseract to keep initial bundle small
// import { createWorker, Worker } from "tesseract.js";
type TesseractWorker = any;

export class TesseractProvider implements OcrProvider {
  readonly id = "tesseract-wasm";
  readonly label = "Tesseract (WASM)";
  private worker: Worker | null = null;
  private currentLang: string = "";

  async isSupported(capabilities: DeviceCapabilities): Promise<boolean> {
    // Tesseract.js works almost everywhere with WASM
    return true;
  }

  async warmup(options?: OcrProviderOptions): Promise<void> {
    const lang = options?.language || "vie+eng";
    if (this.worker && this.currentLang === lang) return;

    if (this.worker) await this.worker.terminate();
    
    this.worker = await createWorker(lang, 1, {
      logger: m => {
        if (m.status === "recognizing" && options?.onProgress) {
          options.onProgress(m.progress);
        }
      },
      // Cache settings can be added here
    });
    this.currentLang = lang;
  }

  async recognize(input: Blob | HTMLCanvasElement, options?: OcrProviderOptions): Promise<OcrPageResult> {
    await this.warmup(options);
    if (!this.worker) throw new Error("Tesseract worker failed to initialize");

    const { data: { text, confidence } } = await this.worker.recognize(input);

    return {
      page: 1, // Passed externally
      method: "ocr",
      rawText: text,
      normalizedText: text.trim(),
      confidence: confidence / 100,
      providerId: this.id,
    };
  }

  async dispose(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
