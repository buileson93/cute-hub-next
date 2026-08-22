import { artifactRepository } from "./artifact-repository";
import { OcrSourceType, OcrPageResult } from "./types";
import { ocrConfig } from "./config";
import { OcrArtifact } from "./artifact-types";

export interface ReuseResult {
  reused: boolean;
  artifact?: OcrArtifact;
  completedPages: Set<number>;
  message?: string;
}

/**
 * Handles the logic for reusing existing OCR artifacts
 */
export const artifactReuseManager = {
  /**
   * Attempts to find and link a reusable artifact
   */
  async attemptReuse(
    sourceType: OcrSourceType,
    sourceId: string,
    file: Blob,
    language: string = ocrConfig.defaultLanguage,
  ): Promise<ReuseResult> {
    try {
      // 1. Calculate hash
      const fileHash = await artifactRepository.calculateHash(file);

      // 2. Lookup compatible artifact
      // ocr_version is tied to the current pipeline/logic version
      const currentOcrVersion = "1.0.0";

      const artifact = await artifactRepository.findReusableArtifact(
        sourceType,
        sourceId,
        fileHash,
        currentOcrVersion,
        language,
      );

      if (!artifact) {
        return { reused: false, completedPages: new Set() };
      }

      const completedPages = new Set<number>();
      if (artifact.pages) {
        artifact.pages.forEach((p: OcrPageResult) => {
          if (p.rawText) completedPages.add(p.page);
        });
      }

      return {
        reused: artifact.status === "completed",
        artifact,
        completedPages,
        message:
          artifact.status === "completed"
            ? "Đã dùng kết quả OCR có sẵn từ hệ thống."
            : `Đã khôi phục ${completedPages.size} trang từ kết quả OCR trước đó.`,
      };
    } catch (error) {
      console.error("Artifact reuse failed:", error);
      return { reused: false, completedPages: new Set() };
    }
  },
};
