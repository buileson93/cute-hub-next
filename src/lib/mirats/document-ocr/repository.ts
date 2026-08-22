import { supabase } from "../../../integrations/supabase/client";
import {
  TaiLieuOcr,
  OcrSourceType,
  UpsertTaiLieuOcr,
  OcrStatus,
  OcrStats,
  UnprocessedPdfItem,
} from "./types";

/**
 * OCR Repository for MIRATS documents
 */
export const ocrRepository = {
  /**
   * Get OCR result for a specific document
   */
  async getOcrResult(sourceType: OcrSourceType, sourceId: string): Promise<TaiLieuOcr | null> {
    const { data, error } = await supabase
      .from("tai_lieu_ocr")
      .select("*")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching OCR result:", error);
      throw error;
    }

    return data as unknown as TaiLieuOcr;
  },

  /**
   * Upsert an OCR record (create if not exists, update if exists)
   */
  async upsertOcr(
    sourceType: OcrSourceType,
    sourceId: string,
    data: UpsertTaiLieuOcr,
  ): Promise<TaiLieuOcr> {
    const { data: result, error } = await supabase
      .from("tai_lieu_ocr")
      .upsert(
        {
          source_type: sourceType,
          source_id: sourceId,
          ...data,
        },
        {
          onConflict: "source_type, source_id",
        },
      )
      .select("*")
      .single();

    if (error) {
      console.error("Error upserting OCR record:", error);
      throw error;
    }

    return result as unknown as TaiLieuOcr;
  },

  /**
   * Mark OCR as pending/queued
   */
  async queueOcr(
    sourceType: OcrSourceType,
    sourceId: string,
    fileHash: string,
  ): Promise<TaiLieuOcr> {
    return this.upsertOcr(sourceType, sourceId, {
      status: "queued",
      file_hash: fileHash,
      error_code: null,
      error_message: null,
    });
  },

  /**
   * Update OCR progress
   */
  async updateProgress(
    sourceType: OcrSourceType,
    sourceId: string,
    processedPages: number,
    status: OcrStatus = "ocr_running",
  ): Promise<void> {
    const { error } = await supabase
      .from("tai_lieu_ocr")
      .update({
        processed_pages: processedPages,
        status: status,
      })
      .eq("source_type", sourceType)
      .eq("source_id", sourceId);

    if (error) throw error;
  },

  /**
   * Delete OCR record (usually handled by cascade but available for manual invalidation)
   */
  async deleteOcr(sourceType: OcrSourceType, sourceId: string): Promise<void> {
    const { error } = await supabase
      .from("tai_lieu_ocr")
      .delete()
      .eq("source_type", sourceType)
      .eq("source_id", sourceId);

    if (error) throw error;
  },

  /**
   * Find existing successful OCR result by file hash
   */
  async findExisting(fileHash: string): Promise<TaiLieuOcr | null> {
    const { data, error } = await supabase
      .from("tai_lieu_ocr")
      .select("*")
      .eq("file_hash", fileHash)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error finding existing OCR:", error);
      return null;
    }
    return data as unknown as TaiLieuOcr;
  },

  /**
   * Get OCR health statistics
   */
  async getOcrStats(): Promise<OcrStats> {
    const { data, error } = await supabase
      .from("tai_lieu_ocr")
      .select("status, page_count, processed_pages");

    if (error) throw error;

    const stats: OcrStats = {
      totalDocs: data.length,
      completed: 0,
      partial: 0,
      failed: 0,
      pending: 0,
      totalPageCount: 0,
      totalProcessedPages: 0,
    };

    data.forEach((row) => {
      if (row.status === "completed") stats.completed++;
      else if (row.status === "partial") stats.partial++;
      else if (row.status === "failed") stats.failed++;
      else stats.pending++;

      stats.totalPageCount += row.page_count || 0;
      stats.totalProcessedPages += row.processed_pages || 0;
    });

    return stats;
  },
};
