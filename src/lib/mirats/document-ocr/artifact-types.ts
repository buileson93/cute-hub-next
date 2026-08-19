import { z } from "zod";
import { OcrPageResultSchema, OcrSourceType, OcrStatusSchema } from "./types";

/**
 * OCR Artifact Schema (Supabase)
 */
export const OcrArtifactSchema = z.object({
  id: z.string().uuid(),
  file_hash: z.string(),
  ocr_version: z.string(),
  language: z.string(),
  provider_id: z.string(),
  provider_version: z.string(),
  model_id: z.string().nullable(),
  model_checksum: z.string().nullable(),
  preprocessing_profile: z.string(),
  page_count: z.number().int().nullable(),
  pages: z.array(OcrPageResultSchema),
  full_text: z.string().nullable(),
  normalized_text: z.string().nullable(),
  average_confidence: z.number().nullable(),
  technical_token_accuracy: z.number().nullable(),
  quality_score: z.number().nullable(),
  status: z.enum(['completed', 'partial', 'rejected', 'superseded']),
  verified_level: z.enum(['automatic', 'sampled', 'human_reviewed']),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export type OcrArtifact = z.infer<typeof OcrArtifactSchema>;

/**
 * OCR Runtime Metric Schema
 */
export const OcrRuntimeMetricSchema = z.object({
  profile_bucket: z.string(),
  provider_id: z.string(),
  provider_version: z.string(),
  model_checksum: z.string().optional(),
  quality_profile: z.string(),
  page_class: z.string().optional(),
  duration_ms: z.number(),
  confidence: z.number(),
});

export type OcrRuntimeMetric = z.infer<typeof OcrRuntimeMetricSchema>;
