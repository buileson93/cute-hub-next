import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { UnprocessedPdfItem, OcrSourceType } from "./types";

export const getUnprocessedDocuments = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    limit: z.number().default(50),
    offset: z.number().default(0),
    status: z.string().optional(),
    sourceType: z.enum(["model_tai_lieu", "thiet_bi_tep_dinh_kem"]).optional()
  }).parse(data))
  .handler(async ({ data }) => {
    // This is complex because we need to join model_tai_lieu/thiet_bi_tep_dinh_kem 
    // with tai_lieu_ocr and find those missing or failed.
    // For now, we'll implement it as two queries and merge since we're on client-side anyway
    // but the server function helps with data volume and RBAC (eventually).
    
    const results: UnprocessedPdfItem[] = [];

    if (!data.sourceType || data.sourceType === "model_tai_lieu") {
      const { data: models, error: mError } = await supabase
        .from("model_tai_lieu")
        .select(`
          id,
          ten_file,
          created_at,
          model:ma,
          ocr:tai_lieu_ocr(status, error_code, page_count, processed_pages)
        `)
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (mError) throw mError;

      models.forEach(m => {
        const ocr = Array.isArray(m.ocr) ? m.ocr[0] : m.ocr;
        if (!ocr || (data.status && ocr.status === data.status) || (!data.status && ocr.status !== "completed")) {
          results.push({
            source_type: "model_tai_lieu",
            source_id: m.id,
            file_name: m.ten_file || "Unknown",
            created_at: m.created_at,
            status: ocr?.status || "not_started",
            page_count: ocr?.page_count,
            processed_pages: ocr?.processed_pages,
            error_code: ocr?.error_code,
            model_ma: (m.model as any)?.ma
          });
        }
      });
    }

    if (!data.sourceType || data.sourceType === "thiet_bi_tep_dinh_kem") {
      const { data: attachments, error: aError } = await supabase
        .from("thiet_bi_tep_dinh_kem")
        .select(`
          id,
          ten_file,
          created_at,
          thiet_bi:ma_thiet_bi,
          ocr:tai_lieu_ocr(status, error_code, page_count, processed_pages)
        `)
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (aError) throw aError;

      attachments.forEach(a => {
        const ocr = Array.isArray(a.ocr) ? a.ocr[0] : a.ocr;
        if (!ocr || (data.status && ocr.status === data.status) || (!data.status && ocr.status !== "completed")) {
          results.push({
            source_type: "thiet_bi_tep_dinh_kem",
            source_id: a.id,
            file_name: a.ten_file || "Unknown",
            created_at: a.created_at,
            status: ocr?.status || "not_started",
            page_count: ocr?.page_count,
            processed_pages: ocr?.processed_pages,
            error_code: ocr?.error_code,
            thiet_bi_ma: (a.thiet_bi as any)?.ma_thiet_bi
          });
        }
      });
    }

    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
