import { PdfExtractor } from "./pdf-extractor";
import { adaptiveOcrSelector } from "./adaptive-selector";
import { classifyPageText } from "./page-classifier";
import { preprocessImage, disposeCanvas } from "./preprocess";
import { normalizeViForSearch } from "./postprocess-vi";
import { OcrPageResult, OcrStatus, OcrSourceType } from "./types";
import { QUALITY_PROFILES } from "./provider";
import { isFeatureEnabled } from "../feature-flags";
import { artifactReuseManager } from "./artifact-reuse";
import { artifactRepository } from "./artifact-repository";
import { runtimeMetricsManager } from "./runtime-metrics";

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

  async process(
    sourceType: string,
    sourceId: string,
    file: Blob,
    options: PipelineOptions = {},
  ): Promise<OcrPageResult[]> {
    const { onProgress, signal, language = "vie+eng" } = options;

    // Safety check for feature flag
    if (!isFeatureEnabled("documentOcrEnabled")) {
      console.log("OCR is disabled via feature flag.");
      return [];
    }

    // 1. Attempt Reuse
    const reuse = await artifactReuseManager.attemptReuse(
      sourceType as OcrSourceType,
      sourceId,
      file,
      language,
    );

    if (reuse.reused && reuse.artifact) {
      console.log("Using cached OCR result from Supabase.");
      return reuse.artifact.pages || [];
    }

    const results: OcrPageResult[] = reuse.artifact?.pages || [];

    try {
      const totalPages = await this.extractor.load(file);

      // Choose quality profile based on device
      const qualityProfile =
        options.qualityProfile || (await adaptiveOcrSelector.getRecommendedQuality());
      const config =
        QUALITY_PROFILES[qualityProfile as keyof typeof QUALITY_PROFILES] ||
        QUALITY_PROFILES.balanced;

      const startPage = options.startPage || 1;

      for (let i = startPage; i <= totalPages; i++) {
        if (signal?.aborted) break;

        // Skip pages already in reuse artifact
        if (reuse.completedPages.has(i)) continue;

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
            durationMs: Date.now() - startTime,
          };
        } else {
          // 2. Perform OCR
          const canvas = document.createElement("canvas");
          try {
            await pageData.render(canvas, config.dpi);

            if (config.preprocessing) {
              preprocessImage(canvas);
            }

            const provider = await adaptiveOcrSelector.selectBestProvider({ isPdf: true });

            // Re-check rollout logic
            const actualOcrProvider =
              provider.id === "pdf-text-layer"
                ? null // Should not happen if classification says needsOcr
                : provider;

            if (!actualOcrProvider || actualOcrProvider.id === "pdf-text-layer") {
              finalResult = {
                page: i,
                method: "text-layer",
                rawText: pageData.text,
                confidence: 0.5,
                providerId: "pdf-native-text-fallback",
                durationMs: Date.now() - startTime,
              };
            } else {
              const ocrResult = await actualOcrProvider.recognize(canvas, {
                language,
                signal,
                dpi: config.dpi,
              });

              finalResult = {
                ...ocrResult,
                page: i,
                durationMs: Date.now() - startTime,
              };

              // Report runtime metrics for collective intelligence
              runtimeMetricsManager.capturePageMetric(finalResult, qualityProfile as any);
            }
          } finally {
            disposeCanvas(canvas);
          }
        }

        // 3. Post-processing
        finalResult.normalizedText = normalizeViForSearch(finalResult.rawText);

        // Merge with existing partial results
        const existingIdx = results.findIndex((r) => r.page === i);
        if (existingIdx >= 0) {
          results[existingIdx] = finalResult;
        } else {
          results.push(finalResult);
        }

        if (options.onPageCompleted) {
          options.onPageCompleted(i, finalResult);
        }

        if (onProgress) {
          onProgress(i, totalPages, finalResult);
        }
      }

      // Sort results by page number
      results.sort((a, b) => a.page - b.page);

      // 4. Publish artifact if completed
      const isComplete = results.length >= totalPages && results.every((r) => !!r.rawText);
      if (isComplete) {
        const fileHash = await artifactRepository.calculateHash(file);
        const fullText = results.map((r) => r.rawText).join("\n");
        const avgConfidence = results.reduce((acc, r) => acc + r.confidence, 0) / results.length;

        artifactRepository.publishArtifact(sourceType as OcrSourceType, sourceId, {
          file_hash: fileHash,
          ocr_version: "1.0.0",
          language,
          provider_id: results[0]?.providerId || "unknown",
          provider_version: "1.0.0",
          preprocessing_profile: qualityProfile,
          page_count: totalPages,
          pages: results,
          full_text: fullText,
          normalized_text: normalizeViForSearch(fullText),
          average_confidence: avgConfidence,
          status: "completed",
          quality_score: avgConfidence, // Simple score for now
        });
      }
    } finally {
      await this.extractor.close();
    }

    return results;
  }
}

export const ocrPipeline = new OcrPipeline();
