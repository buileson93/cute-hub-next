import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron hook: gửi báo cáo độ tin cậy định kỳ qua Telegram.
 * POST /api/public/hooks/reliability-report
 * Header: x-cron-secret: <CRON_SECRET>
 * Body:   { "type": "weekly" | "monthly" }
 */
export const Route = createFileRoute("/api/public/hooks/reliability-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const expectedCron = process.env.CRON_SECRET;
          const expectedKey = process.env.SUPABASE_PUBLISHABLE_KEY;
          const providedCron =
            request.headers.get("x-cron-secret") ?? request.headers.get("X-Cron-Secret") ?? "";
          const providedKey = request.headers.get("apikey") ?? "";
          const okCron = !!expectedCron && providedCron === expectedCron;
          const okKey = !!expectedKey && providedKey === expectedKey;
          if (!okCron && !okKey) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          const body = (await request.json().catch(() => ({}))) as { type?: string };
          const type = body.type === "monthly" ? "monthly" : "weekly";
          const { runReliabilityReport } = await import("@/lib/reliability-report.server");
          const result = await runReliabilityReport(type);
          return Response.json({ success: true, type, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[reliability-report]", msg);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
