import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

/**
 * Sao lưu CSDL tự động (gọi bởi pg_cron hằng ngày).
 * POST /api/public/hooks/daily-backup
 * headers: { "x-backup-secret": <BACKUP_CRON_SECRET> }
 *
 * Bảo mật: bắt buộc header khớp secret server-only (so sánh constant-time).
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const Route = createFileRoute("/api/public/hooks/daily-backup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const expected = process.env.BACKUP_CRON_SECRET;
          if (!expected) return Response.json({ error: "Not configured" }, { status: 404 });

          const provided = request.headers.get("x-backup-secret") ?? "";
          if (!safeEqual(provided, expected)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { performBackup } = await import("@/lib/backup.server");

          // đích: luôn có bộ nhớ nội bộ, thêm gdrive/s3 nếu đã kết nối
          const dich: ("storage" | "gdrive" | "s3")[] = ["storage"];
          if (process.env.LOVABLE_API_KEY && process.env.GOOGLE_DRIVE_API_KEY) dich.push("gdrive");
          if (process.env.LOVABLE_API_KEY && process.env.AWS_S3_API_KEY) dich.push("s3");

          // lấy lược đồ để sinh tệp .sql (service role được phép gọi)
          const { data: schema } = await supabaseAdmin.rpc("backup_schema_json");

          const res = await performBackup(supabaseAdmin, {
            loai: "tu_dong",
            dich,
            ghi_chu: "Sao lưu tự động hằng ngày",
            userName: "Hệ thống (tự động)",
            schema: (schema as any) ?? null,
            includeStorage: true,
          });

          // dọn bớt: giữ 30 bản tự động gần nhất
          const { data: olds } = await supabaseAdmin
            .from("backup_lich_su")
            .select("id,file_path")
            .eq("loai", "tu_dong")
            .order("created_at", { ascending: false })
            .range(30, 999);
          if (olds && olds.length) {
            const paths = olds.map((o: any) => o.file_path).filter(Boolean);
            if (paths.length) {
              const { createAdminStorage } = await import("@/lib/storage/server");
              await createAdminStorage(supabaseAdmin).from("database-backups").remove(paths);
            }
            await supabaseAdmin.from("backup_lich_su").delete().in("id", olds.map((o: any) => o.id));
          }

          return Response.json({ ok: true, id: res.record?.id, tables: res.record?.so_bang, rows: res.record?.so_dong });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[daily-backup]", msg);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
