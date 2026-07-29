import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/r2-cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: apikey header phải khớp SUPABASE anon (đủ để chống truy cập tình cờ)
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey || !expected || apiKey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
        const { r2Delete, r2MultipartAbort } = await import("@/lib/mirats/r2.server");

        // Lấy các file temp quá hạn
        const { data: expired, error } = await supabaseAdmin
          .from("r2_file")
          .select("key, meta")
          .eq("status", "temp")
          .lt("expires_at", new Date().toISOString())
          .limit(500);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        let deleted = 0, aborted = 0, failed = 0;
        for (const row of expired ?? []) {
          try {
            const uploadId = (row.meta as any)?.uploadId;
            if (uploadId) { try { await r2MultipartAbort(row.key, uploadId); aborted++; } catch {} }
            try { await r2Delete(row.key); } catch {}
            await supabaseAdmin.from("r2_file").delete().eq("key", row.key);
            deleted++;
          } catch { failed++; }
        }

        // Dọn log > 90 ngày
        await supabaseAdmin.from("r2_access_log")
          .delete()
          .lt("created_at", new Date(Date.now() - 90*24*3600*1000).toISOString());

        return Response.json({ ok: true, deleted, aborted, failed, checked: expired?.length ?? 0 });
      },
    },
  },
});
