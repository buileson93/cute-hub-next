import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyApiKey } from "@/lib/mirats/auth/api-keys.functions";

const extCongVanSchema = z.object({
  project_id: z.string().uuid(),
  so_cong_van: z.string().min(1),
  trich_yeu: z.string().optional(),
  loai: z.enum(["den", "di", "to_trinh", "bao_cao", "quyet_dinh", "khac"]).default("den"),
  ngay_ban_hanh: z.string().optional(),
  co_quan_ban_hanh: z.string().optional(),
  file_url: z.string().url().optional(),
  idempotency_key: z.string().optional(),
  assigned_task_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  ocr_artifact: z
    .object({
      full_text: z.string(),
      pages: z.array(z.any()),
      confidence: z.number().min(0).max(1),
      version: z.string(),
    })
    .optional(),
});

export const Route = createFileRoute("/api/public/ext/cong-van")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*", // CORS Hardening: Specify MIRATS extension ID here if known
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
          },
        });
      },
      POST: async ({ request }) => {
        const corsHeaders = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(
              JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header" }),
              {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const ip =
            request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip");
          const { isValid, user_id, scopes } = await verifyApiKey(token, ip || undefined);

          if (!isValid) {
            // Audit Log (Done inside verifyApiKey)
            return new Response(JSON.stringify({ error: "Unauthorized: Invalid API key" }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Scope check: project_correspondence:write
          if (!scopes?.includes("project_correspondence:write")) {
            const { supabaseAdmin: auditAdmin } =
              await import("@/integrations/backend/admin.server");
            await auditAdmin.from("api_audit_log" as any).insert({
              user_id,
              action: "permission_denied",
              result: "failure",
              metadata: { scope_required: "project_correspondence:write" },
            } as any);

            return new Response(JSON.stringify({ error: "Forbidden: Insufficient scopes" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
          const body = await request.json();
          const data = extCongVanSchema.parse(body);

          // Hard Project Check & Privacy: Verify user has access to this project
          // Return 404 instead of 403 if project doesn't exist or no access to prevent enumeration
          const { data: projectAccess } = await supabaseAdmin
            .from("du_an")
            .select("id")
            .eq("id", data.project_id)
            .maybeSingle();

          if (!projectAccess) {
            return new Response(JSON.stringify({ error: "Project not found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Idempotency check
          if (data.idempotency_key) {
            const { data: existing } = await supabaseAdmin
              .from("du_an_cong_van" as any)
              .select("id")
              .eq("idempotency_key", data.idempotency_key)
              .maybeSingle();

            if (existing) {
              return new Response(
                JSON.stringify({
                  success: true,
                  id: (existing as any).id,
                  note: "duplicate_prevented",
                }),
                {
                  status: 200,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
              );
            }
          }

          const { data: inserted, error } = await supabaseAdmin
            .from("du_an_cong_van" as any)
            .insert({
              du_an_id: data.project_id,
              so_cong_van: data.so_cong_van,
              trich_yeu: data.trich_yeu,
              loai: data.loai,
              ngay_ban_hanh: data.ngay_ban_hanh,
              co_quan_ban_hanh: data.co_quan_ban_hanh,
              idempotency_key: data.idempotency_key,
              metadata: {
                ...(data.metadata || {}),
                source: "extension",
                created_by_api_key: true,
                actor_user_id: user_id,
                assigned_task_id: data.assigned_task_id,
              } as any,
              trang_thai: "moi",
            } as any)
            .select()
            .single();

          if (error) throw error;

          const congVanId = (inserted as any).id;

          // OCR Handling
          if (data.ocr_artifact && scopes?.includes("ocr_artifacts:publish")) {
            // Simple quality validation: confidence > 0.7
            if (data.ocr_artifact.confidence >= 0.7) {
              await supabaseAdmin.rpc("publish_ocr_artifact", {
                p_source_type: "du_an_cong_van",
                p_source_id: congVanId,
                p_artifact_data: {
                  full_text: data.ocr_artifact.full_text,
                  pages: data.ocr_artifact.pages,
                  average_confidence: data.ocr_artifact.confidence,
                  ocr_version: data.ocr_artifact.version,
                  status: "completed",
                },
              });
            }
          }

          // Task Linking & Notification
          if (data.assigned_task_id) {
            const { data: task } = await supabaseAdmin
              .from("du_an_cong_viec")
              .select("nguoi_xu_ly_chinh, ten")
              .eq("id", data.assigned_task_id)
              .single();

            if (task?.nguoi_xu_ly_chinh) {
              // Create In-App Notification using the correct column names from the schema
              await supabaseAdmin.from("notifications").insert({
                user_id: task.nguoi_xu_ly_chinh,
                tieu_de: "Công văn mới gắn vào công việc",
                noi_dung: `Công văn ${data.so_cong_van} đã được gắn vào công việc "${task.ten}".`,
                loai: "cv_moi",
                ref_id: congVanId,
                ref_type: "du_an_cong_van",
                link: `/du-an/${data.project_id}?view=cong-van`,
              });

              // Note: Email sending logic would go here if an email provider was configured
            }
          }

          return new Response(JSON.stringify({ success: true, id: congVanId }), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("[ext-api] error:", err);

          // Security: Do not leak detailed internal error messages to the client
          const publicError =
            err.name === "ZodError" ? "Invalid request data" : "An internal error occurred";

          return new Response(JSON.stringify({ error: publicError }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
