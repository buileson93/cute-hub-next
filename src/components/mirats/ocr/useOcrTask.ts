import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ocrPipeline } from "@/lib/mirats/document-ocr/pipeline";
import { ocrRepository } from "@/lib/mirats/document-ocr/repository";
import { OcrStatus, OcrSourceType, OcrPageResult } from "@/lib/mirats/document-ocr/types";
import { QualityProfile } from "@/lib/mirats/document-ocr/provider";
import { OcrArtifact } from "@/lib/mirats/document-ocr/artifact-types";

export function useOcrTask() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [isPaused, setIsPaused] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<OcrArtifact | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startOcr = useCallback(async (
    file: Blob, 
    sourceType: OcrSourceType, 
    sourceId: string, 
    options: { 
      quality?: QualityProfile | "auto", 
      language?: string,
      startPage?: number 
    } = {}
  ) => {
    setIsProcessing(true);
    setIsPaused(false);
    abortControllerRef.current = new AbortController();

    const { quality = "auto", language = "vie+eng", startPage = 1 } = options;
    
    const qualityProfile = quality === "auto" ? undefined : quality;

    try {
      setProgress({ current: startPage - 1, total: 0, status: "Đang khởi tạo..." });

      // Note: ocrPipeline.process now internally handles reuse and publishing
      const results = await ocrPipeline.process(sourceType, sourceId, file, {
        signal: abortControllerRef.current.signal,
        language,
        qualityProfile,
        startPage,
        onProgress: async (processed: number, total: number, currentResult: OcrPageResult) => {
          setProgress({ 
            current: processed, 
            total, 
            status: currentResult.method === 'ocr' 
              ? `Đang chạy OCR trang ${processed}...` 
              : `Đã trích xuất text trang ${processed}` 
          });

          // Update progress in database every page for resume support
          await ocrRepository.updateProgress(
            sourceType,
            sourceId,
            processed,
            processed === total ? 'completed' : 'ocr_running'
          );
        }
      });

      // Combine results and update final status
      const fullText = results.map(r => r.rawText).join('\n\n');
      const normalizedText = results.map(r => r.normalizedText || '').join('\n\n');
      
      await ocrRepository.upsertOcr(sourceType, sourceId, {
        status: "completed",
        processed_pages: results.length,
        full_text: fullText,
        normalized_text: normalizedText,
        pages: results
      });

      toast.success("Đã hoàn tất trích xuất nội dung!");
      return results;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info("Đã dừng trích xuất.");
        await ocrRepository.updateProgress(sourceType, sourceId, progress.current, 'cancelled');
      } else {
        console.error("OCR Error:", error);
        toast.error("Lỗi trích xuất: " + error.message);
        await ocrRepository.upsertOcr(sourceType, sourceId, {
          status: "failed",
          error_message: error.message
        });
      }
      throw error;
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [progress.current]);

  const pauseOcr = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsPaused(true);
    }
  }, []);

  const cancelOcr = useCallback(async (sourceType: OcrSourceType, sourceId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    await ocrRepository.updateProgress(sourceType, sourceId, progress.current, 'cancelled');
  }, [progress.current]);

  return {
    isProcessing,
    progress,
    isPaused,
    startOcr,
    pauseOcr,
    cancelOcr,
    setIsPaused,
    activeArtifact
  };
}

