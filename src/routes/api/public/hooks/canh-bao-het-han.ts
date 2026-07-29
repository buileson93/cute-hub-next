import { createFileRoute } from "@tanstack/react-router";

/**
 * Task 40 — Cron hook: sinh cảnh báo hết hạn (bảo hành + giấy phép) qua RPC
 * idempotent `sinh_canh_bao_het_han()`. Ghi log vào `canh_bao_het_han_log`
 * (unique theo `khoa`) và tạo notifications cho người quản lý tài sản.
 *
 * POST /api/public/hooks/canh-bao-het-han
 * Xác thực bằng anon apikey (bypass edge auth, kiểm tra trong handler).
 * Song song với pg_cron `sinh-canh-bao-het-han-hang-ngay`, an toàn khi gọi
 * nhiều lần trong ngày — trùng khoá bị `ON CONFLICT DO NOTHING`.
 */
export const Route = createFileRoute("/api/public/hooks/canh-bao-het-han")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Xác thực bằng CRON_SECRET (server-only). Không dùng anon key
          // vì key này nhúng trong bundle client → bất kỳ ai cũng có.
          const expected = process.env.CRON_SECRET;
          const provided =
            request.headers.get("x-cron-secret") ??
            request.headers.get("X-Cron-Secret") ??
            "";
          if (!expected || provided !== expected) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          const { supabaseAdmin } = await import(
            "@/integrations/backend/admin.server"
          );
          const { data, error } = await supabaseAdmin.rpc(
            "sinh_canh_bao_het_han",
          );
          if (error) {
            console.error("[canh-bao-het-han] rpc error", error);
            return Response.json({ error: error.message }, { status: 500 });
          }
          return Response.json({ success: true, result: data });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[canh-bao-het-han]", msg);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
