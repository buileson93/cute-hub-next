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

          let deletedCount = 0,
            abortedCount = 0,
            failedCount = 0;
          const details: { key: string; action: string; ok: boolean; error?: string }[] = [];

          for (const row of expired ?? []) {
            try {
              const uploadId = (row.meta as any)?.uploadId;
              let r2Success = false;

              // 1. Nếu là multipart đang dở, hủy trên R2 trước
              if (uploadId) {
                try {
                  await r2MultipartAbort(row.key, uploadId);
                  abortedCount++;
                } catch (abortErr: any) {
                  // Vẫn tiếp tục thử xóa file, vì MultipartAbort có thể fail nếu đã expired trên R2
                  console.warn(`[r2-cleanup] Abort fail for ${row.key}:`, abortErr.message);
                }
              }

              // 2. Xóa object trên R2
              try {
                await r2Delete(row.key);
                r2Success = true;
              } catch (delErr: any) {
                // Nếu R2 báo lỗi (không phải 404), KHÔNG xóa DB để có thể retry sau
                // AWS S3 client ném lỗi 404 là "NoSuchKey"
                if (delErr.name === "NoSuchKey") {
                  r2Success = true; // Coi như thành công vì file không tồn tại
                } else {
                  throw delErr;
                }
              }

              // 3. Chỉ xóa metadata trong DB nếu R2 đã được dọn dẹp xong
              if (r2Success) {
                const { error: dbErr } = await supabaseAdmin.from("r2_file").delete().eq("key", row.key);
                if (dbErr) throw dbErr;
                deletedCount++;
                details.push({ key: row.key, action: "delete", ok: true });
              }
            } catch (err: any) {
              failedCount++;
              details.push({ key: row.key, action: "delete", ok: false, error: err.message });
            }
          }

          await supabaseAdmin
            .from("r2_access_log")
            .delete()
            .lt("created_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString());

          await auditPublicApiCall(endpoint, "success", {
            requestId,
            deleted: deletedCount,
            aborted: abortedCount,
            failed: failedCount,
            details: details.filter((d) => !d.ok), // Chỉ lưu log lỗi chi tiết
          });
          return Response.json({
            ok: true,
            deleted: deletedCount,
            aborted: abortedCount,
            failed: failedCount,
            checked: expired?.length ?? 0,
            details,
          });

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
