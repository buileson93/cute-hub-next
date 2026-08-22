import { supabase } from "@/integrations/supabase/client";
import { OcrSourceType } from "./types";
import { OcrArtifact, OcrRuntimeMetric } from "./artifact-types";

/**
 * Artifact Repository: Handles shared OCR results and metrics via RPCs
 */
export const artifactRepository = {
  /**
   * Calculate SHA-256 hash of a file
   */
  async calculateHash(file: Blob): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  /**
   * Find a reusable artifact for a document
   */
  async findReusableArtifact(
    sourceType: OcrSourceType,
    sourceId: string,
    fileHash: string,
    ocrVersion: string,
    language: string,
  ): Promise<OcrArtifact | null> {
    const { data, error } = await supabase.rpc("find_reusable_ocr_artifact", {
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_file_hash: fileHash,
      p_ocr_version: ocrVersion,
      p_language: language,
    });

    if (error) {
      console.error("Error finding reusable artifact:", error);
      return null;
    }

    if (!data || data.length === 0) return null;

    // find_reusable_ocr_artifact returns SETOF ocr_artifact, RPC returns array
    return data[0] as OcrArtifact;
  },

  /**
   * Publish an artifact produced by the client
   */
  async publishArtifact(
    sourceType: OcrSourceType,
    sourceId: string,
    artifactData: Partial<OcrArtifact>,
  ): Promise<string | null> {
    const { data, error } = await supabase.rpc("publish_ocr_artifact", {
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_artifact_data: artifactData,
    });

    if (error) {
      console.error("Error publishing artifact:", error);
      return null;
    }

    return data as string;
  },

  /**
   * Report runtime metrics back to the collective intelligence
   */
  async reportMetric(metric: OcrRuntimeMetric): Promise<void> {
    const { error } = await supabase.rpc("report_ocr_runtime_metric", {
      p_metric_data: metric,
    });

    if (error) {
      console.warn("Error reporting OCR runtime metric:", error);
    }
  },
};
