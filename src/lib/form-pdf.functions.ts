// ============================================================================
// form-pdf.functions.ts — Server function xuất PDF cho 1 submission.
//
// Trả về base64 để client tải xuống. Có tuỳ chọn ký ngay trước khi xuất.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { compileField, parseCompiledSchema, resolveSubmissionFields } from "@/lib/mirats/form-schema";
import { renderSubmissionPdf, type PdfInput, type PdfSignatureRow } from "@/lib/mirats/pdf-render.server";
import { signSubmission } from "@/lib/form-signing.functions";

const Input = z.object({
  submission_id: z.string().uuid(),
  sign_before_export: z.boolean().optional(),
  signer_role: z.enum(["nguoi_thuc_hien", "phu_trach", "admin"]).optional(),
});

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

export const exportSubmissionPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    if (data.sign_before_export) {
      await signSubmission({ data: { submission_id: data.submission_id, signer_role: data.signer_role ?? "phu_trach" } });
    }

    const supabase = context.supabase;

    const { data: sub, error: subErr } = await supabase
      .from("form_submission")
      .select("*, template:form_template(id,ten,thiet_bi_mode,require_signature), don_vi:dm_don_vi(ma,ten)")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (subErr || !sub) throw new Error("Không tìm thấy biên bản.");

    const { data: currentFields } = await supabase
      .from("form_field").select("*").eq("template_id", sub.template_id).order("position");

    let versionSchema = null;
    if (sub.template_version_id) {
      const { data: ver } = await supabase
        .from("form_template_version").select("compiled_schema").eq("id", sub.template_version_id).maybeSingle();
      versionSchema = parseCompiledSchema(ver?.compiled_schema);
    }
    const { fields } = resolveSubmissionFields({
      snapshot: parseCompiledSchema(sub.template_snapshot),
      versionSchema,
      currentFields: (currentFields ?? []).map((f, i) => compileField(f, i)),
    });

    const { data: sigs } = await supabase
      .from("form_submission_signature")
      .select("signer_name, signer_role, signed_at, content_hash, key_id")
      .eq("submission_id", data.submission_id)
      .order("signed_at", { ascending: true });

    const signatures: PdfSignatureRow[] = (sigs ?? []).map((s) => ({
      signer_name: s.signer_name,
      signer_role: s.signer_role,
      signed_at: s.signed_at,
      content_hash: s.content_hash,
      key_id: s.key_id,
    }));

    const input: PdfInput = {
      submission: {
        id: sub.id,
        template_code: sub.template_code,
        template_name: sub.template?.ten ?? sub.template_code,
        tieu_de: sub.tieu_de ?? null,
        ky_bao_cao: sub.ky_bao_cao ?? null,
        don_vi_ten: sub.don_vi?.ten ?? null,
        status: sub.status,
        submitted_at: sub.submitted_at ?? null,
        signed_at: sub.signed_at ?? null,
        content_hash: sub.content_hash ?? null,
        data: (sub.data ?? {}) as Record<string, unknown>,
      },
      fields,
      signatures,
      verifyBaseUrl: (process.env.APP_PUBLIC_URL ?? "https://vatm.app") + "/verify",
    };

    const pdfBytes = await renderSubmissionPdf(input);

    // Lưu vào bucket form-pdf để trang /verify có thể phát hành signed URL.
    let stored = false;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const key = `submissions/${sub.id}.pdf`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("form-pdf")
        .upload(key, pdfBytes, { contentType: "application/pdf", upsert: true });
      stored = !upErr;
    } catch { /* bucket có thể chưa cấu hình — vẫn trả PDF cho client */ }

    const base64 = bytesToB64(pdfBytes);
    const fileName = `bien-ban-${sub.template_code}-${sub.id.slice(0, 8)}.pdf`;
    return { base64, fileName, size: pdfBytes.length, signatures: signatures.length, stored };
  });
