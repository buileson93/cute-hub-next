// Cron hook: sinh công việc PM đến hạn hằng ngày.
// pg_cron gọi endpoint này (public prefix) — hàm RPC vẫn xác thực nội bộ.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/hooks/pm-generate")({
  server: {
    handlers: {
      POST: async () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
          return new Response(JSON.stringify({ ok: false, error: "missing env" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        const supabase = createClient(url, key, { auth: { persistSession: false } });
        const { data, error } = await supabase.rpc("pm_sinh_cong_viec", {});
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ ok: true, result: data });
      },
    },
  },
});
