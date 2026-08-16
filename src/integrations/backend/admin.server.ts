/**
 * Supabase admin client (service role) cho Supabase riêng hoặc Lovable Cloud.
 *
 * CHỈ import từ file `*.server.ts` khác, hoặc bằng `await import()` bên trong
 * `.handler()` của server function / server route.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { backendFetch, resolveServerBackend } from "./env";

function createBackendAdminClient() {
  const cfg = resolveServerBackend({ withServiceRole: true });
  const key = cfg.serviceRoleKey;
  if (!key) {
    throw new Error(
      `[backend-admin] Thiếu serviceRoleKey. ` +
      `Đảm bảo đã cấu hình APP_SUPABASE_SERVICE_ROLE_KEY (nếu dùng Supabase riêng) ` +
      `hoặc kết nối Lovable Cloud.`
    );
  }
  return createClient<Database>(cfg.url, key, {
    global: { fetch: backendFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let _admin: ReturnType<typeof createBackendAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createBackendAdminClient>, {
  get(_, prop, receiver) {
    if (!_admin) _admin = createBackendAdminClient();
    return Reflect.get(_admin, prop, receiver);
  },
});

/** Client publishable phía server — dùng cho dữ liệu công khai (RLS as anon). */
export function createServerPublicClient() {
  const cfg = resolveServerBackend();
  return createClient<Database>(cfg.url, cfg.publishableKey, {
    global: { fetch: backendFetch(cfg.publishableKey) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
