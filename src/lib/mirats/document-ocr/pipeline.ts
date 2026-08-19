import { PdfExtractor } from "./pdf-extractor";
import { adaptiveOcrSelector } from "./adaptive-selector";
import { classifyPageText } from "./page-classifier";
import { preprocessImage, disposeCanvas } from "./preprocess";
import { normalizeViForSearch, getCorrectedText } from "./postprocess-vi";
import { OcrPageResult, TaiLieuOcr, OcrStatus } from "./types";
import { QUALITY_PROFILES } from "./provider";

export interface PipelineOptions {
  onProgress?: (processed: number, total: number, currentPageResult: OcrPageResult) => void;
  onPageCompleted?: (page: number, result: OcrPageResult) => void;
  signal?: AbortSignal;
  language?: string;
  qualityProfile?: string;
  startPage?: number; 
}


/**
 * The main OCR Pipeline for Vietnamese PDF documents.
 */
export class OcrPipeline {
  private extractor = new PdfExtractor();

  async process(sourceType: string, sourceId: string, file: Blob, options: PipelineOptions = {}): Promise<OcrPageResult[]> {
    const { onProgress, signal, language = "vie+eng" } = options;
    
    const totalPages = await this.extractor.load(file);
    const results: OcrPageResult[] = [];
    
    // Choose quality profile based on device
    const qualityProfile = options.qualityProfile || await adaptiveOcrSelector.getRecommendedQuality();
    const config = QUALITY_PROFILES[qualityProfile as keyof typeof QUALITY_PROFILES] || QUALITY_PROFILES.balanced;
    
    const startPage = options.startPage || 1;

    
    for (let i = startPage; i <= totalPages; i++) {
      if (signal?.aborted) break;

      const startTime = Date.now();
      const pageData = await this.extractor.getPage(i);
      
      // 1. Try Native Text Layer
      const classification = classifyPageText(pageData.text);
      
      let finalResult: OcrPageResult;
      
      if (!classification.needsOcr) {
        finalResult = {
          page: i,
          method: "text-layer",
          rawText: pageData.text,
          confidence: 1.0,
          providerId: "pdf-native-text",
          durationMs: Date.now() - startTime
        };
      } else {
        // 2. Perform OCR
        const canvas = document.createElement("canvas");
        await pageData.render(canvas, config.dpi);
        
        // Optional Preprocessing
        if (config.preprocessing) {
          preprocessImage(canvas);
        }
        
        const provider = await adaptiveOcrSelector.selectBestProvider({ isPdf: true });
        
        // Skip pdf-text-layer here since we already tried it
        const actualOcrProvider = provider.id === 'pdf-text-layer' 
          ? await (async () => {
              const providers = await (import('./provider-registry').then(m => m.ocrProviderRegistry.getAllProviders()));
              return providers.find((p: any) => p.id === 'tesseract-wasm')!;
            })()
          : provider;

        const ocrResult = await actualOcrProvider.recognize(canvas, {
          language,
          signal,
          dpi: config.dpi
        });
        
        finalResult = {
          ...ocrResult,
          page: i,
          durationMs: Date.now() - startTime
        };
        
        disposeCanvas(canvas);
      }
      
      // 3. Post-processing
      finalResult.normalizedText = normalizeViForSearch(finalResult.rawText);
      // We could add correctedText here if needed
      
      results.push(finalResult);
      
      if (options.onPageCompleted) {
        options.onPageCompleted(i, finalResult);
      }
      
      if (onProgress) {
        onProgress(i, totalPages, finalResult);
      }

    }
    
    await this.extractor.close();
    return results;
  }
}

export const ocrPipeline = new OcrPipeline();
