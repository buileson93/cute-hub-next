import { z } from "zod";

/**
 * OCR Status states
 */
export const OcrStatusSchema = z.enum([
  "queued",
  "extracting",
  "ocr_running",
  "completed",
  "partial",
  "failed",
  "cancelled",
]);

export type OcrStatus = z.infer<typeof OcrStatusSchema>;

/**
 * OCR Processing method
 */
export const OcrMethodSchema = z.enum(["text-layer", "ocr"]);
export type OcrMethod = z.infer<typeof OcrMethodSchema>;

/**
 * Individual page result
 */
export const OcrPageResultSchema = z.object({
  page: z.number().int().min(1),
  method: OcrMethodSchema,
  providerId: z.string().optional(),
  rawText: z.string(),
  normalizedText: z.string().optional(),
  confidence: z.number().min(0).max(1),
  durationMs: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
});

export type OcrPageResult = z.infer<typeof OcrPageResultSchema>;

/**
 * Document source types supported by OCR
 */
export type OcrSourceType = "model_tai_lieu" | "thiet_bi_tep_dinh_kem";

/**
 * Main OCR record interface
 */
export interface TaiLieuOcr {
  id: string;
  source_type: OcrSourceType;
  source_id: string;
  file_hash: string | null;
  status: OcrStatus;
  page_count: number | null;
  processed_pages: number;
  full_text: string | null;
  normalized_text: string | null;
  pages: OcrPageResult[];
  language: string;
  average_confidence: number | null;
  provider_id: string | null;
  quality_profile: string | null;
  ocr_version: string | null;
  error_code: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * DTO for creating/updating OCR records
 */
export type UpsertTaiLieuOcr = Partial<Omit<TaiLieuOcr, "id" | "created_at" | "updated_at">>;
