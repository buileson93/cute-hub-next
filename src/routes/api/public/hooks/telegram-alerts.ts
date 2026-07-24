import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron hook: quét CSDL và gửi cảnh báo qua Telegram.
 * POST /api/public/hooks/telegram-alerts
 * Header: x-cron-secret: <CRON_SECRET>
 */
export const Route = createFileRoute("/api/public/hooks/telegram-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const expected = process.env.CRON_SECRET;
          const provided =
            request.headers.get("x-cron-secret") ??
            request.headers.get("X-Cron-Secret") ??
            "";
          if (!expected || provided !== expected) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          const { runTelegramAlerts } = await import("@/lib/telegram-alerts.server");
          const result = await runTelegramAlerts();
          return Response.json({ success: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[telegram-alerts]", msg);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
