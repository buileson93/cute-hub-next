import { createFileRoute } from "@tanstack/react-router";
import { verifyApiSecret, auditPublicApiCall } from "@/lib/api-security.server";

export const Route = createFileRoute("/api/public/hooks/r2-cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const endpoint = "r2-cleanup";
        const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

        try {
          // 1. Bảo mật: Yêu cầu CRON_SECRET (không dùng apikey/anon key nữa)
          const { authorized, errorStatus } = await verifyApiSecret(request, "CRON_SECRET", "x-cron-secret");
          if (!authorized) {
            await auditPublicApiCall(endpoint, "unauthorized", { requestId, status: errorStatus });
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
              status: errorStatus || 401,
              headers: { "Content-Type": "application/json" }
            });
          }

          const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
          const { r2Delete, r2MultipartAbort } = await import("@/lib/mirats/r2.server");

          const { data: expired, error } = await supabaseAdmin
            .from("r2_file")
            .select("key, meta")
            .eq("status", "temp")
            .lt("expires_at", new Date().toISOString())
            .limit(500);
          
          if (error) throw error;

          let deleted = 0, aborted = 0, failed = 0;
          for (const row of expired ?? []) {
            try {
              const uploadId = (row.meta as any)?.uploadId;
              if (uploadId) {
                try {
                  await r2MultipartAbort(row.key, uploadId);
                  aborted++;
                } catch {}
              }
              try {
                await r2Delete(row.key);
              } catch {}
              await supabaseAdmin.from("r2_file").delete().eq("key", row.key);
              deleted++;
            } catch {
              failed++;
            }
          }

          await supabaseAdmin.from("r2_access_log").delete().lt("created_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString());

          await auditPublicApiCall(endpoint, "success", { requestId, deleted, aborted, failed });
          return Response.json({ ok: true, deleted, aborted, failed, checked: expired?.length ?? 0 });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[${endpoint}]`, msg);
          await auditPublicApiCall(endpoint, "error", { requestId, error: msg });
          return new Response(JSON.stringify({ ok: false, error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
