import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

/**
 * Bootstrap admin đầu tiên. No-op nếu đã có admin trong hệ thống.
 * POST /api/public/hooks/bootstrap-admin
 * headers: { "x-bootstrap-secret": <BOOTSTRAP_ADMIN_SECRET> }
 * body: { email, password, ho_ten? }
 *
 * Bảo mật:
 * - Bắt buộc gửi header x-bootstrap-secret khớp với env server-only, so sánh
 *   theo constant-time để tránh backdoor tạo admin bởi người dùng ẩn danh.
 * - Từ chối nếu đã tồn tại admin.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const Route = createFileRoute("/api/public/hooks/bootstrap-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const expectedSecret = process.env.BOOTSTRAP_ADMIN_SECRET;
          if (!expectedSecret) {
            // Không cấu hình secret => tắt hoàn toàn endpoint.
            return Response.json({ error: "Not found" }, { status: 404 });
          }

          const provided = request.headers.get("x-bootstrap-secret") ?? "";
          if (!safeEqual(provided, expectedSecret)) {
            console.warn("[bootstrap-admin] Unauthorized attempt", {
              ip: request.headers.get("x-forwarded-for") ?? "unknown",
              time: new Date().toISOString(),
            });
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = await request.json() as { email?: string; password?: string; ho_ten?: string };
          if (!body.email || !body.password) {
            return Response.json({ error: "email + password required" }, { status: 400 });
          }

          const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

          const { count } = await supabaseAdmin
            .from("user_roles")
            .select("*", { count: "exact", head: true })
            .eq("role", "admin");
          if ((count ?? 0) > 0) {
            return Response.json({ ok: true, message: "Admin already exists", skipped: true });
          }

          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
            user_metadata: { ho_ten: body.ho_ten ?? "Quản trị hệ thống" },
          });
          if (error || !created.user) {
            return Response.json({ error: error?.message ?? "create failed" }, { status: 500 });
          }
          // trigger handle_new_user đã cấp admin role cho email này rồi.
          // fallback: cấp thủ công nếu email khác
          const { count: c2 } = await supabaseAdmin
            .from("user_roles")
            .select("*", { count: "exact", head: true })
            .eq("user_id", created.user.id).eq("role", "admin");
          if ((c2 ?? 0) === 0) {
            await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
          }
          console.info("[bootstrap-admin] Admin provisioned", {
            id: created.user.id,
            time: new Date().toISOString(),
          });
          return Response.json({ ok: true, id: created.user.id });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
