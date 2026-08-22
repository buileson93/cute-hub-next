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
/**
 * OCR Processing method
 */
export const OcrMethodSchema = z.enum(["text-layer", "ocr"]);
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
