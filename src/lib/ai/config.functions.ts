import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** 
 * Config công khai cho mọi user đăng nhập (không có secret).
 * Được thiết kế decoupled tối đa để bypass các middleware gây lỗi 500.
 */
export const getAiPublicConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      // Dùng import động để TanStack Start không bundle logic backend vào client bundle.
      // Cẩn thận: code bên trong handler chạy trên server (Worker).
      const { resolveServerBackend, backendFetch } = await import("@/integrations/backend/env");
      const { createClient } = await import("@supabase/supabase-js");
      
      const cfg = resolveServerBackend();
      // KEY: dùng key từ env trực tiếp để chắc chắn không bị middleware filter.
      // KEY: Ưu tiên Service Role để đọc config công khai an toàn.
      const env = (globalThis as any).process?.env || {};
      const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || cfg.publishableKey;
      const url = env.SUPABASE_URL || cfg.url;
      
      if (!url || !key) {
        console.warn("getAiPublicConfig: Missing URL or Key on server");
        return { enabled: false, model: "", beta_label: "Beta" };
      }

      const supabase = createClient(url, key, {
        global: { fetch: backendFetch(key) },
        auth: { persistSession: false }
      });

      const { data, error } = await supabase
        .from("ai_config")
        .select("enabled, model, beta_label")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.warn("getAiPublicConfig: Database read error:", error.message);
        return { enabled: false, model: "", beta_label: "Beta" };
      }

      return {
        enabled: Boolean(data?.enabled),
        model: String(data?.model || ""),
        beta_label: String(data?.beta_label || "Beta"),
      };
    } catch (err) {
      console.error("getAiPublicConfig: Fatal runtime error caught:", err);
      return { enabled: false, model: "", beta_label: "Beta" };
    }
  });

// Admin functions still use the original middleware pattern
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const ConfigInput = z.object({
  enabled: z.boolean(),
  provider: z.enum(["lovable", "custom"]),
  model: z.string().min(1),
  base_url: z.string().nullable().optional(),
  api_key_secret_name: z.string().nullable().optional(),
  system_prompt: z.string().min(1),
  max_tokens: z.number().int().min(128).max(16384),
  beta_label: z.string().min(1).max(20),
});

/** Config đầy đủ – chỉ admin. */
export const getAiAdminConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (context.unauthenticated || !context.supabase) {
      throw new Error("Chỉ admin mới xem được cấu hình AI");
    }

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    
    if (!isAdmin) throw new Error("Chỉ admin mới xem được cấu hình AI");
    
    const { data, error } = await context.supabase
      .from("ai_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data;
  });

export const updateAiAdminConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ConfigInput.parse(raw))
  .handler(async ({ data, context }) => {
    if (context.unauthenticated || !context.supabase) {
      throw new Error("Chỉ admin mới sửa được cấu hình AI");
    }

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    
    if (!isAdmin) throw new Error("Chỉ admin mới sửa được cấu hình AI");
    
    const { error } = await context.supabase
      .from("ai_config")
      .update({ ...data, updated_by: context.userId })
      .eq("id", 1);
    
    if (error) throw new Error(error.message);
    return { ok: true };
  });

