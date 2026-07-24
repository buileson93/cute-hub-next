// Ghi log server-side cho các nỗ lực INSERT vào `he_thong_thanh_phan` bị lỗi
// (đặc biệt permission denied 42501). Dùng supabaseAdmin để bypass RLS và
// đảm bảo log luôn ghi được — kể cả khi phiên user đã hỏng.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface LogInput {
  reason: string;
  code?: string | null;
  payload?: Record<string, unknown> | null;
  he_thong_id?: string | null;
  ma_thanh_phan?: string | null;
}

export const logThanhPhanInsertFailure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: LogInput) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "insert_failed",
      entity: "he_thong_thanh_phan",
      entity_id: data.ma_thanh_phan ?? data.he_thong_id ?? null,
      he_thong_id: data.he_thong_id ?? null,
      severity: "error",
      detail: {
        operation: "INSERT",
        reason: data.reason,
        code: data.code ?? null,
        payload: data.payload ?? {},
      } as never,
    } as never);
    return { ok: true };
  });
