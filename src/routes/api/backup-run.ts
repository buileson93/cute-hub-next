import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Sao lưu CSDL có phát tiến trình theo thời gian thực (NDJSON stream).
 * POST /api/backup-run  — header Authorization: Bearer <token> (bắt buộc Admin)
 * body: { dich?: ("storage"|"gdrive"|"s3")[] }
 *
 * Mỗi dòng trả về là 1 JSON: { phase, message, pct } … dòng cuối { done, record, dongBo } hoặc { error }.
 */
export const Route = createFileRoute("/api/backup-run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return Response.json({ error: "Backend chưa cấu hình" }, { status: 500 });
        }

        // ---- Xác thực người dùng + quyền Admin ----
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token || token.split(".").length !== 3) {
          return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
        }

        const userClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
        const userId = claims?.claims?.sub as string | undefined;
        if (cErr || !userId) return Response.json({ error: "Phiên không hợp lệ" }, { status: 401 });

        const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (!isAdmin) return Response.json({ error: "Chỉ Admin được sao lưu" }, { status: 403 });

        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        const dich: ("storage" | "gdrive" | "s3")[] = Array.isArray(body?.dich) && body.dich.length
          ? body.dich
          : ["storage"];

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { performBackup } = await import("@/lib/backup.server");

        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("ho_ten,email")
          .eq("id", userId)
          .maybeSingle();
        const { data: schema } = await userClient.rpc("admin_list_schema");

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (obj: any) => {
              try {
                controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
              } catch {
                /* stream đã đóng */
              }
            };
            try {
              const res = await performBackup(supabaseAdmin, {
                loai: "thu_cong",
                dich,
                ghi_chu: null,
                userId,
                userName: (prof as any)?.ho_ten ?? (prof as any)?.email ?? null,
                schema: (schema as any) ?? null,
                includeStorage: true,
                onProgress: (p) => send(p),
              });
              send({ done: true, record: res.record, dongBo: res.dongBo, storage: res.storage });
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.error("[backup-run]", msg);
              send({ error: msg });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
