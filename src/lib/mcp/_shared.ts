import { type ToolContext } from "@lovable.dev/mcp-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Supabase client chạy dưới quyền user (RLS áp dụng). */
export function supabaseForUser(ctx: ToolContext): SupabaseClient {
  const token = ctx.getToken();
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function textResult(obj: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
    structuredContent: obj as Record<string, unknown>,
  };
}

export function errResult(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập – vui lòng kết nối lại MCP với tài khoản MIRATS.");
  return null;
}