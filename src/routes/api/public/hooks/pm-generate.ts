import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyApiSecret, auditPublicApiCall } from "@/lib/api-security.server";

export const Route = createFileRoute("/api/public/hooks/pm-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const endpoint = "pm-generate";
        const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

        try {
          // 1. Bảo mật: Yêu cầu CRON_SECRET
          const { authorized, errorStatus } = await verifyApiSecret(request, "CRON_SECRET", "x-cron-secret");
          if (!authorized) {
            await auditPublicApiCall(endpoint, "unauthorized", { requestId, status: errorStatus });
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { 
              status: errorStatus || 401,
              headers: { "Content-Type": "application/json" }
            });
          }

          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!url || !key) {
            throw new Error("missing env");
          }

          const supabase = createClient(url, key, { auth: { persistSession: false } });
          const { data, error } = await supabase.rpc("pm_sinh_cong_viec", {});
          
          if (error) throw error;

          await auditPublicApiCall(endpoint, "success", { requestId, result: data });
          return Response.json({ ok: true, result: data });
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
