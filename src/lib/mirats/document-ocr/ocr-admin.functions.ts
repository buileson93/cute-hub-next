import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { UnprocessedPdfItem, OcrSourceType } from "./types";

export const getUnprocessedDocuments = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.string().optional(),
        sourceType: z.enum(["model_tai_lieu", "thiet_bi_tep_dinh_kem"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const results: UnprocessedPdfItem[] = [];

    if (!data.sourceType || data.sourceType === "model_tai_lieu") {
      const { data: models, error: mError } = await supabase
        .from("model_tai_lieu")
        .select(
          `
          id,
          file_name,
          kich_thuoc,
          created_at,
          dm_model(ma),
          tai_lieu_ocr(status, error_code, page_count, processed_pages)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (mError) throw mError;

      models.forEach((m) => {
        const ocr = Array.isArray(m.tai_lieu_ocr) ? m.tai_lieu_ocr[0] : (m.tai_lieu_ocr as any);
        const modelInfo = Array.isArray(m.dm_model) ? m.dm_model[0] : (m.dm_model as any);

        if (
          !ocr ||
          (data.status && ocr.status === data.status) ||
          (!data.status && ocr.status !== "completed")
        ) {
          results.push({
            source_type: "model_tai_lieu",
            source_id: m.id,
            file_name: m.file_name || "Unknown",
            file_size: m.kich_thuoc || 0,
            created_at: m.created_at,
            status: ocr?.status || "not_started",
            page_count: ocr?.page_count,
            processed_pages: ocr?.processed_pages,
            error_code: ocr?.error_code,
            model_ma: modelInfo?.ma,
          });
        }
      });
    }

    if (!data.sourceType || data.sourceType === "thiet_bi_tep_dinh_kem") {
      const { data: attachments, error: aError } = await supabase
        .from("thiet_bi_tep_dinh_kem")
        .select(
          `
          id,
          file_name,
          kich_thuoc,
          created_at,
          thiet_bi(ma_thiet_bi),
          tai_lieu_ocr(status, error_code, page_count, processed_pages)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (aError) throw aError;

      attachments.forEach((a) => {
        const ocr = Array.isArray(a.tai_lieu_ocr) ? a.tai_lieu_ocr[0] : (a.tai_lieu_ocr as any);
        const thietBiInfo = Array.isArray(a.thiet_bi) ? a.thiet_bi[0] : (a.thiet_bi as any);

        if (
          !ocr ||
          (data.status && ocr.status === data.status) ||
          (!data.status && ocr.status !== "completed")
        ) {
          results.push({
            source_type: "thiet_bi_tep_dinh_kem",
            source_id: a.id,
            file_name: a.file_name || "Unknown",
            file_size: a.kich_thuoc || 0,
            created_at: a.created_at,
            status: ocr?.status || "not_started",
            page_count: ocr?.page_count,
            processed_pages: ocr?.processed_pages,
            error_code: ocr?.error_code,
            thiet_bi_ma: thietBiInfo?.ma_thiet_bi,
          });
        }
      });
    }

    return results.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  });
