import { createFileRoute } from "@tanstack/react-router";
import { verifyApiSecret, auditPublicApiCall } from "@/lib/api-security.server";

export const Route = createFileRoute("/api/public/hooks/reliability-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const endpoint = "reliability-report";
        const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

        try {
          // 1. Bảo mật: Yêu cầu CRON_SECRET (bỏ apikey fallback)
          const { authorized, errorStatus } = await verifyApiSecret(request, "CRON_SECRET", "x-cron-secret");
          if (!authorized) {
            await auditPublicApiCall(endpoint, "unauthorized", { requestId, status: errorStatus });
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
              status: errorStatus || 401,
              headers: { "Content-Type": "application/json" }
            });
          }

          const body = (await request.json().catch(() => ({}))) as { type?: string };
          const type = body.type === "monthly" ? "monthly" : "weekly";
          
          const { runReliabilityReport } = await import("@/lib/reliability-report.server");
          const result = await runReliabilityReport(type);

          await auditPublicApiCall(endpoint, "success", { requestId, type });
          return Response.json({ success: true, type, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[${endpoint}]`, msg);
          await auditPublicApiCall(endpoint, "error", { requestId, error: msg });
          return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
