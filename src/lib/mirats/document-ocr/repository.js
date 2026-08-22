import { supabase } from "../../../integrations/supabase/client";
/**
 * OCR Repository for MIRATS documents
 */
export const ocrRepository = {
  /**
   * Get OCR result for a specific document
   */
  async getOcrResult(sourceType, sourceId) {
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
    return data;
  },
  /**
   * Upsert an OCR record (create if not exists, update if exists)
   */
  async upsertOcr(sourceType, sourceId, data) {
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
    return result;
  },
  /**
   * Mark OCR as pending/queued
   */
  async queueOcr(sourceType, sourceId, fileHash) {
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
  async updateProgress(sourceType, sourceId, processedPages, status = "ocr_running") {
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
  async deleteOcr(sourceType, sourceId) {
    const { error } = await supabase
      .from("tai_lieu_ocr")
      .delete()
      .eq("source_type", sourceType)
      .eq("source_id", sourceId);
    if (error) throw error;
  },
};
