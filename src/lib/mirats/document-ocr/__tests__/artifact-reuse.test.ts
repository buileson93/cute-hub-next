import { describe, it, expect, beforeEach, vi } from "vitest";
import { artifactReuseManager } from "../artifact-reuse";
import { artifactRepository } from "../artifact-repository";
import { OcrSourceType } from "../types";

describe("ArtifactReuseManager", () => {
  const mockFile = new Blob(["test-pdf-content"], { type: "application/pdf" });
  const mockHash = "test-hash-123";
  const sourceType: OcrSourceType = "model_tai_lieu";
  const sourceId = "test-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(artifactRepository, "calculateHash").mockResolvedValue(mockHash);
  });

  it("should return reused: true when a completed artifact exists", async () => {
    vi.spyOn(artifactRepository, "findReusableArtifact").mockResolvedValue({
      id: "artifact-uuid",
      file_hash: mockHash,
      status: "completed",
      pages: [{ page: 1, rawText: "Page 1 content", confidence: 0.9, method: "ocr", providerId: "tesseract" }],
      ocr_version: "1.0.0",
      language: "vie+eng",
    } as any);

    const result = await artifactReuseManager.attemptReuse(sourceType, sourceId, mockFile);

    expect(result.reused).toBe(true);
    expect(result.completedPages.has(1)).toBe(true);
    expect(result.artifact?.id).toBe("artifact-uuid");
  });

  it("should return reused: false when no artifact exists", async () => {
    vi.spyOn(artifactRepository, "findReusableArtifact").mockResolvedValue(null);

    const result = await artifactReuseManager.attemptReuse(sourceType, sourceId, mockFile);

    expect(result.reused).toBe(false);
    expect(result.completedPages.size).toBe(0);
  });

  it("should handle partial artifacts correctly", async () => {
    vi.spyOn(artifactRepository, "findReusableArtifact").mockResolvedValue({
      id: "partial-uuid",
      file_hash: mockHash,
      status: "partial",
      pages: [{ page: 1, rawText: "Page 1", confidence: 0.8, method: "ocr", providerId: "tesseract" }],
    } as any);

    const result = await artifactReuseManager.attemptReuse(sourceType, sourceId, mockFile);

    expect(result.reused).toBe(false); // Pipeline should continue for missing pages
    expect(result.completedPages.has(1)).toBe(true);
  });
});
