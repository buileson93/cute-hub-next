/**
 * Supabase client dùng cho toàn bộ code trình duyệt.
 *
 * - Chưa cấu hình gì  → dùng lại client của Lovable Cloud (`@/integrations/supabase/client`).
 * - Có `VITE_APP_SUPABASE_URL` + `VITE_APP_SUPABASE_PUBLISHABLE_KEY` → dùng Supabase riêng của bạn.
 *
 * Import ở mọi nơi:
 *   import { supabase } from "@/integrations/backend/client";
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase as cloudSupabase } from "@/integrations/supabase/client";
import { backendFetch, resolveBrowserBackend } from "./env";

type Client = typeof cloudSupabase;

function createBackendClient(): Client {
  const cfg = resolveBrowserBackend();

  // Không tạo thêm GoTrue instance thứ hai khi vẫn chạy trên Lovable Cloud.
  if (cfg.provider === "lovable-cloud") return cloudSupabase;

  return createClient<Database>(cfg.url, cfg.publishableKey, {
    global: { fetch: backendFetch(cfg.publishableKey) },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  }) as unknown as Client;
}

let _client: Client | undefined;

export const supabase = new Proxy({} as Client, {
  get(_, prop, receiver) {
    if (!_client) _client = createBackendClient();
    return Reflect.get(_client, prop, receiver);
  },
});

export { resolveBrowserBackend };
